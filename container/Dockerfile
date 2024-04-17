FROM gccdockers/tensorflow:cuda-11.2_tf-2.7.0_trt-8.0.0.3

ARG IMG_CUDA_VERSION="11.2"
ARG GCC_PYPI_SERVER
ARG GCC_PYPI_HOST

ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime && echo $TZ > /etc/timezone

LABEL maintainer="Data Science and Management Group at LNLS/Sirius <gcd@lnls.br>"

RUN echo "CUDA_VERSION: ${IMG_CUDA_VERSION}"

RUN export PATH=$PATH:/usr/local/cuda-${IMG_CUDA_VERSION}/bin:/usr/local/cuda-${IMG_CUDA_VERSION}/nvvm/bin

RUN ln -sf /usr/local/cuda/lib64/*.* /usr/lib/
RUN ln -sf /usr/local/cuda/include/*.* /usr/include/

RUN apt-get -y update && apt-get -y upgrade && \
    apt-get install -y gcc-8 g++-8 && \
    apt-get autoclean && apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* ~/.cache

RUN ls /usr/bin/gcc*

RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-8 10
RUN update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-8 10
RUN gcc --version

RUN apt-get -y update && \
    apt-get install -y -f curl netbase libnss3 nvidia-modprobe python3-numpy libhdf5-dev libpython3-dev libpython3-dev vim git python3 gdb python3-dev python3-pip build-essential virtualenvwrapper libglib2.0-0 fontconfig libxss1 wget libgl1 && \
    apt-get autoclean && apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* ~/.cache

RUN apt-get -y update && \
    apt-get install -y -f doxygen libwebsockets-dev rdmacm-utils infiniband-diags libpsm-infinipath1-dev libibverbs-dev libibverbs1 librdmacm-dev ibacm mstflint opensm patch qperf pciutils && \
    apt-get autoclean && apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* ~/.cache

RUN mkdir -p ~/.pip
RUN printf "[global]\nindex-url = $GCC_PYPI_SERVER\ntrusted-host = $GCC_PYPI_HOST\nextra-index-url = https://pypi.python.org/simple" > ~/.pip/pip.conf

RUN conda install -c conda-forge mpi4py openmpi

RUN python3 -m pip install --upgrade pip==22.0.4 setuptools==60.10.0 wheel && \
    python3 -m pip install --upgrade cmake==3.17.3 cython cmake-setuptools && \
    python3 -m pip install --upgrade blinker nibabel scikit-image==0.18.3 SharedArray==3.2.0 #some dependencies fix later && \
    rm -rf /root/.cache/pip

ADD backend/requirements.txt /opt/Annotat3D/requirements.txt
ADD backend/requirements.txt /opt/Annotat3D/requirements-dev.txt

RUN python3 -m pip install -r /opt/Annotat3D/requirements.txt && \
    python3 -m pip install -r /opt/Annotat3D/requirements-dev.txt && \
    rm -rf /root/.chache/pip

ENV CUDA_HOME=/usr/local/cuda-${IMG_CUDA_VERSION}

RUN ls /usr/local/cuda-${IMG_CUDA_VERSION}
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 10
RUN python --version

RUN curl -sL https://deb.nodesource.com/setup_16.x  | bash -
RUN apt-get -y install nodejs

RUN npm install -g ionic yarn serve
