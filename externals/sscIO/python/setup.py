from setuptools import setup, find_packages
from distutils.extension import Extension
from setuptools.command.build_ext import build_ext as build_ext_orig
from cmake_setup import *
import sysconfig
import glob
import os
import pathlib
import subprocess
import platform
import sys

#setup packager for cmake/ctypes
#author: Spina

SSC_IO_DISABLE_HDF5=True
SSC_IO_SHARED=True

def fix_setuptools():
    """Work around bugs in setuptools.                                                                                                                                                        

    Some versions of setuptools are broken and raise SandboxViolation for normal                                                                                                              
    operations in a virtualenv. We therefore disable the sandbox to avoid these                                                                                                               
    issues.                                                                                                                                                                                   
    """
    try:
        from setuptools.sandbox import DirectorySandbox
        def violation(operation, *args, **_):
               print("SandboxViolation: %s" % (args,))

        DirectorySandbox._violation = violation
    except ImportError:
        pass

# Fix bugs in setuptools.                                                                                                                                                                     
fix_setuptools()

with open('requirements.txt') as f:
    requirements = f.read().splitlines()

from setuptools.command.install import install

class PostInstallCommand(install):
    """Post-installation for installation mode."""
    def run(self):
        install.run(self)
        # with open('banner.txt') as f:
        #     print(f.read())


try:
    from Cython.Build import cythonize
except ImportError:
    # create closure for deferred import
    def cythonize (*args, ** kwargs ):
        from Cython.Build import cythonize
        return cythonize(*args, ** kwargs)

def include_dirs():
    import numpy
    return [numpy.get_include()]


from distutils.version import LooseVersion
from setuptools import setup, Extension
from setuptools.command.build_ext import build_ext


class CMakeExtension(Extension):
    def __init__(self, name, sourcedir=''):
        Extension.__init__(self, name, sources=[])
        self.sourcedir = os.path.abspath(sourcedir)

class ExtensionBuilder(build_ext):
    def run(self) -> None:
        self.validate_cmake()
        super().run()

    def build_extension(self, ext: Extension) -> None:
        if isinstance(ext, CMakeExtension):
            self.build_cmake_extension(ext)
        else:
            super().build_extension(ext)

    def validate_cmake(self) -> None:
        cmake_extensions = [x for x in self.extensions if isinstance(x, CMakeExtension)]
        if len(cmake_extensions) > 0:
            try:
                out = subprocess.check_output(["cmake", "--version"])
            except OSError:
                raise RuntimeError(
                    "CMake must be installed to build the following extensions: "
                    + ", ".join(e.name for e in cmake_extensions)
                )
            if platform.system() == "Windows":
                cmake_version = LooseVersion(re.search(r"version\s*([\d.]+)", out.decode()).group(1))  # type: ignore
                if cmake_version < "3.1.0":
                    raise RuntimeError("CMake >= 3.1.0 is required on Windows")

    def build_cmake_extension(self, ext: CMakeExtension) -> None:
        extdir = os.path.abspath(os.path.dirname(self.get_ext_fullpath(ext.name)))
        cmake_args = ["-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=" + extdir, "-DPYTHON_EXECUTABLE=" + sys.executable]

        if SSC_IO_SHARED:
            cmake_args.append('-DSSC_IO_SHARED=TRUE')

        #This part disable MPI. maybe need to change this after
        if SSC_IO_DISABLE_HDF5:
            cmake_args.append('-DSSC_IO_DISABLE_HDF5=TRUE')

        cfg = "Debug" if self.debug else "Release"
        # cfg = 'Debug'
        build_args = ["--config", cfg]

        if platform.system() == "Windows":
            cmake_args += ["-DCMAKE_LIBRARY_OUTPUT_DIRECTORY_{}={}".format(cfg.upper(), extdir)]
            if sys.maxsize > 2 ** 32:
                cmake_args += ["-A", "x64"]
            build_args += ["--", "/m"]
        else:
            cmake_args += ["-DCMAKE_BUILD_TYPE=" + cfg]
            build_args += ["--", "-j32", "VERBOSE=1"]
        cmake_args += ["-DPYTHON_INCLUDE_DIR={}".format(sysconfig.get_path("include"))]

        env = os.environ.copy()
        #env["CXXFLAGS"] = '{} -DVERSION_INFO=\\"{}\\"'.format(env.get("CXXFLAGS", ""), self.distribution.get_version())
        if not os.path.exists(self.build_temp):
            os.makedirs(self.build_temp)
        subprocess.check_call(["cmake", ext.sourcedir] + cmake_args, cwd=self.build_temp, env=env)
        subprocess.check_call(["cmake", "--build", "."] + build_args, cwd=self.build_temp)


from sscIO import __version__

#to build all python source with cython, we remove all packages (no source file is copied)
#and all code is sent as modules (in this case as cython built modules)
def extension_modules(basedir):
    files = [os.path.join(x.parent, x.name) for x in pathlib.Path(os.path.join(basedir.replace('.', os.path.sep))).rglob('*.py')]
    # files = glob.glob(os.path.join(basedir.replace('.', os.path.sep), '*.py'), recursive=True)
    # files += glob.glob(os.path.join(basedir.replace('.', os.path.sep), '*.pyx'))
    ext = [Extension(os.path.splitext(f)[0].replace('/', '.'), [f]) for f in files]
    print('=== Extension', ext)
    return ext

cython_ext = [
    *extension_modules('sscIO')
]

cmake_ext = [
    CMakeExtension('IO', sourcedir='..')
]

ext = cmake_ext + cythonize(cython_ext, language_level='3')

setup(
    name='sscIO',
    packages=[],
    url='',
    license='',
    #include_package_data=True,
    author='spina',
    setup_requires=["cython>=0.29","setuptools>=41.2", "numpy", "scikit-build"],
    install_requires=requirements,
    #package_data={'pyspin':['pyspin/version']},
    description='',
    zip_safe=False,
    cmdclass={
       'build_ext': ExtensionBuilder,
    'install': PostInstallCommand,
    },
    #decided to add gslic inside the libspin build to make it easier
    #ext_modules=[CMakeExtension('gSLICr', sourcedir='../externals/gSLICr/'), CMakeExtension('spin', sourcedir='..')]
    ext_modules=ext,
    version=__version__
)
