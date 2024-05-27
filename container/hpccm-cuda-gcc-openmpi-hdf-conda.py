#!/usr/bin/env python

"""
Title: HPCCM recipe for the HARPIA project.

Description: This scripts implement an HPCCM recipe for the HARPIA project. The default arguments of this recipe will install the following packages:
- Ubuntu version 20.04
- CUDA version 11.2.2
- cuDNN version 8.1.1
- GNU Compiler version 9
- OS packages for development
- GNU compilers version 9
- Mellanox OFED version 5.1-2.5.8.0
- OpenMPI version 4.1.0
- HDF5 version 1.10.7
- Anaconda version 24.3.0-0

Usage:
    - python3 hpccm-cuda-gcc-openmpi-hdf-conda.py --format docker --cuda 11.2.2 --opmpi 4.1.0 --python py39 > Dockerfile
    - python3 hpccm-cuda-gcc-openmpi-hdf-conda.py --format singularity --cuda 11.2.2 --opmpi 4.1.0 --python py39 > Singularity.def
"""

import hpccm
import argparse
from packaging.version import Version

parser = argparse.ArgumentParser(description='HPCCM recipe for the Annotat3DWeb project')
parser.add_argument('--format', type=str, default='singularity',
                    choices=['docker', 'singularity'],
                    help='Container specification format (default=%(default)s).')
parser.add_argument('--singularity_version', type=str, default='3.6.4',
                    help='Singularity version (default=%(default)s).')
parser.add_argument('--distro', type=str, default='ubuntu20',
                    choices=['ubuntu20', 'ubuntu22'],
                    help='Linux distribution (default=%(default)s).')
parser.add_argument('--cuda', type=str, default='11.2.2',
                    help='CUDA version (default=%(default)s).')
parser.add_argument('--gcc', type=str, default='9',
                    help='CUDA version (default=%(default)s).')
parser.add_argument('--mlnx', type=str, default='5.1-2.5.8.0',
                    help='CUDA version (default=%(default)s).')
parser.add_argument('--ompi', type=str, default='4.1.0',
                    help='OpenMPI version (default=%(default)s).')
parser.add_argument('--hdf5', type=str, default='1.10.7',
                    help='HDF5 version (default=%(default)s).')
parser.add_argument('--conda', type=str, default='24.3.0-0',
                    help='Conda version (default=%(default)s).')
parser.add_argument('--python', type=str, default='py39',
                    help='Python version (default=%(default)s).')

args = parser.parse_args()

# Create stage
stage = hpccm.Stage()

# HPCCM configuration
hpccm.config.set_container_format(args.format)
hpccm.config.set_singularity_version(args.singularity_version)
hpccm.config.set_working_directory('/opt/annotat3dweb')

stage += hpccm.primitives.comment(__doc__, reformat=False)

# Base image definition
devel_image = f'nvcr.io/nvidia/cuda:{args.cuda}-cudnn8-devel-{args.distro}.04'
runtime_image = f'nvcr.io/nvidia/cuda:{args.cuda}-cudnn8-runtime-{args.distro}.04'

stage += hpccm.primitives.baseimage(image=devel_image, _distro=args.distro)

# Label
stage += hpccm.primitives.label(
    metadata={
        'br.lnls.gcd.mantainer': "'Data Science and Management Group <gcd.lnls.br>'",
        'br.lnls.gcd.version': f'{args.cuda}-cudnn8-{args.distro}.04-{args.python}',
})

# Environment variables
stage += hpccm.primitives.comment('GCD package repository ID')
stage += hpccm.primitives.environment(variables={'GCD_PKG_REPO': '3702'})

stage += hpccm.primitives.environment(
    variables={
        'CC': 'gcc',
        'CXX': 'g++',
    }
)

stage += hpccm.primitives.environment(
    variables={
        'CUDA_HOME': '/usr/local/cuda',
        'CUDA_TOOLKIT_PATH': '$CUDA_HOME',
    }
)

stage += hpccm.primitives.environment(
    variables={
        'CPATH': '/usr/include/hdf5/serial/:$CUDA_HOME/include:$CPATH',
        'HDF5_INCLUDE_PATH': '/usr/include/hdf5/serial/:$HDF5_INCLUDE_PATH',
        'LD_LIBRARY_PATH': '/usr/lib/x86_64-linux-gnu:$CUDA_HOME/lib64:$CUDA_HOME/lib64/stubs:$LD_LIBRARY_PATH',
        'PATH': '/opt/conda/bin:$CUDA_HOME/bin:$CUDA_HOME/nvvm/bin:$PATH',
    }
)

# Install development tools
ospackages = [
    'autoconf',
    'autoconf-archive',
    'automake',
    'binutils',
    'build-essential',
    'bzip2',
    'ca-certificates',
    'coreutils',
    'curl',
    'doxygen',
    'environment-modules',
    'expect',
    'fontconfig',
    'gdb',
    'gfortran',
    'git',
    'gzip',
    'ibacm',
    'libgl1',
    'libgl1-mesa-dev',
    'libglib2.0-0',
    'libhdf5-*',
    'libnetcdf-dev',
    'libnss3',
    'libopenmpi-dev',
    'libssl-dev',
    'libtool',
    'libxss1',
    'make',
    'openjdk-8-jdk',
    'openmpi-bin',
    'openssh-client',
    'patch',
    'pciutils',
    'pkg-config',
    'qperf',
    'tar',
    'tcl',
    'unzip',
    'vim',
    'wget',
    'xz-utils',
    'zip',
    'zlib1g-dev',
]
stage += hpccm.building_blocks.apt_get(ospackages=ospackages)

# GNU compilers
compiler = hpccm.building_blocks.gnu(version=args.gcc)
stage += compiler

# CMake
stage += hpccm.building_blocks.cmake(version='3.23.3', eula=True)

# Mellanox OFED
stage += hpccm.building_blocks.mlnx_ofed(version=args.mlnx, _distro=args.distro)

# OpenMPI
stage += hpccm.building_blocks.openmpi(version=args.ompi, toolchain=compiler.toolchain)

# HDF5
stage += hpccm.building_blocks.hdf5(version=args.hdf5, toolchain=compiler.toolchain)

# Anaconda
stage += hpccm.building_blocks.conda(channels=['conda-forge', 'nvidia'], prefix='/opt/conda', version=args.conda, python_subversion=args.python, eula=True)

# Configure pip
stage += hpccm.primitives.shell(
    commands=[
        'python3 -m pip config set global.extra-index-url https://gitlab.cnpem.br/api/v4/projects/3702/packages/pypi/simple',
        'python3 -m pip config set global.trusted-host gitlab.cnpem.br',
    ],
    chdir=False,
)

# Update tools to build python packages
stage += hpccm.primitives.shell(
    commands=[
        'python3 -m pip install --upgrade pip setuptools wheel build pyclean'
    ],
    chdir=False,
)

# Install Annotat3DWeb
stage += hpccm.primitives.copy(src='.', dest='/opt/annotat3dweb')
stage += hpccm.building_blocks.pip(ospackages=[], requirements='backend/requirements.txt', pip='pip3')
stage += hpccm.building_blocks.pip(ospackages=[], requirements='backend/requirements-dev.txt', pip='pip3')
stage += hpccm.primitives.shell(
    commands=[
        'cd /opt/annotat3dweb/backend',
        'python3 setup.py bdist_wheel',
    ],
    chdir=False,
)

# Output container specification
print(stage)

# # Install python build dependencies
# stage += hpccm.building_blocks.pip(ospackages=[], requirements='python/requirements.txt', pip='pip3')

# # Output container specification
# print(stage)
