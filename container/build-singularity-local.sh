#!/usr/bin/env bash

# WARNING: This script must be executed from project root directory

set -e

STAGE=${1:-base}

if [[ -z "$STAGE" ]]; then
    echo "Usage: $0 {base|production}"
    exit 1
fi

if [[ "$STAGE" == "base" ]]; then
    echo "Building base stage..."
    rm -f container/Singularity-base-local.def
    python3 container/hpccm-annotat3d-local.py --format singularity --stage base > container/Singularity-base-local.def
    sudo -E singularity build annotat3d-base-local.sif container/Singularity-base-local.def

elif [[ "$STAGE" == "production" ]]; then
    echo "Building production stage..."
    rm -f container/Singularity-production-local.def
    python3 container/hpccm-annotat3d-local.py --format singularity --stage production --base-image annotat3d-base-local.sif > container/Singularity-production-local.def
    sudo -E singularity build annotat3d-production-local.sif container/Singularity-production-local.def

else
    echo "Invalid stage: $STAGE"
    echo "Usage: $0 {base|production}"
    exit 1
fi
