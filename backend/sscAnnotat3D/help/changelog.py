import os
import sys

from PyQt5 import QtCore, QtWidgets
from PyQt5.QtCore import *
from PyQt5.QtWidgets import QDialog

try:
    from PyQt5.QtWebEngineWidgets import *

    __has_webengine__ = True
except:  # for ppc
    import webbrowser

    __has_webengine__ = False


class changelog_help(QDialog):
    def __init__(self, parent=None):
        super(changelog_help, self).__init__()
        # 		self.setModal(True)

        self.setWindowFlags(Qt.WindowMinimizeButtonHint | Qt.WindowCloseButtonHint | Qt.WA_DeleteOnClose)
        file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "changelog.md.html"))

        if __has_webengine__:
            self.browser = QWebEngineView()
            qurl = QUrl.fromLocalFile(file_path)
            self.browser.page().action(QWebEnginePage.Back).setVisible(True)
            self.browser.setUrl(qurl)
            self.browser.setSizePolicy(QSizePolicy.Preferred, QSizePolicy.Expanding)

            self.layout_options = QGridLayout()

            self.layout_options.addWidget(self.browser, 0, 0)
            self.setLayout(self.layout_options)

            # self.button.clicked.connect(self.function_close)
            self.show()
        else:
            print("Fallback show help on browser")
            webbrowser.open(file_path)

            print("closing ...")

            self.timer = QTimer()
            self.timer.timeout.connect(self.function_close)
            self.timer.setSingleShot(True)
            self.timer.start(0)

    def function_close(self):
        self.close()


if __name__ == "__main__":
    app = QtWidgets.QApplication(sys.argv)
    mainWin = HelloWindow()
    mainWin.show()
    sys.exit(app.exec_())
