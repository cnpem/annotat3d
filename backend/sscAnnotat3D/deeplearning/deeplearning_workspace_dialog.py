import os
import os.path
import sys
import logging

try:
    from sscDeepsirius.controller.host_network_controller import HostNetworkController as NetworkController
except:
    logging.debug('DeepSirius not found')

this = sys.modules[__name__]

if not hasattr(this, '__workspace__'):
    this.__workspace__ = ''


class DeepLearningWorkspaceDialog:
    def __init__(self):
        super().__init__()

        self._workspace = this.__workspace__
        self.workspace = self._workspace

    def open_new_workspace(self, workspace_path: str):
        workspace_parent = workspace_path
        NetworkController.install_workspace(workspace_parent)
        self.workspace = os.path.join(workspace_parent)

    #TODO : provide a better way to check this other than just check if networks folder is available
    def is_valid_workspace(self):
        return os.path.isdir(os.path.join(self.workspace, 'networks'))

    def save_workspace(self):
        if self.workspace:
            this.__workspace__ = self.workspace
