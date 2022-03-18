#!/usr/bin/env bash

docker build -t gccdockers/annotat3d:cuda-11.2 --build-arg GCC_PYPI_SERVER="$GCC_PYPI_SERVER" --build-arg GCC_PYPI_HOST="$GCC_PYPI_HOST" .

echo "docker done"

singularity build Annotat3DWeb.sif Singularity

