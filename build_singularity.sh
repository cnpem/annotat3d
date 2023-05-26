#!/usr/bin/env bash

echo $GCC_PYPI_HOST

SINGULARITYENV_GCC_PYPI_HOST=$GCC_PYPI_HOST SINGULARITYENV_GCC_PYPI_SERVER=$GCC_PYPI_SERVER sudo singularity build Annotat3DWeb.sif Singularity

