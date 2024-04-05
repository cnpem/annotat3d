import os

import PyQt5.QtWidgets as QtWidgets
from PyQt5 import QtCore, uic
from PyQt5.QtGui import QPixmap
from PyQt5.QtWidgets import QDialog

from . import __ui_path__

try:
    import sscPySpin
    from sscAnnotat3D import utils

    sscPySpinVersion = sscPySpin.__version__
except:
    sscPySpinVersion = "unknown"
# move to a global constant later
__version__ = "0.10.5"


class about_help(QDialog):
    def __init__(self):
        super().__init__()
        # self.setModal(True)

        utils.new_console(self)

        uic.loadUi(os.path.join(__ui_path__, "help/about.ui"), self)
        self.setWindowTitle("About Annotat3D")

        self.annotat3dVersion.setText("Annotat3D - {}".format(__version__))
        self.pyspinVersion.setText("PySpin - {}".format(sscPySpinVersion))

        pixmap = QPixmap(os.path.join(__ui_path__, "icons/logo-cnpem.png"))

        self.logo.setPixmap(pixmap)

        self.setFixedSize(self.sizeHint())
