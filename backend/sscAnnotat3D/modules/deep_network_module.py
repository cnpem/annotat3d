# this module shoudnt be needed
# import os

# from sscDeepsirius.controller.host_network_controller import \
#     HostNetworkController as deepsiriusNetworkController
# from sscDeepsirius.utils import dataset, gpu
# # from sscRemoteProcess import modules as remote_modules
# # from sscRemoteProcess import tepui
# # from sscRemoteProcess import utils as remote_utils

# from sscAnnotat3D import utils
# from sscAnnotat3D.repository import data_repo

# # from ..api import __ui_path__, _tepui_partitions, _annotat3d_singularity_img_path

# _tepui_partitions = {
#     '1 GPU': {
#         'partition': 'annot1',
#         'num_gpus': 1,
#     },
#     '2 GPUs': {
#         'partition': 'annot2',
#         'num_gpus': 2,
#     },
#     '4 GPUs': {
#         'partition': 'annot4',
#         'num_gpus': 4
#     }
# }

# _loss = {
#     'Cross Entropy': 'CrossEntropy',
#     'Dice': 'Dice',
#     'Cross Entropy + Dice': 'DicePlusXEnt',
# }

# _optimiser = {'Adam': 'adam', 'Gradient Descent': 'gradientdescent'}

# _available_model_types = "Model  (*.model.tar.gz *.MODEL.TAR.GZ)"

# _available_dataset_types = "HD5  (*.h5 *.H5)"

# _available_frozen_types = "PB  (*.pb *.PB)"

# _dataset_info_template = """Number of Images: {}
# Number of Samples: {}
# Dimensions: {}
# Data Info:
#     Mean: {}
#     Std: {}
#     Min: {}
#     Max: {}
# Label Info:
#     # classes: {}
#     # labels: {}
#     Hist: {}
# Weight Info:
#     Mean: {}
#     Std: {}
#     Min: {}
#     Max: {}
# """

# def data_repo_logger(log_thread):
#     if log_thread is not None:
#         for line in log_thread:
#             if line is not None:
#                 # data_repo.set_log_message('ThreadWorkerWeb: {}'.format(line))
#                 print('ThreadWorkerWeb: {}'.format(line))

# class networkActiveInstance():
#     def __init__(self, name = None, instance = None, controller = None):
#         self._name = name
#         self._active_instance = instance
#         self.controller = controller

#     def is_empty(self):
#         return (self._name is None) and (self._active_instance is None)

#     def destroy_active_instance(self):
#         self.controller.destroy_network_instance(self._name)
#         self._name = None
#         self._active_instance = None

#     def destroy_all(self):
#         self.controller.destroy_network_instance(self._name)
#         self._name = None
#         self._active_instance = None
#         self.controller = None 

#     def set_controller(self, controller):
#         self.controller = controller

#     def deploy_active_instance(self, name):
#         self._name = name
#         self._active_instance = self.controller.deploy_network_instance(self._name)

#     def get_custom_params(self):
#         return self.controller.network_list_params(self._active_instance) 


# class deepNetworkModule():
#     def __init__(self):
#         self._workspace_path = None
#         self._available_GPUs = []
        
#         # network
#         self._deepsirius_network_controller = None

#         self._network_instance = networkActiveInstance()

#         self._network_custom_settings = {}

#         # dataset
#         self._dataset_file = None
#         self._data_info = None
#         self._data = None

#         # running info
#         self._is_running = False
#         self._tensorboard_server = None
#         self._frozen_model = None

#     @property
#     def _is_active(self):

#         status_msg = []

#         if not self._workspace_path:
#             status_msg.append['workspace loaded']

#         if not self._deepsirius_network_controller:
#             status_msg.append['deepsirius network controller loaded']

#         if not self._network_instance.is_empty():
#             status_msg.append['active network model loaded']

#         if not self._data:
#             status_msg.append['dataset loaded']

#         if not status_msg:
#             return ['not initialized']

#         return status_msg

#     def activate_module(self, workspacePath):
#         load_msg = []
#         success = True

#         # listing locally available GPUs 
#         self._available_GPUs = gpu.get_gpus()
#         if not self._available_GPUs:
#             success = False
#             load_msg.append('ERROR deepNetworkModule: Could not load GPU info: {}'.format(gpu.get_gpus()))
            
#         try:
#             # setting deepsirius controller
#             self._workspace_path = workspacePath
#             self._deepsirius_network_controller = deepsiriusNetworkController(workspacePath, streaming_mode=True)
#         except:
#             success = False
#             load_msg.append('ERROR deepNetworkModule: Could not load deepsirius controller from workspace: {}'.format(self.workspacePath))

#         if not load_msg:
#             load_msg.append('module loaded')

#         return success, load_msg

#     def import_network_model(self, import_model_path, new_network_name):
#         # check if name exists first
#         self._deepsirius_network_controller.import_model(import_model_path, new_network_name)

#     def deploy_active_instance(self, net_name):
#         self._network_instance.deploy_active_instance(net_name)

#     # def set_network_instance(self, net_name):
#     #     # check if name exists first
#     #     self._network_instance.set_instance(net_name, 
#     #                                             self._deepsirius_network_controller.get_network_instance(net_name),
#     #                                             self._deepsirius_network_controller)

#     def get_custom_settings_options(self):
#         if self._network_instance:
#             custom_settings_options = self._network_instance.get_custom_params()
#             return custom_settings_options
#         else:
#             return {}

#     # use the params json in the sscDeepsirius network workspace
#     # to set pass extra parameters for specific networks
#     def set_custom_settings(self, selected_custom_settings):
#         if selected_custom_settings.keys() == self._custom_settings_options.keys():
#             self._network_custom_settings = selected_custom_settings
#         else:
#             return 'ERROR deepNetworkModule: Selected custom settings keys are not compatible with active network custom settings'


#     # # called from the outisde
#     # def start_training(self, params):
#     #     self.start_tensorboard_server()
#     #     # set dir for temporary files used in deepsirius
#     #     self.set_cache_dir(params['cache_dir'])

#     def start_tensorboard_server(self): 
#         self._tensorboard_server = self._deepsirius_network_controller.start_tensorboard(self._network_instance)
#         data_repo_logger('Tensorboard: {}'.format(self._tensorboard_server))

#     def set_cache_dir(self, new_cache_dir):
#         self._deepsirius_network_controller.set_cache_base_dir(new_cache_dir)

#     def save_network(self, set_network_name_checked):
#         #underscore is a reserved character in network name
#         new_network_name = set_network_name_checked.replace('_', '-')
#         self._deepsirius_network_controller.copy_network(self._network_instance, new_network_name)
    
#     @property
#     def _network_model_list_available(self):
#         return sorted(self._deepsirius_network_controller.network_models)
        
#     # def update_max_iter(self): # bruno: is this a last iter? 
#     #     self.maxIter = self._deepsirius_network_controller.checkpoint(self._network_instance)      

#     def _update_status_network_instance(self):
#         status, message = self._deepsirius_network_controller.network_instance_status
#         self.network_instance_status.setChecked(status)
#         if not status:
#             message = message + ' (Contact system administrator)'
#         self.network_instance_status.setText(message)


#     # def _set_start_running(self):
#     #     self._is_running = True
#     #     self.network_instance_status.setText('Network instance is running ...')

#     # def _set_stop_running(self):
#     #     self._update_status_network_instance()
#     #     self._is_running = False
#     #     data_repo_logger('Stop running')
#     #     data_repo_logger('DEBUG: set stop running called ...')
#     #     data_repo_logger('DEBUG: transaction: {}'.format(self._sentry_transaction))
#     #     try:
#     #         self._sentry_transaction.__exit__(None, None, None)
#     #     except:
#     #         data_repo_logger('WARNING: Could not finish transaction. Perhaps it is already finished?')

#     def _set_network_instance(self, network_instance_name):

#         if self._network_instance is None:
#             self._network_instance_name = network_instance_name

#             try:
#                 network_instance = self._deepsirius_network_controller.get_network_instance(self._network_instance_name)
#             except:
#                 network_instance = None

#             if network_instance is not None:
#                 if self._is_running:
#                     return 'Error: There is already a network instance running.'
#                 else:
#                     network_instance.remove(force=True)

#             self.network_instance_status.setText(
#                 'Building network instance image ... (this might take a couple minutes)')

#             self._network_instance = self._deepsirius_network_controller.deploy_network_instance(self._network_instance_name)
#         else:
#             self._deploy_finished()

#     def _deploy_finished(self):
#         self._update_status_network_instance()

    

#     def export(self, export_model_name):
#         export_model_path = self._workspace_path+'/frozen/'+export_model_name+'model.tar.gz'
#         self._deepsirius_network_controller.export_model(self.network, export_model_path)

#     def freeze(self, frozen_model_name, network_instance):
#         self._frozen_model = self._workspace_path+'/frozen/'+frozen_model_name+'.pb'
#         self._set_network_instance(network_instance)

#     def _freeze_runnable(self):
#         def run():
#             frozen_model_filename = os.path.basename(self._frozen_model)
#             network_instance, log = self._deepsirius_network_controller.freeze(self._network_instance,
#                                                                     frozen_model_filename,
#                                                                     batch_size=self.batchSizeSpinBox.value(),
#                                                                     **self._custom_params_value())
#             return log

#         return run


#     def _train_runnable(self):
#         # this method is no longer used for the web version. See train().
#         pass

#     def train(self):
#         # method thal runs training for the active network instance locally
#         data_repo_logger('Creating network instance (training) ...\n')

#         # start training (returns a log thread)
#         data_repo_logger('DEBUG: {}'.format(_loss))
#         # _network_controller.train returns a network instance and a log thread
#         # as the returned network instance is not used on the legacy code, that variable is omitted here
#         _, log_thread = self._deepsirius_network_controller.train(self._network_instance,
#                                                         self._dataset_file,
#                                                         num_gpus=len(self._active_gpus),
#                                                         cuda_devices=','.join(map(str, self._active_gpus)),
#                                                         batch_size=self.batchSize,
#                                                         max_iter=self.maxIter,
#                                                         lr=self.learnRate,
#                                                         loss_type=self.lossType,
#                                                         optimiser=self.optimiser,
#                                                         **self._custom_params_value()) 

#         # posts the log thread as separate lines on data repo
#         data_repo_logger(log_thread)

#         self._set_network_instance(self.selectedNetwork)


#     def finetune(self):

#         data_repo_logger('Creating network instance (finetune)...\n')
#         # sentry_sdk.set_context('Dataset Params', self._stats)

#         self._set_network_instance(self._network_instance)

#         active_gpus = self._active_gpus
#         optimiser = _optimiser[self.optimiserType.currentText()]
#         loss_type = _loss[self.lossType.currentText()]

#         data_repo_logger('DEBUG: Run finetune inside network instance ...')

#         network_instance, log_thread = self._deepsirius_network_controller.finetune(self._network_instance,
#                                                                     self._dataset_file,
#                                                                     num_gpus=len(self._active_gpus),
#                                                                     cuda_devices=','.join(map(str, self._active_gpus)),
#                                                                     batch_size=self.batchSize,
#                                                                     max_iter=self.maxIter,
#                                                                     lr=self.learnRate,
#                                                                     loss_type=self.lossType,
#                                                                     optimiser=self.optimiser,
#                                                                     **self._custom_params_value())
#         data_repo_logger(log_thread)



#     # def _destroy_network_instance(self):
#     #     if self._network_instance is not None:
#     #         try:
#     #             self._deepsirius_network_controller.destroy_network_instance(self._network_instance_name)
#     #         except:
#     #             print('Already destroyed network instance')

#     #         self._network_instance = None
#     #         self._network_instance_name = None

#     # def _count_labels(self, labels):
#     #     m = int(dataset.get_max(labels) + 1)
#     #     data_repo_logger('DEBUG: max labels >>> {}'.format(m))
#     #     values = dataset.get_count(labels, m)
#     #     keys = range(m)
#     #     return {k: v for (k, v) in zip(keys, values)}

#     # def _dataset_info_runnable(self):
#     #     def run():
#     #         data_repo_logger('DEBUG: RUN THREAD ... ')
#     #         _dataset = self._data

#     #         data_repo_logger('DEBUG: {}'.format(dataset))

#     #         if dataset is None:
#     #             return

#     #         data = _dataset['data']
#     #         data_repo_logger('DEBUG: Compute dataset info')

#     #         stats = dataset.get_stats(_dataset)

#     #         self._data_info = (data.shape[0], data.shape[1], data.shape[2:], stats['data_mean'], stats['data_std'],
#     #                            stats['data_min'], stats['data_max'], _dataset['num_classes'], stats['nlabels'],
#     #                            stats['label_count'], stats['weight_mean'], stats['weight_std'], stats['weight_min'],
#     #                            stats['weight_max'])

#     #         self._stats = stats
#     #         data_repo_logger('DEBUG: Done ...')

#     #     return run

#     # def _get_dataset_info(self):
#     #     data_repo_logger(self._update_dataset_info)

#     # def _update_dataset_info(self):

#     #     if self._stats['nlabels'] != self._data['num_classes']:
#     #         data_repo_logger('Label images have {} classes. But your dataset indicates {} classes'.format(
#     #             self._stats['nlabels'], self._data['num_classes']))
#     #         return

#     # def load_dataset(self):
#     #     self._data = dataset.load_dataset(self._dataset_file)
#     #     self._get_dataset_info()
#     #     data_repo_logger('Dataset Params', self._data)



