import os
import os.path
import sys
import logging

from pathlib import Path

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
        """
        Function that opens a new workspace given a workspace path

        Args:
            workspace_path (str): workspace path string

        Returns:
            (tuple[bool, str]): returns a tuple that the first element is a boolean that says if the workspace was created without problem

        """
        try:
            workspace_parent = workspace_path
            NetworkController.install_workspace(workspace_parent)
            self.workspace = os.path.join(workspace_parent)
            Path(workspace_path).mkdir(parents=True, exist_ok=True)
        except Exception as e:
            return (False, str(e))

        return (True, "")

    def _is_valid_workspace(self, workspace_path: str):
        return os.path.isdir(os.path.join(workspace_path, 'networks'))

    def check_workspace(self, workspace_path: str):
        """
        Function that verify if the user can save the workspace given a path

        Args:
            workspace_path (str): workspace path string

        Notes:
            This function is used on load_workspace in io.py api directory

        Returns:
            (tuple[bool, str]): returns a tuple that the first element is a boolean that says if the workspace was loaded without problem

        """
        if (self._is_valid_workspace(workspace_path)):
            self.workspace = workspace_path
            return True
        else:
            return False

    def save_workspace(self):
        if self.workspace:
            this.__workspace__ = self.workspace
