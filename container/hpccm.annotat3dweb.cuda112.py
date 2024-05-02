"""
Annotat3DWeb Base Image

Contents:
    Ubuntu version 20.04
    NVIDIA CUDA version 11.6 including cuBLAS version 11.8.1.74
    NVIDIA cuDNN version 8.3.2.44
    NVIDIA NCCL version 2.11.4 (optimized for NVLink)
    APEX
    RDMA Core version 36.0
    TensorBoard version 2.8.0
    PyTorch version 1.11.0
    Nsight Compute version 2022.1.0
    Nsight Systems version 2021.5.2.53
    TensorRT version 8.2.3
    DALI version 1.10.0
    MAGMA version 2.5.2
    GNU compilers version 9
    OpenMPI version 4.1.2
    Mellanox OFED version 5.1-2.5.8.0
    Node version v20.12.2
    Annotat3DWeb Dependencies
"""

# pylint: disable=invalid-name, undefined-variable, used-before-assignment

import hpccm
import argparse


def parse_args():
    parser = argparse.ArgumentParser(description='Annotat3DWeb Base Image')
    parser.add_argument(
        '--format',
        type=str,
        default='singularity',
        choices=['docker', 'singularity'],
        help='Container specification format (default=%(default)s).',
    )
    parser.add_argument(
        '--singularity_version',
        type=str,
        default='3.6',
        help='Singularity version (default=%(default)s).',
    )
    parser.add_argument(
        '--distro',
        type=str,
        default='ubuntu20',
        choices=['ubuntu20', 'ubuntu22'],
        help='Linux distribution(default=%(default)s).',
    )

    return parser.parse_args()


def main():

    args = parse_args()

    # Create stage
    stage = hpccm.Stage()

    # HPCCM configuration
    hpccm.config.set_container_format(args.format)
    hpccm.config.set_singularity_version(args.singularity_version)
    hpccm.config.set_working_directory('/opt/Annotat3DWeb')

    stage += hpccm.primitives.comment(__doc__, reformat=False)

    # Base image definition
    stage += hpccm.primitives.baseimage(image='nvcr.io/nvidia/pytorch:22.02-py3', _distro=args.distro)

    stage += hpccm.primitives.label(
        metadata={
            'br.lnls.gcd.mantainer': "'Data Science and Management Group <gcd.lnls.br>'",
            'br.lnls.gcd.version': "'22.02-py3'",
    })

    # variables
    stage += hpccm.primitives.comment('GCD package repository ID')
    stage += hpccm.primitives.environment(
        variables={
            'GCD_PKG_REPO': '3702',
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
            'CPATH': '/usr/include/hdf5/serial/:$CPATH',
            'HDF5_INCLUDE_PATH': '/usr/include/hdf5/serial/:$HDF5_INCLUDE_PATH',
            'LD_LIBRARY_PATH': '/usr/lib/x86_64-linux-gnu:$CUDA_HOME/lib64:$CUDA_HOME/lib64/stubs:$LD_LIBRARY_PATH',
            'LIBRARY_PATH': '/usr/lib/x86_64-linux-gnu:$CUDA_HOME/lib64:$CUDA_HOME/lib64/stubs:$LIBRARY_PATH',
            'NODE_PATH': '$NVM_DIR/v$NODE_VERSION/lib/node_modules',
            'PATH': '$CUDA_HOME/bin:$CUDA_HOME/nvvm/bin:$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH',
        }
    )

    stage += hpccm.primitives.environment(
        variables={
            'NODE_VERSION': '20.12.2',
            'NVM_DIR': '/usr/local/nvm',
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
        'cmake',
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

    # Mellanox OFED
    stage += hpccm.building_blocks.mlnx_ofed(version='5.1-2.5.8.0', _distro=args.distro)

    # Configuring pip
    stage += hpccm.primitives.shell(
        commands=[
            'python3 -m pip config set global.extra-index-url https://gitlab.cnpem.br/api/v4/projects/3702/packages/pypi/simple',
            'python3 -m pip config set global.trusted-host gitlab.cnpem.br',
        ],
        chdir=False,
    )


    # Install python build dependencies
    stage += hpccm.building_blocks.pip(
        ospackages=[],
        packages=[
            'build',
            'cmake-setuptools',
            'cmake>=3.18.0',
            'cmake_setup',
            'cython==0.29.30',
            'pip>=22.0.4',
            'setuptools>=69.0.3',
            'wheel',
        ],
        pip='pip3',
    )

    stage += hpccm.building_blocks.pip(
        ospackages=[],
        packages=[
            'blinker',
            'cbf',
            'nibabel',
            'SharedArray==3.2.0',
            'sysv_ipc',
        ],
        pip='pip3',
    )

    stage += hpccm.primitives.shell(
        commands=[
            'conda install -c conda-forge -y mpi4py==3.1.4',
            'conda clean -afy',
        ],
        chdir=False,
    )

    # Install requirements
    stage += hpccm.building_blocks.pip(ospackages=[], requirements='backend/requirements.txt', pip='pip3')
    stage += hpccm.building_blocks.pip(ospackages=[], requirements='backend/requirements-dev.txt', pip='pip3')

    # Install frontend dep    # Install frontend dependencies
    stage += hpccm.primitives.shell(
        commands=[
            'source $NVM_DIR/nvm.sh',
            'nvm install v$NODE_VERSION',
            'nvm alias default v$NODE_VERSION',
            'nvm use default',
        ],
        chdir=False,
    )

    stage += hpccm.primitives.shell(
        commands=[
            'source $NVM_DIR/nvm.sh',
            'npm install -g ionic yarn serve',
        ],
        chdir=False,
    )

    stage += hpccm.primitives.shell(commands=['npm install -g ionic yarn serve'], chdir=False)

    # setup NVM environment
    stage += hpccm.primitives.shell(commands=["echo 'source $NVM_DIR/nvm.sh' >> /etc/bash.bashrc"], chdir=False)

    # Output container specification
    print(stage)


if __name__ == "__main__":
    main()
