import ctypes
import os
import io
import numpy

from sklearn.preprocessing import LabelEncoder

try:
    libname = 'libcuda.so'
    cuda = ctypes.CDLL(libname)
    cuda.cuInit(0)
except:
    cuda = None

FILE_EXTENSION_IMAGE_FILTER = "Images (*.tif *.tiff *.TIFF *TIF *.b *.raw);; TIFF  (*.tif *.tiff *.TIFF *.TIF);; Raw Data  (*.b *.raw);; All Files (*.*)"


__axis_num = { 'xy': 0, 'xz': 1, 'yz': 2}

def get_3d_slice_range_from(axis: str, slice_num: int, slice_num_to: int = None):
    """
    Given an axis and a slice, returns the range to acess the 2d image from a 3d volume.
    Args:
        axis (str): The axis to be considered ('XY' | 'XZ' | 'YZ').
        slice_num: The slice to be extracted from the given axis.
        slice_num_to: If defined, determine the from (slice_num, slice_num_to) to be extracted
    Return:
        The range to extract that slice number from that axis.
        Example:
        img[get_3d_slice_range_from('xy', 10)]
    """

    if slice_num_to is None:
        val = slice_num
    else:
        val = slice(slice_num, slice_num_to, None)

    s = [slice(None, None, None),
         slice(None, None, None),
         slice(None, None, None)]
    s[__axis_num[axis.lower()]] = val
    return s

def get_axis_num(axis: str):
    """
    Given an axis, returns the numeric equivalent of such.
    Args:
        axis (str): The axis to be considered ('XY' | 'XZ' | 'YZ')
    Return:
        The axis free dimension. { 'xy': 0, 'xz': 1, 'yz': 2}
    """
    return __axis_num[axis.lower()]


# def pyqt_trace():
# import pdb
# import sys

# from PyQt5.QtCore import pyqtRemoveInputHook
# pyqtRemoveInputHook()
# # set up the debugger
# debugger = pdb.Pdb()
# debugger.reset()
# # custom next to get outside of function scope
# debugger.do_next(None)  # run the next command
# users_frame = sys._getframe().f_back  # frame where the user invoked `pyqt_set_trace()`
# debugger.interaction(users_frame, None)


def annotat3d_log_level():
    return os.environ.get('SSC_ANNOTAT3D_LOG_LEVEL', 'INFO').upper()


# def dialog_message(title='Ops!', message='There was en error', detailed=None, type=None):
    # error_dialog = QtWidgets.QMessageBox()
    # error_dialog.setWindowTitle(title)
    # error_dialog.setText(message)
    # if detailed:
        # error_dialog.setDetailedText(detailed)
    # if type == 'error':
        # error_dialog.setIcon(QtWidgets.QMessageBox.Critical)
    # elif type == 'warning':
        # error_dialog.setIcon(QtWidgets.QMessageBox.Warning)

    # error_dialog.exec_()


# def dialog_waiting(parent=None):

    # layout = QtWidgets.QVBoxLayout()
    # d = QtWidgets.QDialog(parent=parent)
    # d.setWindowFlags(QtCore.Qt.Dialog | QtCore.Qt.FramelessWindowHint)
    # icon = QtWidgets.QProgressBar(d)
    # icon.setMaximum(0)
    # icon.setMinimum(0)
    # icon.resize(300, 20)

    # label = QtWidgets.QLabel('Wait ...')
    # label.setAlignment(QtCore.Qt.AlignCenter)

    # layout.addWidget(label)
    # layout.addWidget(icon)

    # d.setLayout(layout)

    # d.resize(300, 100)
    # return d

def toNpyBytes(data: numpy.ndarray):
    """
    Serializes a numpy ndarray to the npy format in memory.
    Args:
        data (np.ndarray): data in ndarray format.
    Return:
        The bytearray to the npy serialized data.
    """
    byte_slice = io.BytesIO()
    numpy.save(byte_slice, data)

    return byte_slice.getvalue()


def tuple_to_str(s):
    print('from tuple')
    print(s)
    return ','.join([str(x) for x in s])


def str_to_tuple(s):
    print('to tuple')
    print(s)
    return tuple([int(x) for x in s.split(',')])


class SequenceCatcher(object):
    def __init__(self, seq, evt):
        self._seq = seq
        self._cur = 0
        self._evt = evt

    def __call__(self, e):
        print('seq catcher ... ' + str(e))
        print(self._cur)
        print(self._seq)
        print('key: ', e.key)
        print('key dir: ', dir(e.key))
        print('evt: ', dir(e))
        print('key type', type(e.key))
        if e.key() == self._seq[self._cur]:
            self._cur += 1
            if self._cur >= len(self._seq):
                self._cur = 0
                print('run event')
                self._evt()
        else:
            self._cur = 0


_console = {}


def add_variable_console(export={}):

    if _console.get('widget', False):
        for k in export:
            v = export[k]
            _console['widget'].push_local_ns(k, v)

    _console['variables'] = {**(_console.get('variables', {})), **export}


# def _show_console():
    # _console['widget'].resize(640, 480)
    # _console['widget'].show()
    # _console['parent'].close()


# def new_console(parent, export={}):
    # _console['widget'] = PythonConsole()
    # _console['widget'].resize(640, 480)
    # _console['parent'] = parent

    # add_variable_console({**(_console.get('variables', {})), **export})

    # keyevt = SequenceCatcher(
        # [
            # 16777235,  # up
            # 16777235,  # up
            # 16777237,  # down
            # 16777237,  # down
            # 16777234,  # left
            # 16777236,  # right
            # 16777234,  # left
            # 16777236
        # ],  # right
        # lambda: _show_console())

    # #parent.events.key_press.connect(keyevt)
    # #print(parent.events)

    # parent.keyPressEvent = keyevt
    # _console['widget'].eval_in_thread()

    # return _console


################## cuda utilities ######################

CUDA_SUCCESS = 0


def cuda_capability():
    cc_major = ctypes.c_int()
    cc_minor = ctypes.c_int()
    device = ctypes.c_int()

    result = cuda.cuDeviceGet(ctypes.byref(device), 0)
    if cuda.cuDeviceComputeCapability(ctypes.byref(cc_major), ctypes.byref(cc_minor), device) == CUDA_SUCCESS:
        return (cc_major.value, cc_minor.value)
    else:
        print('Could not retrive cuda capability information')
        return (0, 0)


def rapids_support():
    #temporarily disable rapids support
    return False

    #libcuda could not be loaded suring ci-cd build
    if cuda is None:
        return False
    major, minor = cuda_capability()
    print('capability {}.{}'.format(major, minor))
    return major >= 6


def headless_mode():
    return bool(os.environ.get('ANNOTAT3D_HEADLESS', 0))


def normalize_labels(labels):
    label_enc = LabelEncoder()
    return label_enc.fit_transform(labels.ravel()).reshape(labels.shape)


def map_lookup_table(array, lut):
    from_values = numpy.array([*lut.keys()], dtype='uint16')
    to_values = numpy.array([*lut.values()], dtype=array.dtype)
    sort_idx = numpy.argsort(from_values)
    idx = numpy.searchsorted(from_values, array, sorter=sort_idx)
    return to_values[sort_idx][idx]

