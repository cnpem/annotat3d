#!/usr/bin/env bash

# WARNING: This script must be executed from project root directory

rm -f container/Dockerfile
python3 container/hpccm-annotat3d.py --format docker --stage base > container/Dockerfile
python3 container/hpccm-annotat3d.py --format docker --stage production >> container/Dockerfile
docker build -t annotat3d-prod:latest -f container/Dockerfile .
