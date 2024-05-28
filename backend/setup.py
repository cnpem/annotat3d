import glob
import os
from distutils.extension import Extension

from Cython.Build import cythonize
from Cython.Distutils import build_ext
from setuptools import setup
from setuptools.command.install import install
from sscAnnotat3D.__version__ import __version__

# import Cython.Compiler.Options
# Cython.Compiler.Options.annotate = True


def get_cuda_runtime_version():
    """Get CUDA version."""
    import ctypes

    libcudart = ctypes.cdll.LoadLibrary("libcudart.so")
    version = ctypes.c_int()
    _ = libcudart.cudaRuntimeGetVersion(ctypes.byref(version))
    return version.value // 1000


def fix_setuptools():
    """Work around bugs in setuptools.

    Some versions of setuptools are broken and raise SandboxViolation for normal
    operations in a virtualenv. We therefore disable the sandbox to avoid these
    issues.
    """
    try:
        from setuptools.sandbox import DirectorySandbox

        def violation(operation, *args, **_):
            """Print vionation during fixing setuptools."""

            print("SandboxViolation: %s" % (args,))

        DirectorySandbox._violation = violation
    except ImportError:
        pass


# Fix bugs in setuptools.
fix_setuptools()

# req_file = 'requirements.txt' if get_cuda_runtime_version()>=11 else 'requirements-cuda10.txt'
req_file = "requirements.txt"
with open(req_file) as f:
    requirements = f.read().splitlines()

# print(requirements)


class PostInstallCommand(install):
    """Post-installation for installation mode."""

    def run(self):
        """Start post-installation command."""
        install.run(self)
        with open("banner.txt") as f:
            print(f.read())

        fn = "./workspace.tar"
        os.remove(fn) if os.path.exists(fn) else None


def include_dirs():
    """Include directories."""
    import numpy

    return [numpy.get_include()]


def extension_modules(basedir, **kwargs):
    """Gather the extension modules."""
    python_files = glob.glob(os.path.join(basedir.replace(".", os.path.sep), "*.py*"))
    cython_files = glob.glob(os.path.join(basedir.replace(".", os.path.sep), "*.pyx"))
    files = [*python_files, *cython_files]
    ext = [Extension(basedir + "." + os.path.splitext(os.path.basename(f))[0], [f], **kwargs) for f in files]
    print(ext)
    return ext


setup(
    name="sscAnnotat3D",
    version=__version__,
    url="",
    license="",
    include_package_data=True,
    author="peixinho",
    setup_requires=["cython>=0.29", "setuptools>=41.2", "numpy"],
    install_requires=requirements,
    author_email="alan.peixinho@lnls.br",
    description="",
    zip_safe=False,
    cmdclass={
        "build_ext": build_ext,
        "install": PostInstallCommand,
    },
    packages=["sscAnnotat3D.colormaps", "sscAnnotat3D.help", "sscAnnotat3D.static", "sscAnnotat3D.templates"],
    package_data={
        "sscAnnotat3D.colormaps": ["*.npy"],
        "sscAnnotat3D.help": ["*.html"],
        "sscAnnotat3D.res": ["./**/*.png"],
    },
    python_requires=">=3.6",
    ext_modules=cythonize(
        [
            *extension_modules("sscAnnotat3D"),
            *extension_modules("sscAnnotat3D.image"),
            *extension_modules("sscAnnotat3D.repository"),
            *extension_modules("sscAnnotat3D.api"),
            *extension_modules("sscAnnotat3D.api.modules"),
            *extension_modules("sscAnnotat3D.utils"),
            *extension_modules("sscAnnotat3D.modules"),
            *extension_modules("sscAnnotat3D.cython", language="c++"),
        ],
        language_level="3",
        nthreads=32,
        compiler_directives={"boundscheck": False, "always_allow_keywords": True},
    ),
)
