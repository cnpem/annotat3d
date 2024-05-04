#!/usr/bin/env bash

# WARNING: This script must be executed from project root directory

# -- Create a Dockerfile from the HPCCM recipe
python3 container/hpccm.annotat3dweb.cuda112.py --format docker > container/Dockerfile.annotat3dweb.cuda112

# -- Build a Docker Image
docker build -t gitregistry.cnpem.br/gcd/data-science/segmentation/annotat3dweb:cuda-11.2 -f container/Dockerfile.annotat3dweb.cuda112 .
