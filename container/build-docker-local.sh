#!/usr/bin/env bash

# WARNING: This script must be executed from project root directory

rm -f container/Dockerfile.local

# -- Create a Dockerfile from the HPCCM recipe
python3 container/hpccm-annotat3d-local.py --format docker --stage base > container/Dockerfile.local
python3 container/hpccm-annotat3d-local.py --format docker --stage production >> container/Dockerfile.local

# -- Build a Docker Image
docker build -t annotat3d-prod:local -f container/Dockerfile.local .
