#!/usr/bin/env bash

# WARNING: This script must be executed from project root directory

# -- Create a Singularity Recipe from the HPCCM recipe
python3 container/hpccm.annotat3dweb.cuda112.py > container/Singularity.annotat3dweb.cuda112.def

# -- Build a Singularity Image
sudo singularity build annotat3dweb.cuda112.sif container/Singularity.annotat3dweb.cuda112.def
