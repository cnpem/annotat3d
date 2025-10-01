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
    rm -f container/Singularity-base.def
    python3 container/hpccm-annotat3d.py --format singularity --stage base > container/Singularity-base.def
    # sudo -E singularity build annotat3d-base.sif container/Singularity-base.def

elif [[ "$STAGE" == "production" ]]; then
    echo "Building production stage..."
    rm -f container/Singularity-production.def
    python3 container/hpccm-annotat3d.py --format singularity --stage production --base-image annotat3d-base.sif > container/Singularity-production.def
    # sudo -E singularity build annotat3d-prod.sif container/Singularity-production.def

else
    echo "Invalid stage: $STAGE"
    echo "Usage: $0 {base|production}"
    exit 1
fi
