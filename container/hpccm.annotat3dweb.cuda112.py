"""
Annotat3DWeb Base Image

Contents:
    Ubuntu version 20.04
    NVIDIA CUDA version 11.2.2
    NVIDIA cuDNN version 8.1.1
    GNU compilers version 9
    OpenMPI version 4.1.0
    HDF5 version 1.10.7
    Mellanox OFED version 5.1-2.5.8.0
    Anaconda version
    RDMA Core version 36.0
    TensorBoard version 2.8.0
    PyTorch version 1.11.0
    Node version v20.12.2
    Annotat3DWeb dependencies
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
    stage += hpccm.primitives.baseimage(image='nvcr.io/nvidia/cuda:11.2.2-cudnn8-devel-ubuntu20.04', _distro=args.distro)

    stage += hpccm.primitives.label(
        metadata={
            'br.lnls.gcd.mantainer': "'Data Science and Management Group <gcd.lnls.br>'",
            'br.lnls.gcd.version': "'11.2.2-cudnn8-ubuntu20.04-py39'",
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
            'PATH': '/opt/conda/bin:$CUDA_HOME/bin:$CUDA_HOME/nvvm/bin:$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH',
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
    compiler = hpccm.building_blocks.gnu(version='9')
    stage += compiler

    # Mellanox OFED
    stage += hpccm.building_blocks.mlnx_ofed(version='5.1-2.5.8.0', _distro=args.distro)

    # OpenMPI
    stage += hpccm.building_blocks.openmpi(version='4.1.0', toolchain=compiler.toolchain)

    # HDF5
    stage += hpccm.building_blocks.hdf5(version='1.10.7', toolchain=compiler.toolchain)

    # Anaconda
    stage += hpccm.building_blocks.conda(channels=['conda-forge', 'nvidia'], prefix='/opt/conda', python_subversion='py39', version='24.3.0-0', eula=True)

    # Configuring pip
    stage += hpccm.primitives.shell(
        commands=[
            'python3 -m pip config set global.extra-index-url https://gitlab.cnpem.br/api/v4/projects/3702/packages/pypi/simple',
            'python3 -m pip config set global.trusted-host gitlab.cnpem.br',
        ],
        chdir=False,
    )

    # Install Annotat3DWeb's backend
    stage += hpccm.primitives.shell(
        commands=[
            'python3 -m pip install --upgrade pip setuptools wheel build',
        ],
        chdir=False,
    )

    # Install python build dependencies
    stage += hpccm.building_blocks.pip(
        ospackages=[],
        packages=[
            'cmake-setuptools',
            'cmake==3.17.3',
            'cmake_setup',
            'cython==0.29.30',
        ],
        pip='pip3',
    )

    stage += hpccm.building_blocks.pip(
        ospackages=[],
        packages=[
            'blinker',
            'cbf',
            'nibabel',
            'sysv_ipc',
        ],
        pip='pip3',
    )

    stage += hpccm.building_blocks.pip(
        ospackages=[],
        packages=[
            'SharedArray==3.2.0',
        ],
        pip='pip3',
    )

    # stage += hpccm.primitives.shell(
    #     commands=[
    #         'python3 -m pip install SharedArray==3.2.0 --no-use-pep517',
    #     ],
    #     chdir=False,
    # )

    stage += hpccm.primitives.shell(
        commands=[
            'conda install -c conda-forge -y mpi4py==3.1.4',
            'conda clean -afy',
        ],
        chdir=False,
    )

    stage += hpccm.building_blocks.pip(ospackages=[], requirements='backend/requirements.txt', pip='pip3')
    stage += hpccm.building_blocks.pip(ospackages=[], requirements='backend/requirements-dev.txt', pip='pip3')
    stage += hpccm.primitives.shell(
        commands=[
            'cd backend',
            'python3 setup.py bdist_wheel',
        ],
        chdir=False,
    )

    # # Install frontend dep    # Install frontend dependencies
    # stage += hpccm.primitives.shell(
    #     commands=[
    #         '. $NVM_DIR/nvm.sh',
    #         'nvm install v$NODE_VERSION',
    #         'nvm alias default v$NODE_VERSION',
    #         'nvm use default',
    #     ],
    #     chdir=False,
    # )

    # stage += hpccm.primitives.shell(
    #     commands=[
    #         '. $NVM_DIR/nvm.sh',
    #         'npm install -g ionic yarn serve',
    #     ],
    #     chdir=False,
    # )

    # # setup NVM environment
    # stage += hpccm.primitives.shell(commands=["echo '. $NVM_DIR/nvm.sh' >> /etc/bash.bashrc"], chdir=False)

    # Output container specification
    print(stage)


if __name__ == "__main__":
    main()
