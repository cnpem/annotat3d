"""
Annotat3DWeb Base Image

Contents:
    Ubuntu version 20.04
    NVIDIA CUDA version 11.2.0 including cuBLAS version 11.3.1
    NVIDIA cuDNN version 8.1.0
    NVIDIA NCCL version 2.8.4 (optimized for NVLink)
    APEX
    TensorBoard version 1.15.5
    Nsight Compute version 2020.3.0.18
    Nsight Systems version 2020.4.3.7
    TensorRT version7.2.2.3+cuda11.1.0.024
    DALI version 0.29.0
    MAGMA version 2.5.2
    DLProf version 0.19.0
    PyProf version r21.02
    OpenMPI version 4.0.5
    GNU compilers version 8
    Mellanox OFED version 5.1-2.5.8.0
    HDF5 version 1.10.5
    Anaconda version 23.1.0-1
    Node version v20.12.2
    Annotat3DWeb Dependencies
"""

# pylint: disable=invalid-name, undefined-variable, used-before-assignment

import argparse

import hpccm


def parse_args():
    parser = argparse.ArgumentParser(description="Annotat3DWeb Base Image")
    parser.add_argument(
        "--format",
        type=str,
        default="singularity",
        choices=["docker", "singularity"],
        help="Container specification format (default=%(default)s).",
    )
    parser.add_argument(
        "--singularity_version",
        type=str,
        default="3.6",
        help="Singularity version (default=%(default)s).",
    )

    return parser.parse_args()


def main():

    args = parse_args()

    # Create stage
    stage = hpccm.Stage()

    # HPCCM configuration
    hpccm.config.set_container_format(args.format)
    hpccm.config.set_singularity_version(args.singularity_version)
    hpccm.config.set_working_directory("/opt/Annotat3DWeb")

    stage += hpccm.primitives.comment(__doc__, reformat=False)

    # Base image definition
    stage += hpccm.primitives.baseimage(image="nvcr.io/nvidia/pytorch:21.02-py3", _distro="ubuntu20", _arch="x86_64")

    stage += hpccm.primitives.label(
        metadata={
            'br.lnls.gcd.mantainer': 'GCD Team <gcd.lnls.br>',
            'br.lnls.gcd.release': 'production',
            'br.lnls.gcd.version': '21.02-py3',
    })

    # Install development tools
    ospackages = [
        "autoconf",
        "autoconf-archive",
        "automake",
        "binutils",
        "build-essential",
        "bzip2",
        "ca-certificates",
        "cmake",
        "coreutils",
        "curl",
        "doxygen",
        "environment-modules",
        "expect",
        "fontconfig",
        "gdb",
        "gfortran",
        "git",
        "gzip",
        "ibacm",
        "libgl1",
        "libgl1-mesa-dev",
        "libglib2.0-0",
        "libnss3",
        "libssl-dev",
        "libtool",
        "libxss1",
        "make",
        "openjdk-8-jdk",
        "openssh-client",
        "patch",
        "pciutils",
        "pkg-config",
        "qperf",
        "tar",
        "tcl",
        "unzip",
        "vim",
        "wget",
        "xz-utils",
        "zip",
    ]
    stage += hpccm.building_blocks.apt_get(ospackages=ospackages)

    # variables
    stage += hpccm.primitives.environment(variables={"CUDA_HOME": "/usr/local/cuda", "CUDA_TOOLKIT_PATH": "$CUDA_HOME"})

    stage += hpccm.primitives.environment(
        variables={
            "CC": "gcc",
            "CXX": "g++",
        }
    )

    stage += hpccm.primitives.environment(
        variables={
            "NODE_VERSION": "20.12.2",
            "NVM_DIR": "/usr/local/nvm",
        }
    )

    stage += hpccm.primitives.environment(
        variables={
            "NODE_PATH": "$NVM_DIR/v$NODE_VERSION/lib/node_modules",
            "PATH": "/usr/local/cuda/bin:/usr/local/cuda/nvvm/bin:$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH",
            "LD_LIBRARY_PATH": "/usr/lib/x86_64-linux-gnu:$CUDA_HOME/lib64:$CUDA_HOME/lib64/stubs:$LD_LIBRARY_PATH",
            "LIBRARY_PATH": "/usr/lib/x86_64-linux-gnu:$CUDA_HOME/lib64:$CUDA_HOME/lib64/stubs:$LIBRARY_PATH",
        }
    )

    # GNU compilers
    compiler = hpccm.building_blocks.gnu(version="8")
    stage += compiler

    # Mellanox OFED
    stage += hpccm.building_blocks.mlnx_ofed(version="5.1-2.5.8.0", _distro="ubuntu20")

    # HDF5
    stage += hpccm.building_blocks.hdf5(version="1.10.5", toolchain=compiler.toolchain)

    # Python
    stage += hpccm.primitives.shell(commands=["rm -rf /opt/conda"], chdir=False)
    stage += hpccm.building_blocks.conda(version="23.1.0-1", python_subversion="py39", prefix="/opt/conda", eula=True)

    # Configuring pip
    stage += hpccm.primitives.shell(
        commands=[
            "python3 -m pip config --user set global.extra-index-url http://gcc.lnls.br:3128",
            "python3 -m pip config --user set global.trusted-host gcc.lnls.br",
        ],
        chdir=False,
    )

    # Install python build dependencies
    stage += hpccm.building_blocks.pip(
        ospackages=[],
        packages=[
            "pip==22.0.4",
            "setuptools==69.0.3",
            "wheel",
            "cmake==3.17.3",
            "cython==0.29.30",
            "cmake-setuptools",
            "SharedArray==3.2.0",
            "nibabel",
            "blinker",
        ],
        pip="pip3",
    )

    # Install requirements
    stage += hpccm.building_blocks.pip(ospackages=[], requirements="backend/requirements.txt", pip="pip3")
    stage += hpccm.building_blocks.pip(ospackages=[], requirements="backend/requirements-dev.txt", pip="pip3")

    # Install frontend dependencies
    stage += hpccm.primitives.shell(
        commands=[
            ". $NVM_DIR/nvm.sh",
            "nvm install v$NODE_VERSION --reinstall-packages-from=v15",
            "nvm uninstall v15",
            "nvm alias default v$NODE_VERSION",
            "nvm use default",
        ],
        chdir=False,
    )

    stage += hpccm.primitives.shell(commands=["npm install -g ionic yarn serve"], chdir=False)

    # Output container specification
    print(stage)


if __name__ == "__main__":
    main()
