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

from . import __ui_path__, _tepui_partitions, _annotat3d_singularity_img_path, deeplearning_workspace_dialog

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


class activeNetwork():
    def __init__(self):
        self.init_logger('Starting Active Network')

        self._is_running = False
        self._discard_network_instances = False

        self._data_info = None
        self._data = None

        self._tensorboard_server = None
        self._frozen_model = None
        self._dataset_file = None

        self.trainButton.setEnabled(False)
        self.finetuneButton.setEnabled(False)

        self.trainButton.clicked.connect(self.train)
        self.finetuneButton.clicked.connect(self.finetune)
        self.saveNetworkButton.clicked.connect(self.save_network)
        self.cacheButton.clicked.connect(self.change_cache_dir)

        self.freezeButton.clicked.connect(self.freeze)
        self.exportButton.clicked.connect(self.export)
        self.importButton.clicked.connect(self.import_net)

        self.cacheButton.clicked.connect(self.load_cache_dir)

        self.loadDatasetButton.clicked.connect(self.load_dataset)

        self._workspace = deeplearning_workspace_dialog.__workspace__
        self._network_controller = None
        self._tepui_connection = None

        self.log_msg('{}'.format(dir(self._network_controller)))

        self.log_msg('{}'.format(self._network_controller.network_models))

        self.networkModelsComboBox.clear()
        self.networkModelsComboBox.insertItems(0, sorted(self._network_controller.network_models))

        self.lossTypeComboBox.clear()
        self.lossTypeComboBox.insertItems(0, sorted(_loss.keys()))

        self.partitionComboBox.clear()
        self.partitionComboBox.insertItems(0, sorted(_tepui_partitions.keys()))

        self.optimiserTypeComboBox.clear()
        self.optimiserTypeComboBox.insertItems(0, sorted(_optimiser.keys()))

        self.maxIterSpinBox.valueChanged.connect(self._value_changed_max_iter)
        self.maxEpochsSpinBox.valueChanged.connect(self._value_changed_max_epochs)

        self.networkModelsComboBox.currentTextChanged.connect(self.on_network_changed)

        self._gpus = gpu.get_gpus()

        self._custom_params_ui = {}

        self.log_msg('{}'.format(self._gpus))
        self._gpus_checkbox = [getattr(self, 'gpu{}CheckBox'.format(i)) for i, gpu in enumerate(self._gpus)]
        for i in range(len(self._gpus)):
            self._gpus_checkbox[i].setText(self._gpus[i])
            self._gpus_checkbox[i].setEnabled(True)
            self._gpus_checkbox[i].stateChanged.connect(self._update_total_batch)

        # select random gpu default
        if len(self._gpus_checkbox):
            self._gpus_checkbox[random.randint(0, len(self._gpus_checkbox) - 1)].setChecked(True)

        self.destroyed.connect(self._destroy_resources)

        self._network_instance = None
        self._network_instance_name = None

        self.log_msg('disable tabs')

        self._update_status_network_instance()

        self.machineComboBox.currentTextChanged.connect(self._update_machine)

        self.partitionComboBox.currentTextChanged.connect(self._update_total_batch)

        self.batchSizeSpinBox.valueChanged.connect(self._update_total_batch)
        self._update_total_batch()

        self.show()

        self.boardWebView.load('about:blank')

        self._update_machine()

        self.update_max_iter()
        self.create_form_custom_params()

        self.boardWebView.page().profile().downloadRequested.connect(_downloadRequested)
        self.clipboardUrlButton.clicked.connect(self._copy_clipboard_url)

        self.log_msg('shown')

        utils.add_variable_console({'network': self._network_controller})


    def init_logger(init_msg : str = '\nStarting message logger queue.\n'):
        data_repo.init_logger(init_msg)

    def log_msg(msg):
        data_repo.set_log_message(msg)

    def get_msg():
        return data_repo.dequeue_log_message()

    def set_network_controller(self):
        try: 
            self._networkModel = data_repo.get_deep_model(key='deep_learning')
            self._workspacePath = self._networkModel['deep_model_path']
        except Exception as e:
            return e

        # try network controller
        try:
            self._network_controller = NetworkController(self._workspacePath, streaming_mode=True)
        except Exception as e:
            return e

    def load_cache_dir(self, set_cache_dir):
        cache_dir = set_cache_dir
        if not cache_dir:
            return

        self.cacheEdit.setText(cache_dir)

    def _update_machine(self):
        machine = self.machineComboBox.currentText()
        if machine.lower() == 'local':
            self.remoteGroupBox.setVisible(False)
            self.cudaGroupBox.setVisible(True)
        elif machine.lower() == 'tepui':
            self.cudaGroupBox.setVisible(False)
            self.remoteGroupBox.setVisible(True)

    def _value_changed_max_epochs(self):
        pass

    def _value_changed_max_iter(self):
        pass

    def change_cache_dir(self):
        self._network_controller.set_cache_base_dir(self.cacheEdit.text())
        self._discard_network_instances = True

    def save_network(self, set_network_name):
        cur_network_name = self.networkModelsComboBox.currentText()
        new_network_name, ok = set_network_name

        if ok and new_network_name:
            #underscore is a reserved character in network name
            new_network_name = new_network_name.replace('_', '-')
            nets = self._network_controller.network_models
            if new_network_name in nets:
                self.log_msg("Sorry", "The network {} already exists.".format(new_network_name))
            else:
                self._network_controller.copy_network(cur_network_name, new_network_name)

                self.networkModelsComboBox.clear()
                self.networkModelsComboBox.insertItems(0, sorted(self._network_controller.network_models))

    def _update_total_batch(self):
        batch_size = self.batchSizeSpinBox.value()
        num_gpus = self._num_gpus

        self.totalBatchLabel.setText(str(batch_size * num_gpus))

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
        network = self.networkModelsComboBox.currentText()
        self.maxIterSpinBox.setValue(self._network_controller.checkpoint(network))

    def on_network_changed(self):
        self.log_msg('on network changed')
        self.update_max_iter()
        self.create_form_custom_params()
        self.start_server()

    #use the params json in the sscDeepsirius network workspace
    #to set pass extra parameters for specific networks
    def create_form_custom_params(self):
        self._custom_params_ui = {}

        layout = self.networkParamsLayout
        self._empty_layout(layout)

        network = self.networkModelsComboBox.currentText()
        params = self._network_controller.network_list_params(network)

        self.log_msg('{}'.format(params))

        for k in params:
            self._add_custom_entry(layout, k, params[k])

        self.networkParamsPage.adjustSize()

    # this needs 
    def _add_custom_entry(self):
        pass

    # def _add_custom_entry(self, layout, k, v):
    #     if v['type'] == 'Group':
    #         #add groupbox
    #         group = QtWidgets.QGroupBox(k)
    #         layout.addWidget(group)
    #         group_layout = QtWidgets.QVBoxLayout()
    #         group.setLayout(group_layout)
    #         for _k in v['value']:
    #             self._add_custom_entry(group_layout, _k, v['value'][_k])
    #         group_layout.addItem(vspacer)
    #         group.adjustSize()
    #     else:  #type == Combo
    #         var_name = v['argname']
    #         combo = self._create_labeled_combobox(layout, k)
    #         for item in v['value']:
    #             combo.addItem(item)
    #         self._custom_params_ui[var_name] = combo

    def start_server(self):
        self._tensorboard_server = self._network_controller.start_tensorboard(self.network)
        self.log_msg('Tensorboard: {}'.format(self._tensorboard_server))
        open_url = _open_browser(self._tensorboard_server)
        self.log_msg('{}'.format(open_url))
        self.boardUrlLabel.setText(open_url)
        self.boardWebView.load(self._tensorboard_server)

    def _reload_tensorboard_webview(self):
        self.boardWebView.load(self._tensorboard_server)

    def stop_server(self):
        self.log_msg('Killing: {}'.format(self._tensorboard_server))

    def _update_status_network_instance(self):
        status, message = self._network_controller.network_instance_status
        self.network_instance_status.setChecked(status)
        if not status:
            message = message + ' (Contact system administrator)'
        self.network_instance_status.setText(message)

    @property
    def _num_gpus(self):
        if self._check_run_local():
            return sum([c.isChecked() for c in self._gpus_checkbox])
        else:
            partition_info = _tepui_partitions[self.partitionComboBox.currentText()]
            return partition_info['num_gpus']

    @property
    def _active_gpus(self):
        if self._check_run_local():
            return [i for i in range(len(self._gpus_checkbox)) if self._gpus_checkbox[i].isChecked()]
        else:
            partition_info = _tepui_partitions[self.partitionComboBox.currentText()]
            return [i for i in range(partition_info['num_gpus'])]

    def _destroy_resources(self):
        logging.debug('destroying ...')
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
        logging.debug('set stop running called ...')
        logging.debug('transaction: {}'.format(self._sentry_transaction))
        try:
            self._sentry_transaction.__exit__(None, None, None)
        except:
            logging.warn('Could not finish transaction. Perhaps it is already finished?')

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
                    return "Error: There is already a network instance running."
                else:
                    network_instance.remove(force=True)

            self.network_instance_status.setText(
                "Building network instance image ... (this might take a couple minutes)")

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
        export_model_path = self._workspace+'/frozen/'+export_model_name+'model.tar.gz'
        self._network_controller.export_model(self.network, export_model_path)

    def freeze(self, frozen_model_name, network_instance):
        self._frozen_model = self._workspace+'/frozen/'+frozen_model_name+'.pb'
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
            optimiser = _optimiser[self.optimiserTypeComboBox.currentText()]
            loss_type = _loss[self.lossTypeComboBox.currentText()]

            self.logTextEdit.moveCursor(QtGui.QTextCursor.Start)
            self.logTextEdit.insertPlainText("")

            logging.debug('Run finetune inside network instance ...')

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
                partition_info = _tepui_partitions[self.partitionComboBox.currentText()]
                with remote_modules.slurm.slurm(self._tepui_connection,
                                                partition_info['partition'],
                                                ngpus=partition_info['num_gpus']):
                    with remote_modules.singularity.singularity(self._tepui_connection,
                                                                _annotat3d_singularity_img_path,
                                                                mount={'/ibira': '/ibira'}):
                        remote_modules.deepsirius.finetune(self._tepui_connection,
                                                           self._workspace,
                                                           self.networkModelsComboBox.currentText(),
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

    def _custom_params_value(self):
        return {k: self._custom_params_ui[k].currentText() for k in self._custom_params_ui}

    def _train_runnable(self):
        def run():

            logging.debug('loss ->')
            logging.debug('{}'.format(_loss))
            active_gpus = self._active_gpus
            loss_type = _loss[self.lossTypeComboBox.currentText()]
            optimiser = _optimiser[self.optimiserTypeComboBox.currentText()]
            self.logTextEdit.moveCursor(QtGui.QTextCursor.Start)
            self.logTextEdit.insertPlainText("")

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
                partition_info = _tepui_partitions[self.partitionComboBox.currentText()]
                with remote_modules.slurm.slurm(self._tepui_connection,
                                                partition_info['partition'],
                                                ngpus=partition_info['num_gpus']):
                    with remote_modules.singularity.singularity(self._tepui_connection,
                                                                _annotat3d_singularity_img_path,
                                                                mount={'/ibira': '/ibira'}):
                        remote_modules.deepsirius.train(self._tepui_connection,
                                                        self._workspace,
                                                        self.networkModelsComboBox.currentText(),
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
                # print(type(log))

                # (c, workspace, network, dataset_file, partition, batch_size,
                # max_iter, lr, loss_type, optimiser, ngpus,
                # custom_param_values, **kwargs):

            return log

        return run

    def _check_run_tepui(self):
        return self.machineComboBox.currentText().lower() == 'tepui'

    def _check_run_local(self):
        return self.machineComboBox.currentText().lower() == 'local'

    def _connect_tepui(self):
        if self._tepui_connection is None:
            try:
                username = QtCore.QSettings('login').value('username', getpass.getuser())
                logging.debug('username: {}'.format(username))
                self._tepui_connection = tepui.TepuiConnection(username)
            except remote_utils.RemoteProcessException as e:
                login_dialog = LoginDialog(self)
                login_dialog.exec_()
                logging.debug('{}'.format(login_dialog.accepted))
                if login_dialog.accepted:
                    self._tepui_connection = tepui.TepuiConnection(*login_dialog.auth_info())
                if self._tepui_connection:
                    logging.debug('{}'.format(self._tepui_connection))
                    logging.debug('{}'.format(self._tepui_connection.run('hostname')))

    def train(self):
        qm = QtWidgets.QMessageBox()
        ret = qm.question(self, '', "This operation will reset your current model. Are you sure?", qm.Yes | qm.No)

        if ret == qm.Yes:

            if self._check_run_tepui():
                if self._tepui_connection is None:
                    self._connect_tepui()

            self.tabWidget.setCurrentIndex(_log_tab)

            self.logTextEdit.clear()
            self._append_log('Creating network instance ...\n')

            self._sentry_transaction = sentry_sdk.start_transaction(name='Training', op='deeplearning')
            self._sentry_transaction.__enter__()
            # sentry_sdk.set_context('Dataset Params', self._stats)

            # self._log_thread = utils.ThreadWorker(self._train_runnable())
            # self._log_thread.append_log.connect(self._append_log)
            # self._log_thread.finished.connect(self._set_stop_running)

            self._set_network_instance(self.networkModelsComboBox.currentText())

    def _append_log(self, line):

        self.logTextEdit.moveCursor(QtGui.QTextCursor.End)
        self.logTextEdit.insertPlainText(line)

    def finetune(self):

        if self._check_run_tepui():
            if self._tepui_connection is None:
                self._connect_tepui()

        self.tabWidget.setCurrentIndex(_log_tab)

        self.logTextEdit.clear()
        self._append_log('Creating network instance ...\n')
        self._sentry_transaction = sentry_sdk.start_transaction(name='Finetune', op='deeplearning')
        self._sentry_transaction.__enter__()
        # sentry_sdk.set_context('Dataset Params', self._stats)

        # self._log_thread = utils.ThreadWorker(self._finetune_runnable())
        # self._log_thread.append_log.connect(self._append_log)
        # self._log_thread.finished.connect(self._set_stop_running)

        self._set_network_instance(self.networkModelsComboBox.currentText())

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
        logging.debug("max labels >>> {}".format(m))
        values = dataset.get_count(labels, m)
        keys = range(m)
        return {k: v for (k, v) in zip(keys, values)}

    def _dataset_info_runnable(self):
        def run():
            logging.debug('RUN THREAD ... ')
            _dataset = self._data

            logging.debug('{}'.format(dataset))

            if dataset is None:
                return

            data = _dataset['data']
            logging.debug('Compute dataset info')

            stats = dataset.get_stats(_dataset)

            self._data_info = (data.shape[0], data.shape[1], data.shape[2:], stats['data_mean'], stats['data_std'],
                               stats['data_min'], stats['data_max'], _dataset['num_classes'], stats['nlabels'],
                               stats['label_count'], stats['weight_mean'], stats['weight_std'], stats['weight_min'],
                               stats['weight_max'])

            self._stats = stats
            logging.debug('Done ...')

        return run

    def _get_dataset_info(self):
        self.datasetEdit.setText(self._dataset_file)
        self.datasetInfoTextEdit.setPlainText('Computing dataset info ...')
        # self._log_thread = utils.ThreadWorker(self._dataset_info_runnable())
        self._log_thread.finished.connect(self._update_dataset_info)
        self._log_thread.start()

    def _update_dataset_info(self):

        if self._stats['nlabels'] != self._data['num_classes']:
            utils.dialog_message(message='Label images have {} classes. But your dataset indicates {} classes'.format(
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



