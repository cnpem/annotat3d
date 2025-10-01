#!/usr/bin/env python

"""
Title: HPCCM two-stage recipe for the Annotat3DWeb project.

Description:
Base stage for development (build tools, CUDA, Conda, etc.) and production stage (runtime only,
copies built frontend/backend artifacts from base).

Usage:
  python3 hpccm-annotat3d.py --format docker --stage base > Dockerfile.base
  python3 hpccm-annotat3d.py --format docker --stage production --base_image base.sif > Dockerfile.production
  python3 hpccm-annotat3d.py --format singularity --stage base > base.def
  python3 hpccm-annotat3d.py --format singularity --stage production --base_image base.sif > production.def
"""

import argparse
import hpccm

parser = argparse.ArgumentParser(description="HPCCM recipe for the Annotat3DWeb project")
parser.add_argument("--format", default="singularity", choices=["docker", "singularity"], help="Container format")
parser.add_argument("--stage", required=True, choices=["base", "development", "production"], help="Which stage to generate")
parser.add_argument("--singularity_version", default="3.6.4", help="Singularity version")
parser.add_argument("--distro", default="ubuntu22", choices=["ubuntu20", "ubuntu22"], help="Linux distro")
parser.add_argument("--cuda", default="11.8.0", help="CUDA version")
parser.add_argument("--gcc", default="9", help="GCC version")
parser.add_argument("--mlnx", default="5.1-2.5.8.0", help="Mellanox OFED version")
parser.add_argument("--ompi", default="4.1.0", help="OpenMPI version")
parser.add_argument("--hdf5", default="1.10.7", help="HDF5 version")
parser.add_argument("--conda", default="24.3.0-0", help="Conda version")
parser.add_argument("--python", default="py39", help="Python version for Conda")
parser.add_argument("--base-image", default="base.sif", help="Base image for production stage (Singularity)")
args = parser.parse_args()

# Set HPCCM configuration
hpccm.config.set_container_format(args.format)
hpccm.config.set_singularity_version(args.singularity_version)
hpccm.config.set_working_directory("/opt/annotat3d")

# Common variables
devel_image = f"nvcr.io/nvidia/cuda:{args.cuda}-cudnn8-devel-{args.distro}.04"
runtime_image = f"nvcr.io/nvidia/cuda:{args.cuda}-cudnn8-runtime-{args.distro}.04"

# Shared HDF5 URL
hdf5_url = f"https://support.hdfgroup.org/ftp/HDF5/releases/hdf5-{args.hdf5[:4]}/hdf5-{args.hdf5}/src/hdf5-{args.hdf5}.tar.gz"

# ===============================
#        BASE STAGE
# ===============================
if args.stage == "base":
    base = hpccm.Stage()
    base.name = "base"
    base += hpccm.primitives.comment(__doc__, reformat=False)
    base += hpccm.primitives.baseimage(image=devel_image, _distro=args.distro, _as="base")

    base += hpccm.primitives.label(metadata={
        "maintainer": "'Data Science and Management Group <gcd.lnls.br>'",
        "version": f"{args.cuda}-cudnn8-{args.distro}.04-{args.python}"
    })

    # Environment variables
    base += hpccm.primitives.environment(
        variables={
            "CC": "gcc",
            "CUDA_HOME": "/usr/local/cuda",
            "CXX": "g++",
        }
    )
    base += hpccm.primitives.environment(
        variables={
            "CUDA_TOOLKIT_PATH": "$CUDA_HOME",
            "NODE_VERSION": "20.12.2",
            "NVM_DIR": "/opt/nvm",
        }
    )
    base += hpccm.primitives.environment(
        variables={
            "CPATH": "/usr/include/hdf5/serial/:$CUDA_HOME/include:$CPATH",
            "HDF5_DIR": "/usr/local/hdf5",
            "LD_LIBRARY_PATH": "/usr/local/hdf5/lib:/usr/local/openmpi/lib:$LD_LIBRARY_PATH",
            "NODE_PATH": "$NVM_DIR/v$NODE_VERSION/lib/node_modules",
            "PATH": "/opt/conda/bin:/usr/local/openmpi/bin:$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH",
        },
        raw=True
    )

    # Create symbolic links for CUDA libraries and headers in standard system paths
    # so that compilers and build scripts can find them without needing custom paths.
    base += hpccm.primitives.shell(
        commands=[
            "ln -sf $CUDA_HOME/lib64/*.* /usr/lib/",
            "ln -sf $CUDA_HOME/include/*.* /usr/include/",
        ],
        chdir=False,
    )

    # Install development tools
    ospackages = [
        "autoconf",
        "autoconf-archive",
        "automake",
        "binutils",
        "build-essential",
        "bzip2",
        "ca-certificates",
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
        "libhdf5-*",
        "libnetcdf-dev",
        "libnss3",
        "libopenmpi-dev",
        "libssl-dev",
        "libtool",
        "libxss1",
        "make",
        "openjdk-8-jdk",
        "openmpi-bin",
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
        "zlib1g-dev",
    ]
    base += hpccm.building_blocks.apt_get(ospackages=ospackages)

    # Compilers, CMake, OFED, OpenMPI
    compiler = hpccm.building_blocks.gnu(version=args.gcc)
    base += compiler
    base += hpccm.building_blocks.cmake(version="3.23.3", eula=True)
    base += hpccm.building_blocks.openmpi(version=args.ompi, toolchain=compiler.toolchain)

    # HDF5 build
    base += hpccm.primitives.shell(
        commands=[
            f"wget -q --no-check-certificate -O /opt/annotat3d/hdf5-{args.hdf5}.tar.gz {hdf5_url}",
            f"gzip -cd /opt/annotat3d/hdf5-{args.hdf5}.tar.gz | tar xvf - -C /opt/annotat3d",
            f"cd /opt/annotat3d/hdf5-{args.hdf5} && CC=gcc CXX=g++ F77=gfortran F90=gfortran FC=gfortran ./configure --prefix=/usr/local/hdf5 --enable-cxx --enable-fortran",
            "make -j$(nproc)", "make -j$(nproc) install",
            f"rm -rf /opt/annotat3d/hdf5-{args.hdf5} /opt/annotat3d/hdf5-{args.hdf5}.tar.gz",
        ],
        chdir=False,
    )

    # Conda installation
    base += hpccm.building_blocks.conda(
        channels=["conda-forge","nvidia"],
        prefix="/opt/conda",
        version=args.conda,
        python_subversion=args.python,
        eula=True
    )

    # Update tools to build python packages
    base += hpccm.primitives.shell(
        commands=["python3 -m pip install --upgrade pip setuptools wheel build pyclean"],
        chdir=False,
    )

    # Copy project
    base += hpccm.primitives.copy(src=".", dest="/opt/annotat3d")

    # Backend: Install pip dependencies
    base += hpccm.primitives.shell(
        commands=[
            "python3 -m pip install numpy==1.22.3",
            "python3 -m pip install SharedArray==3.2.0",
            "python3 -m pip install /opt/annotat3d/backend/external/wheels/*.whl",
        ],
        chdir=False,
    )

    # Install requirements
    base += hpccm.building_blocks.pip(ospackages=[], requirements="backend/requirements.txt", pip="pip3")
    base += hpccm.building_blocks.pip(ospackages=[], requirements="backend/requirements-dev.txt", pip="pip3")

    # Backend: build
    base += hpccm.primitives.shell(
        commands=[
            "cd /opt/annotat3d/backend",
            "export MAKEFLAGS='-j64'",
            "python3 setup.py build_ext -j64 bdist_wheel",
        ],
        chdir=False,
    )

    # Frontend: setup
    base += hpccm.primitives.shell(
        commands=[
            "mkdir -p $NVM_DIR",
            "wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash",
            ". $NVM_DIR/nvm.sh",
            "nvm install v$NODE_VERSION",
            "nvm alias default v$NODE_VERSION",
            "nvm use default",
            "npm install -g ionic yarn serve"
        ],
        chdir=False,
    )

    # Frontend: install dependencies
    base += hpccm.primitives.shell(
        commands=[
            "cd /opt/annotat3d",
            "yarn install",
        ],
        chdir=False,
    )

    print(base)

# ===============================
#       PRODUCTION STAGE
# ===============================
elif args.stage == "production":
    production = hpccm.Stage()

    # Base image
    if args.format == "docker":
        print()
        production += hpccm.primitives.baseimage(image="base", _as="production")
        production += hpccm.primitives.copy(_from="base", src="/usr/local/hdf5", dest="/usr/local/hdf5")
        production += hpccm.primitives.copy(_from="base", src="/usr/local/openmpi", dest="/usr/local/openmpi")
        production += hpccm.primitives.copy(_from="base", src="/opt/conda", dest="/opt/conda")
        production += hpccm.primitives.copy(_from="base", src="/opt/nvm", dest="/opt/nvm")
        production += hpccm.primitives.copy(_from="base", src="/opt/annotat3d", dest="/opt/annotat3d")
    elif args.format == "singularity":
        production += hpccm.primitives.baseimage(_bootstrap='localimage', image=args.base_image, _distro=args.distro)

    # Environment variables
    production += hpccm.primitives.environment(
        variables={
            "CC": "gcc",
            "CUDA_HOME": "/usr/local/cuda",
            "CXX": "g++",
        }
    )
    production += hpccm.primitives.environment(
        variables={
            "CUDA_TOOLKIT_PATH": "$CUDA_HOME",
            "NODE_VERSION": "20.12.2",
            "NVM_DIR": "/opt/nvm",
        }
    )
    production += hpccm.primitives.environment(
        variables={
            "CPATH": "/usr/include/hdf5/serial/:$CUDA_HOME/include:$CPATH",
            "HDF5_DIR": "/usr/local/hdf5",
            "LD_LIBRARY_PATH": "/usr/local/hdf5/lib:/usr/local/openmpi/lib:$LD_LIBRARY_PATH",
            "NODE_PATH": "$NVM_DIR/v$NODE_VERSION/lib/node_modules",
            "PATH": "/opt/conda/bin:/usr/local/openmpi/bin:$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH",
        },
        raw=True
    )

    # Python environment and installation
    production += hpccm.primitives.environment(variables={
        "PYTHONNOUSERSITE": "1"
    })

    # Frontend: build
    production += hpccm.primitives.shell(
        commands=[
            "cd /opt/annotat3d",
            "yarn build",
            # Copy build artifacts into backend
            "mkdir -p backend/sscAnnotat3D/static/",
            "mkdir -p backend/sscAnnotat3D/templates/",
            "cp -rf build/static/* backend/sscAnnotat3D/static/ || true",
            "cp -rf build/index.html backend/sscAnnotat3D/templates/ || true",
        ],
        chdir=False,
    )

    # Backend: build
    production += hpccm.primitives.shell(
        commands=[
            "cd /opt/annotat3d/backend",
            "export MAKEFLAGS='-j64'",
            "python3 -m pip install -r requirements.txt",
            "python3 setup.py build_ext -j64 bdist_wheel",
        ],
        chdir=False,
    )

    # Install wheel + gunicorn
    production += hpccm.primitives.shell(
        commands=[
            "python3 -m pip install /opt/annotat3d/backend/dist/*.whl",
            "python3 -m pip install gunicorn",
        ]
    )

    # Entrypoint (runs by default)
    if 'docker' in args.format:
        gunicorn_command = 'gunicorn --bind 0.0.0.0:8000 --timeout 3600 --threads 32 --workers 1 sscAnnotat3D.app:app "$@"'
    else:
        gunicorn_command =  "gunicorn --bind 0.0.0.0:8000 --timeout 3600 --threads 32 --workers 1 sscAnnotat3D.app:app"

    production += hpccm.primitives.runscript(commands=[gunicorn_command])

    print(production)
