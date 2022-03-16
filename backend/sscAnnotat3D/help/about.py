import os
import PyQt5.QtWidgets as QtWidgets
from PyQt5 import uic
from PyQt5 import QtCore
from PyQt5.QtWidgets import QDialog
from PyQt5.QtGui import QPixmap
from . import __ui_path__
try:
    from sscAnnotat3D import utils
    import sscPySpin
    import sscDeepsirius
    sscDeepsiriusVersion = sscDeepsirius.__version__
    sscPySpinVersion = sscPySpin.__version__
except:
    sscPySpinVersion = 'unknown'
    sscDeepsiriusVersion = 'unknown'
#move to a global constant later
__version__ = '0.10.5'


class about_help(QDialog):
    def __init__(self):
        super().__init__()
        # self.setModal(True)

        utils.new_console(self)

        uic.loadUi(os.path.join(__ui_path__, 'help/about.ui'), self)
        self.setWindowTitle("About Annotat3D")

        self.annotat3dVersion.setText('Annotat3D - {}'.format(__version__))
        self.pyspinVersion.setText('PySpin - {}'.format(sscPySpinVersion))
        self.deepsiriusVersion.setText('DeepSirius - {}'.format(sscDeepsiriusVersion))

        pixmap = QPixmap(os.path.join(__ui_path__, 'icons/logo-cnpem.png'))

        self.logo.setPixmap(pixmap)

        self.setFixedSize(self.sizeHint())
