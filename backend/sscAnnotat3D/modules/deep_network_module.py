import getpass
import os
import random

from sscDeepsirius.controller.host_network_controller import \
    HostNetworkController as NetworkController
from sscDeepsirius.utils import dataset, gpu
from sscRemoteProcess import modules as remote_modules
from sscRemoteProcess import tepui
from sscRemoteProcess import utils as remote_utils

from sscAnnotat3D import utils
from sscAnnotat3D.repository import data_repo

from ..api import __ui_path__, _tepui_partitions, _annotat3d_singularity_img_path

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
    def __init__(self):
        self._is_running = False
        self._discard_network_instances = False

        self._data_info = None
        self._data = None

        self._tensorboard_server = None
        self._frozen_model = None
        self._dataset_file = None

        self._workspace_path = None #deeplearning_workspace_dialog.__workspace__
        self._network_controller = None
        self._tepui_connection = None

        self.networkModels = []

        self.lossType = sorted(_loss.keys())
        self.partition = sorted(_tepui_partitions.keys())
        self.optimiserType =  sorted(_optimiser.keys())

        self.maxIter = None
        # self.maxEpochs = None # why this?

        self.networkModels = []
        self.networkModelsCurrent = None

        self._availableGPUs = gpu.get_gpus()

        self._custom_settings_value = {}

        self.log_msg('Local Available GPUS:\n {}'.format('\n '.join(self._availableGPUs)))

        self._network_instance = None
        self._network_instance_name = None

        self.destroyed.connect(self._destroy_resources)

    def set_workspace_path(self, path):
        self._workspace_path = path

    def set_network_controller(self):
        self._network_controller = NetworkController(self._workspace_path, streaming_mode=True)

    # use the params json in the sscDeepsirius network workspace
    # to set pass extra parameters for specific networks
    def set_custom_settings(self, params):
        self._custom_settings_value = params

    def activate(self, params): # continue this
        self.init_logger('\nStarting Active Network')
        self._user_params = params # num_gpus, loss_type, optimiser, cuda_devices, batch_size, max_iter, learning_rate
        self.set_network_controller()
        self.networkModels = sorted(self._network_controller.network_models)
        self.lossType = sorted(_loss.keys())
        self._tensorboard_server = self._network_controller.start_tensorboard(self._networkModel)
        self.log_msg('Tensorboard: {}'.format(self._tensorboard_server))
        url = self._tensorboard_server
        self.log_msg('Running on {}'.format(url))
        self._set_start_running()

    def load_cache_dir(self, set_cache_dir):
        cache_dir = set_cache_dir
        if not cache_dir:
            return

        self.cacheEdit.setText(cache_dir)

    def _update_machine(self, current):
        self.machine = current

    def change_cache_dir(self, newCacheDir):
        self._network_controller.set_cache_base_dir(newCacheDir)
        self._discard_network_instances = True

    def save_network(self, set_network_name):
        cur_network_name = self.networkModelsCurrent
        new_network_name = set_network_name

        #underscore is a reserved character in network name
        new_network_name = new_network_name.replace('_', '-')
        nets = self.networkModels
        if new_network_name in nets:
            self.log_msg('Sorry', 'The network {} already exists.'.format(new_network_name))
        else:
            self._network_controller.copy_network(cur_network_name, new_network_name)

            self.networkModels.clear()
            self.networkModels.insertItems(0, sorted(self._network_controller.network_models))


    def _empty_layout(self, layout):
        if layout is not None:
            while layout.count():
                item = layout.takeAt(0)
                widget = item.widget()
                if widget is not None:
                    widget.deleteLater()
                else:
                    self._empty_layout(item.layout())

    def update_max_iter(self):
        network = self.networkModels.currentText()
        self.maxIter = self._network_controller.checkpoint(network)

    def on_network_changed(self):
        self.log_msg('on network changed')
        self.update_max_iter()
        self.set_custom_params()
        self.start_tensorboard_server()        

    def start_tensorboard_server(self):
        self._tensorboard_server = self._network_controller.start_tensorboard(self.network)

    def _update_status_network_instance(self):
        status, message = self._network_controller.network_instance_status
        self.network_instance_status.setChecked(status)
        if not status:
            message = message + ' (Contact system administrator)'
        self.network_instance_status.setText(message)

    def _destroy_resources(self):
        self.log_msg('DEBUG: destroying ...')
        if self._network_instance is not None:

        self._network_controller.destroy_network_instance(self._network_instance_name)
        self._network_instance = None
        self._network_instance_name = None

    def _set_start_running(self):
        self._is_running = True
        self.network_instance_status.setText('Network instance is running ...')

    def _set_stop_running(self):
        self._update_status_network_instance()
        self._is_running = False
        self._log_thread = None
        self.log_msg('DEBUG: set stop running called ...')
        self.log_msg('DEBUG: transaction: {}'.format(self._sentry_transaction))
        try:
            self._sentry_transaction.__exit__(None, None, None)
        except:
            self.log_msg('WARNING: Could not finish transaction. Perhaps it is already finished?')

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
        if self._log_thread is not None:
            self._set_start_running()
            self._log_thread.start()

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

            self.log_msg('DEBUG: Run finetune inside network instance ...')

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
        def run():

            self.log_msg('DEBUG: loss ->')
            self.log_msg('DEBUG: {}'.format(_loss))
            active_gpus = self._active_gpus
            loss_type = _loss[self.lossType]
            optimiser = _optimiser[self.optimiserType]

            if self._check_run_local():
                network_instance, log = self._network_controller.train(self._network_instance,
                                                                       self._dataset_file,
                                                                       num_gpus=len(active_gpus),
                                                                       cuda_devices=','.join(map(str, active_gpus)),
                                                                       batch_size=self.batchSizeSpinBox.value(),
                                                                       max_iter=self.maxIterSpinBox.value(),
                                                                       lr=self.learnRateSpinBox.value(),
                                                                       loss_type=loss_type,
                                                                       optimiser=optimiser,
                                                                       **self._custom_params_value())
            else:  #tepui
                log = remote_utils.PipeStream()
                partition_info = _tepui_partitions[self.partition.currentText()]
                with remote_modules.slurm.slurm(self._tepui_connection,
                                                partition_info['partition'],
                                                ngpus=partition_info['num_gpus']):
                    with remote_modules.singularity.singularity(self._tepui_connection,
                                                                _annotat3d_singularity_img_path,
                                                                mount={'/ibira': '/ibira'}):
                        remote_modules.deepsirius.train(self._tepui_connection,
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

            return log

        return run

    def _check_run_tepui(self):
        return self.machine == 'tepui'

    def _check_run_local(self):
        return self.machine == 'local'

    def _connect_tepui(self):
        pass
        # if self._tepui_connection is None:
        #     try:
        #         username = QtCore.QSettings('login').value('username', getpass.getuser())
        #         self.log_msg('DEBUG: username: {}'.format(username))
        #         self._tepui_connection = tepui.TepuiConnection(username)
        #     except remote_utils.RemoteProcessException as e:
        #         login_dialog = LoginDialog(self)
        #         login_dialog.exec_()
        #         self.log_msg('DEBUG: {}'.format(login_dialog.accepted))
        #         if login_dialog.accepted:
        #             self._tepui_connection = tepui.TepuiConnection(*login_dialog.auth_info())
        #         if self._tepui_connection:
        #             self.log_msg('DEBUG: {}'.format(self._tepui_connection))
        #             self.log_msg('DEBUG: {}'.format(self._tepui_connection.run('hostname')))

    def train(self):
        if self._check_run_tepui():
            if self._tepui_connection is None:
                self._connect_tepui()

        self.log_msg('Creating network instance (training) ...\n')

        # self._sentry_transaction = sentry_sdk.start_transaction(name='Training', op='deeplearning')
        # self._sentry_transaction.__enter__()
        # sentry_sdk.set_context('Dataset Params', self._stats)

        self._log_thread = ThreadWorkerWeb(self._train_runnable())
        self._train_runnable()

        self._set_network_instance(self.selectedNetwork)


    def finetune(self):

        if self._check_run_tepui():
            if self._tepui_connection is None:
                self._connect_tepui()

        self.log_msg('Creating network instance (finetune)...\n')
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
        self.log_msg('DEBUG: max labels >>> {}'.format(m))
        values = dataset.get_count(labels, m)
        keys = range(m)
        return {k: v for (k, v) in zip(keys, values)}

    def _dataset_info_runnable(self):
        def run():
            self.log_msg('DEBUG: RUN THREAD ... ')
            _dataset = self._data

            self.log_msg('DEBUG: {}'.format(dataset))

            if dataset is None:
                return

            data = _dataset['data']
            self.log_msg('DEBUG: Compute dataset info')

            stats = dataset.get_stats(_dataset)

            self._data_info = (data.shape[0], data.shape[1], data.shape[2:], stats['data_mean'], stats['data_std'],
                               stats['data_min'], stats['data_max'], _dataset['num_classes'], stats['nlabels'],
                               stats['label_count'], stats['weight_mean'], stats['weight_std'], stats['weight_min'],
                               stats['weight_max'])

            self._stats = stats
            self.log_msg('DEBUG: Done ...')

        return run

    def _get_dataset_info(self):
        self.datasetEdit.setText(self._dataset_file)
        self.datasetInfoTextEdit.setPlainText('Computing dataset info ...')
        # self._log_thread = utils.ThreadWorker(self._dataset_info_runnable())
        self._log_thread.finished.connect(self._update_dataset_info)
        self._log_thread.start()

    def _update_dataset_info(self):

        if self._stats['nlabels'] != self._data['num_classes']:
            self.log_msg(message='Label images have {} classes. But your dataset indicates {} classes'.format(
                self._stats['nlabels'], self._data['num_classes']))
            return

        self.tabWidget.setTabEnabled(2, True)
        self.tabWidget.setTabEnabled(3, True)

        if self._data is not None:
            self.trainButton.setEnabled(True)
            self.finetuneButton.setEnabled(True)

        if self._data_info is not None:
            self.datasetInfoTextEdit.setPlainText(_dataset_info_template.format(*self._data_info))

    def load_dataset(self):
        self._data = dataset.load_dataset(self._dataset_file)
        self._get_dataset_info()
        self.log_msg('Dataset Params', self._data)



