# 
# Title: HPCCM recipe for the HARPIA project.
# 
# Description: This scripts implement an HPCCM recipe for the HARPIA project. The default arguments of this recipe will install the following packages:
# - Ubuntu version 20.04
# - CUDA version 11.2.2
# - cuDNN version 8.1.1
# - GNU Compiler version 9
# - OS packages for development
# - GNU compilers version 9
# - Mellanox OFED version 5.1-2.5.8.0
# - OpenMPI version 4.1.0
# - HDF5 version 1.10.7
# - Anaconda version 24.3.0-0
# 
# Usage:
#     - python3 hpccm-cuda-gcc-openmpi-hdf-conda.py --format docker --cuda 11.2.2 --opmpi 4.1.0 --python py39 > Dockerfile
#     - python3 hpccm-cuda-gcc-openmpi-hdf-conda.py --format singularity --cuda 11.2.2 --opmpi 4.1.0 --python py39 > Singularity.def
# 

FROM nvcr.io/nvidia/cuda:11.2.2-cudnn8-devel-ubuntu20.04

LABEL br.lnls.gcd.mantainer='Data Science and Management Group <gcd.lnls.br>' \
    br.lnls.gcd.version=11.2.2-cudnn8-ubuntu20.04-py39

# GCD package repository ID

ENV GCD_PKG_REPO=3702

ENV CC=gcc \
    CXX=g++

ENV CUDA_HOME=/usr/local/cuda \
    CUDA_TOOLKIT_PATH=$CUDA_HOME

ENV CPATH=/usr/include/hdf5/serial/:$CUDA_HOME/include:$CPATH \
    HDF5_INCLUDE_PATH=/usr/include/hdf5/serial/:$HDF5_INCLUDE_PATH \
    LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$CUDA_HOME/lib64:$CUDA_HOME/lib64/stubs:$LD_LIBRARY_PATH \
    PATH=/opt/conda/bin:$CUDA_HOME/bin:$CUDA_HOME/nvvm/bin:$PATH

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        autoconf \
        autoconf-archive \
        automake \
        binutils \
        build-essential \
        bzip2 \
        ca-certificates \
        coreutils \
        curl \
        doxygen \
        environment-modules \
        expect \
        fontconfig \
        gdb \
        gfortran \
        git \
        gzip \
        ibacm \
        libgl1 \
        libgl1-mesa-dev \
        libglib2.0-0 \
        libhdf5-* \
        libnetcdf-dev \
        libnss3 \
        libopenmpi-dev \
        libssl-dev \
        libtool \
        libxss1 \
        make \
        openjdk-8-jdk \
        openmpi-bin \
        openssh-client \
        patch \
        pciutils \
        pkg-config \
        qperf \
        tar \
        tcl \
        unzip \
        vim \
        wget \
        xz-utils \
        zip \
        zlib1g-dev && \
    rm -rf /var/lib/apt/lists/*

# GNU compiler
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        g++-9 \
        gcc-9 \
        gfortran-9 && \
    rm -rf /var/lib/apt/lists/*
RUN update-alternatives --install /usr/bin/g++ g++ $(which g++-9) 30 && \
    update-alternatives --install /usr/bin/gcc gcc $(which gcc-9) 30 && \
    update-alternatives --install /usr/bin/gcov gcov $(which gcov-9) 30 && \
    update-alternatives --install /usr/bin/gfortran gfortran $(which gfortran-9) 30

# CMake version 3.23.3
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        make \
        wget && \
    rm -rf /var/lib/apt/lists/*
RUN mkdir -p /var/tmp && wget -q -nc --no-check-certificate -P /var/tmp https://github.com/Kitware/CMake/releases/download/v3.23.3/cmake-3.23.3-linux-x86_64.sh && \
    mkdir -p /usr/local && \
    /bin/sh /var/tmp/cmake-3.23.3-linux-x86_64.sh --prefix=/usr/local --skip-license && \
    rm -rf /var/tmp/cmake-3.23.3-linux-x86_64.sh
ENV PATH=/usr/local/bin:$PATH

# Mellanox OFED version 5.1-2.5.8.0
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        ca-certificates \
        gnupg \
        wget && \
    rm -rf /var/lib/apt/lists/*
RUN wget -qO - https://www.mellanox.com/downloads/ofed/RPM-GPG-KEY-Mellanox | apt-key add - && \
    mkdir -p /etc/apt/sources.list.d && wget -q -nc --no-check-certificate -P /etc/apt/sources.list.d https://linux.mellanox.com/public/repo/mlnx_ofed/5.1-2.5.8.0/ubuntu20.04/mellanox_mlnx_ofed.list && \
    apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        ibverbs-providers \
        ibverbs-utils \
        libibmad-dev \
        libibmad5 \
        libibumad-dev \
        libibumad3 \
        libibverbs-dev \
        libibverbs1 \
        librdmacm-dev \
        librdmacm1 && \
    rm -rf /var/lib/apt/lists/*

# OpenMPI version 4.1.0
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        bzip2 \
        file \
        hwloc \
        libnuma-dev \
        make \
        openssh-client \
        perl \
        tar \
        wget && \
    rm -rf /var/lib/apt/lists/*
RUN mkdir -p /var/tmp && wget -q -nc --no-check-certificate -P /var/tmp https://www.open-mpi.org/software/ompi/v4.1/downloads/openmpi-4.1.0.tar.bz2 && \
    mkdir -p /var/tmp && tar -x -f /var/tmp/openmpi-4.1.0.tar.bz2 -C /var/tmp -j && \
    cd /var/tmp/openmpi-4.1.0 &&  CC=gcc CXX=g++ F77=gfortran F90=gfortran FC=gfortran ./configure --prefix=/usr/local/openmpi --disable-getpwuid --enable-orterun-prefix-by-default --with-cuda --with-verbs && \
    make -j$(nproc) && \
    make -j$(nproc) install && \
    rm -rf /var/tmp/openmpi-4.1.0 /var/tmp/openmpi-4.1.0.tar.bz2
ENV LD_LIBRARY_PATH=/usr/local/openmpi/lib:$LD_LIBRARY_PATH \
    PATH=/usr/local/openmpi/bin:$PATH

# HDF5 version 1.10.7
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        bzip2 \
        file \
        make \
        wget \
        zlib1g-dev && \
    rm -rf /var/lib/apt/lists/*
RUN mkdir -p /var/tmp && wget -q -nc --no-check-certificate -P /var/tmp http://www.hdfgroup.org/ftp/HDF5/releases/hdf5-1.10/hdf5-1.10.7/src/hdf5-1.10.7.tar.bz2 && \
    mkdir -p /var/tmp && tar -x -f /var/tmp/hdf5-1.10.7.tar.bz2 -C /var/tmp -j && \
    cd /var/tmp/hdf5-1.10.7 &&  CC=gcc CXX=g++ F77=gfortran F90=gfortran FC=gfortran ./configure --prefix=/usr/local/hdf5 --enable-cxx --enable-fortran && \
    make -j$(nproc) && \
    make -j$(nproc) install && \
    rm -rf /var/tmp/hdf5-1.10.7 /var/tmp/hdf5-1.10.7.tar.bz2
ENV CPATH=/usr/local/hdf5/include:$CPATH \
    HDF5_DIR=/usr/local/hdf5 \
    LD_LIBRARY_PATH=/usr/local/hdf5/lib:$LD_LIBRARY_PATH \
    LIBRARY_PATH=/usr/local/hdf5/lib:$LIBRARY_PATH \
    PATH=/usr/local/hdf5/bin:$PATH

# Anaconda
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        ca-certificates \
        wget && \
    rm -rf /var/lib/apt/lists/*
RUN mkdir -p /var/tmp && wget -q -nc --no-check-certificate -P /var/tmp http://repo.anaconda.com/miniconda/Miniconda3-py39_24.3.0-0-Linux-x86_64.sh && \
    bash /var/tmp/Miniconda3-py39_24.3.0-0-Linux-x86_64.sh -b -p /opt/conda && \
    /opt/conda/bin/conda init && \
    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    . /opt/conda/etc/profile.d/conda.sh && \
    conda activate base && \
    conda config --add channels conda-forge --add channels nvidia && \
    /opt/conda/bin/conda clean -afy && \
    rm -rf /var/tmp/Miniconda3-py39_24.3.0-0-Linux-x86_64.sh

RUN python3 -m pip config set global.extra-index-url https://gitlab.cnpem.br/api/v4/projects/3702/packages/pypi/simple && \
    python3 -m pip config set global.trusted-host gitlab.cnpem.br

RUN python3 -m pip install --upgrade pip setuptools wheel build pyclean

COPY . /opt/annotat3dweb

# pip
COPY backend/requirements.txt /var/tmp/requirements.txt
RUN pip3 --no-cache-dir install -r /var/tmp/requirements.txt && \
    rm -rf /var/tmp/requirements.txt

# pip
COPY backend/requirements-dev.txt /var/tmp/requirements-dev.txt
RUN pip3 --no-cache-dir install -r /var/tmp/requirements-dev.txt && \
    rm -rf /var/tmp/requirements-dev.txt

RUN cd /opt/annotat3dweb/backend && \
    python3 setup.py bdist_wheel
