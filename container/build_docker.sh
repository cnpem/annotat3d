#!/usr/bin/env bash

docker build -t gitregistry.cnpem.br/gcd/data-science/segmentation/ssc-annotat3d:cuda-11.2 --build-arg GCC_PYPI_SERVER="$GCC_PYPI_SERVER" --build-arg GCC_PYPI_HOST="$GCC_PYPI_HOST" .

