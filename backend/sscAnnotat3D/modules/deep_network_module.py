import getpass
import os
import random

from sscDeepsirius.controller.host_network_controller import \
    HostNetworkController as NetworkController
from sscDeepsirius.utils import dataset, gpu
# from sscRemoteProcess import modules as remote_modules
# from sscRemoteProcess import tepui
# from sscRemoteProcess import utils as remote_utils

from sscAnnotat3D import utils
from sscAnnotat3D.repository import data_repo

# from ..api import __ui_path__, _tepui_partitions, _annotat3d_singularity_img_path

_tepui_partitions = {
    '1 GPU': {
        'partition': 'annot1',
        'num_gpus': 1,
    },
    '2 GPUs': {
        'partition': 'annot2',
        'num_gpus': 2,
    },
    '4 GPUs': {
        'partition': 'annot4',
        'num_gpus': 4
    }
}

_loss = {
    'Cross Entropy': 'CrossEntropy',
    'Dice': 'Dice',
    'Cross Entropy + Dice': 'DicePlusXEnt',
}

_optimiser = {'Adam': 'adam', 'Gradient Descent': 'gradientdescent'}

_available_model_types = "Model  (*.model.tar.gz *.MODEL.TAR.GZ)"

_available_dataset_types = "HD5  (*.h5 *.H5)"

_available_frozen_types = "PB  (*.pb *.PB)"

_dataset_info_template = """Number of Images: {}
Number of Samples: {}
Dimensions: {}
Data Info:
    Mean: {}
    Std: {}
    Min: {}
    Max: {}
Label Info:
    # classes: {}
    # labels: {}
    Hist: {}
Weight Info:
    Mean: {}
    Std: {}
    Min: {}
    Max: {}
"""

def data_repo_logger(log_thread):
    if log_thread is not None:
        for line in log_thread:
            if line is not None:
                data_repo.set_log_message('ThreadWorkerWeb: {}'.format(line))
    




class deepNetworkModule():
    def __init__(self, workspacePath):
        self._workspace_path = workspacePath
        
        # network
        self._network_controller = NetworkController(workspacePath, streaming_mode=True)
        self._network_instance = None
        self._network_instance_name = None
        self._networkModels = []
        self._networkModelsActive = None

        self._network_custom_settings = {}

        # dataset
        self._dataset_file = None
        self._data_info = None
        self._data = None

        # system settings
        self._availableGPUs = gpu.get_gpus()

        # running info
        self._is_running = False
        self._tensorboard_server = None
        self._frozen_model = None

    # called from the outisde
    def start_training(self, params):
        self.start_tensorboard_server()
        self.set_cache_dir(params['cache_dir'])


    # use the params json in the sscDeepsirius network workspace
    # to set pass extra parameters for specific networks
    def set_custom_settings(self, params):
        self._network_custom_settings = params

    def start_tensorboard_server(self): 
        self._tensorboard_server = self._network_controller.start_tensorboard(self._networkModelsActive)
        data_repo_logger('Tensorboard: {}'.format(self._tensorboard_server))

    def set_cache_dir(self, new_cache_dir):
        self._network_controller.set_cache_base_dir(new_cache_dir)

    def save_network(self, set_network_name_checked):
        cur_network_name = self.networkModelsCurrent
        #underscore is a reserved character in network name
        new_network_name = set_network_name_checked.replace('_', '-')

        self._network_controller.copy_network(cur_network_name, new_network_name)
        self.networkModels = sorted(self._network_controller.network_models)

    def update_max_iter(self): # bruno: is this a last iter? 
        network = self.networkModels.currentText()
        self.maxIter = self._network_controller.checkpoint(network)      

    def _update_status_network_instance(self):
        status, message = self._network_controller.network_instance_status
        self.network_instance_status.setChecked(status)
        if not status:
            message = message + ' (Contact system administrator)'
        self.network_instance_status.setText(message)


    def _set_start_running(self):
        self._is_running = True
        self.network_instance_status.setText('Network instance is running ...')

    def _set_stop_running(self):
        self._update_status_network_instance()
        self._is_running = False
        data_repo_logger('Stop running')
        data_repo_logger('DEBUG: set stop running called ...')
        data_repo_logger('DEBUG: transaction: {}'.format(self._sentry_transaction))
        try:
            self._sentry_transaction.__exit__(None, None, None)
        except:
            data_repo_logger('WARNING: Could not finish transaction. Perhaps it is already finished?')

    def _set_network_instance(self, network_instance_name):

        if self._network_instance is not None:
            if self._network_instance_name != network_instance_name or self._discard_network_instances:
                self._network_controller.destroy_network_instance(self._network_instance_name)
                self._network_instance = None
                self._network_instance_name = None
                self._discard_network_instances = False

        if self._network_instance is None:
            self._network_instance_name = network_instance_name

            try:
                network_instance = self._network_controller.get_network_instance(self._network_instance_name)
            except:
                network_instance = None

            if network_instance is not None:
                if self._is_running:
                    return 'Error: There is already a network instance running.'
                else:
                    network_instance.remove(force=True)

            self.network_instance_status.setText(
                'Building network instance image ... (this might take a couple minutes)')

            # self._build_thread = utils.ThreadWorker(self._deploy_network_instance_runnable())
            # self._build_thread.finished.connect(self._deploy_finished)
            # self._build_thread.start()
        else:
            self._deploy_finished()

    def _deploy_finished(self):
        self._update_status_network_instance()

    def import_net(self, import_model_path, new_network_name):
        self._network_controller.import_model(import_model_path, new_network_name)

    def export(self, export_model_name):
        export_model_path = self._workspace_path+'/frozen/'+export_model_name+'model.tar.gz'
        self._network_controller.export_model(self.network, export_model_path)

    def freeze(self, frozen_model_name, network_instance):
        self._frozen_model = self._workspace_path+'/frozen/'+frozen_model_name+'.pb'
        self._set_network_instance(network_instance)

    def closeEvent(self, event):
        if self._network_instance is not None:
            self._destroy_resources()

    def _freeze_runnable(self):
        def run():
            frozen_model_filename = os.path.basename(self._frozen_model)
            network_instance, log = self._network_controller.freeze(self._network_instance,
                                                                    frozen_model_filename,
                                                                    batch_size=self.batchSizeSpinBox.value(),
                                                                    **self._custom_params_value())
            return log

        return run

    def _deploy_network_instance_runnable(self):
        def run():
            self._network_instance = self._network_controller.deploy_network_instance(self._network_instance_name)

        return run

    def _finetune_runnable(self):
        def run():
            active_gpus = self._active_gpus
            optimiser = _optimiser[self.optimiserType.currentText()]
            loss_type = _loss[self.lossType.currentText()]

            self.logTextEdit.moveCursor(QtGui.QTextCursor.Start)
            self.logTextEdit.insertPlainText('')

            data_repo_logger('DEBUG: Run finetune inside network instance ...')

            if self._check_run_local():

                network_instance, log = self._network_controller.finetune(self._network_instance,
                                                                          self._dataset_file,
                                                                          num_gpus=len(active_gpus),
                                                                          cuda_devices=','.join(map(str, active_gpus)),
                                                                          batch_size=self.batchSizeSpinBox.value(),
                                                                          max_iter=self.maxIterSpinBox.value(),
                                                                          lr=self.learnRateSpinBox.value(),
                                                                          loss_type=loss_type,
                                                                          optimiser=optimiser,
                                                                          **self._custom_params_value())

            else:

                log = remote_utils.PipeStream()
                partition_info = _tepui_partitions[self.partition.currentText()]
                with remote_modules.slurm.slurm(self._tepui_connection,
                                                partition_info['partition'],
                                                ngpus=partition_info['num_gpus']):
                    with remote_modules.singularity.singularity(self._tepui_connection,
                                                                _annotat3d_singularity_img_path,
                                                                mount={'/ibira': '/ibira'}):
                        remote_modules.deepsirius.finetune(self._tepui_connection,
                                                           self._workspace_path,
                                                           self.networkModels.currentText(),
                                                           self._dataset_file,
                                                           batch_size=self.batchSizeSpinBox.value(),
                                                           max_iter=self.maxIterSpinBox.value(),
                                                           lr=self.learnRateSpinBox.value(),
                                                           loss_type=loss_type,
                                                           optimiser=optimiser,
                                                           num_gpus=partition_info['num_gpus'],
                                                           custom_param_values=self._custom_params_value(),
                                                           out_stream=log,
                                                           run_async=True)
                # print(type(log))
                log = remote_utils.pipe_iter(log.pipe_recv)
            return log

        return run

    def _train_runnable(self):
        # this method is no longer used for the web version. See train().
        pass

    def train(self):
        # method thal runs training for the active network instance locally
        data_repo_logger('Creating network instance (training) ...\n')

        # start training (returns a log thread)
        data_repo_logger('DEBUG: {}'.format(_loss))
        # _network_controller.train returns a network instance and a log thread
        # as the returned network instance is not used on the legacy code, that variable is omitted here
        _, log_thread = self._network_controller.train(self._network_instance,
                                                        self._dataset_file,
                                                        num_gpus=self.num_gpus,
                                                        cuda_devices=','.join(map(str, self._active_gpus)),
                                                        batch_size=self.batchSize,
                                                        max_iter=self.maxIter,
                                                        lr=self.learnRate,
                                                        loss_type=self.lossType,
                                                        optimiser=self.optimiser,
                                                        **self._custom_params_value()) 

        # posts the log thread as separate lines on data repo
        data_repo_logger(log_thread)

        self._set_network_instance(self.selectedNetwork)


    def finetune(self):

        data_repo_logger('Creating network instance (finetune)...\n')
        # sentry_sdk.set_context('Dataset Params', self._stats)

        # self._log_thread = utils.ThreadWorker(self._finetune_runnable())
        self._finetune_runnable()
        # self._log_thread.append_log.connect(self._append_log)
        # self._log_thread.finished.connect(self._set_stop_running)

        self._set_network_instance(self.networkModels.currentText())

    def _destroy_network_instance(self):
        if self._network_instance is not None:
            try:
                self._network_controller.destroy_network_instance(self._network_instance_name)
            except:
                print('Already destroyed network instance')

            self._network_instance = None
            self._network_instance_name = None

    def _count_labels(self, labels):
        m = int(dataset.get_max(labels) + 1)
        data_repo_logger('DEBUG: max labels >>> {}'.format(m))
        values = dataset.get_count(labels, m)
        keys = range(m)
        return {k: v for (k, v) in zip(keys, values)}

    def _dataset_info_runnable(self):
        def run():
            data_repo_logger('DEBUG: RUN THREAD ... ')
            _dataset = self._data

            data_repo_logger('DEBUG: {}'.format(dataset))

            if dataset is None:
                return

            data = _dataset['data']
            data_repo_logger('DEBUG: Compute dataset info')

            stats = dataset.get_stats(_dataset)

            self._data_info = (data.shape[0], data.shape[1], data.shape[2:], stats['data_mean'], stats['data_std'],
                               stats['data_min'], stats['data_max'], _dataset['num_classes'], stats['nlabels'],
                               stats['label_count'], stats['weight_mean'], stats['weight_std'], stats['weight_min'],
                               stats['weight_max'])

            self._stats = stats
            data_repo_logger('DEBUG: Done ...')

        return run

    def _get_dataset_info(self):
        self.datasetEdit.setText(self._dataset_file)
        self.datasetInfoTextEdit.setPlainText('Computing dataset info ...')
        data_repo_logger(self._update_dataset_info)

    def _update_dataset_info(self):

        if self._stats['nlabels'] != self._data['num_classes']:
            data_repo_logger('Label images have {} classes. But your dataset indicates {} classes'.format(
                self._stats['nlabels'], self._data['num_classes']))
            return

    def load_dataset(self):
        self._data = dataset.load_dataset(self._dataset_file)
        self._get_dataset_info()
        data_repo_logger('Dataset Params', self._data)



