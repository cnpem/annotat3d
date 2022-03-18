from gccdockers/tensorflow:cuda-11.2_tf-2.7.0_trt-8.0.0.3

#env MPI_DIR=/opt/ompi
#env PATH="$MPI_DIR/bin:$HOME/.local/bin:$PATH"
#env LD_LIBRARY_PATH="$MPI_DIR/lib:$LD_LIBRARY_PATH"

arg img_cuda_version="11.2"

arg GCC_PYPI_SERVER

arg GCC_PYPI_HOST

label maintainer="alan.peixinho@lnls.br"

run echo "CUDA_VERSION: ${img_cuda_version}"

run export PATH=$PATH:/usr/local/cuda-${img_cuda_version}/bin:/usr/local/cuda-${img_cuda_version}/nvvm/bin

run ln -sf /usr/local/cuda/lib64/*.* /usr/lib/
run ln -sf /usr/local/cuda/include/*.* /usr/include/

run apt-get -y update
run apt-get -y upgrade
run apt-get install -y gcc-8 g++-8

run ls /usr/bin/gcc*

run update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-8 10
run update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-8 10
run gcc --version

#run printf "deb mirror://mirrors.ubuntu.com/mirrors.txt bionic main restricted universe multiverse\ndeb mirror://mirrors.ubuntu.com/mirrors.txt bionic-updates main restricted universe multiverse\ndeb mirror://mirrors.ubuntu.com/mirrors.txt bionic-backports main restricted universe multiverse\ndeb mirror://mirrors.ubuntu.com/mirrors.txt bionic-security main restricted universe multiverse" > /etc/apt/sources.list
env TZ=America/Sao_Paulo
run ln -snf /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime && echo $TZ > /etc/timezone

#some packages broke dont know why
#run dpkg --configure -a
run apt-get -y update
run apt-get -y -f upgrade
run apt-get install -y -f curl netbase libnss3 nvidia-modprobe python3-numpy libhdf5-dev libpython3-dev libpython3-dev vim git python3 gdb python3-dev python3-pip build-essential virtualenvwrapper libglib2.0-0 fontconfig libxss1 wget

#RDMA stuff
run apt-get install -y -f doxygen libwebsockets-dev rdmacm-utils infiniband-diags libpsm-infinipath1-dev libibverbs-dev libibverbs1 librdmacm-dev ibacm mstflint opensm patch qperf pciutils

run mkdir -p ~/.pip
run printf "[global]\nindex-url = $GCC_PYPI_SERVER\ntrusted-host = $GCC_PYPI_HOST\nextra-index-url = https://pypi.python.org/simple" > ~/.pip/pip.conf

#add https://download.open-mpi.org/release/open-mpi/v3.1/openmpi-3.1.4.tar.bz2 .
#run tar xf openmpi-3.1.4.tar.bz2 \
    #&& cd openmpi-3.1.4 \
    #&& ./configure --prefix=$MPI_DIR \
    #&& make -j4 all \
    #&& make install \
    #&& cd .. && rm -rf \
    #openmpi-3.1.4 openmpi-3.1.4.tar.bz2 /tmp/*

run conda install -c conda-forge mpi4py openmpi

run python3 -m pip install --upgrade pip==22.0.4 setuptools==59.8.0 wheel
run python3 -m pip install --upgrade cmake==3.17.3 cython cmake-setuptools
run python3 -m pip install --upgrade blinker nibabel opencv-python-headless scikit-image #some dependencies fix later

#rapids
#run apt-get install -y libboost-all-dev
env CUDA_HOME=/usr/local/cuda-${img_cuda_version}

run ls /usr/local/cuda-${img_cuda_version}
run update-alternatives --install /usr/bin/python python /usr/bin/python3 10
run python --version

run curl -sL https://deb.nodesource.com/setup_16.x  | bash -
run apt-get -y install nodejs

run npm install -g ionic yarn serve

add backend/app.py /opt/Annotat3D/
add dist/ /opt/Annotat3D/
