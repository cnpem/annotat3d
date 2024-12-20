#!/usr/bin/env bash

# WARNING: This script must be executed from project root directory

# -- Create a Singularity Recipe from the HPCCM recipe
python3 container/hpccm-cuda-gcc-openmpi-hdf-conda.py --format singularity > container/Singularity.def

# -- Build a Singularity Image
singularity build --fakeroot annotat3dweb.sif container/Singularity.def
