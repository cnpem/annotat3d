#/usr/bin/env bash

SIF_FILE=$1
VERSION=$2
GCC_APPS=$3

echo "Deploying ${VERSION} version on ${GCC_APPS}"

cp scripts/request_port.py${GCC_APPS}/ssc-annotat3d/
cp scripts/Annotat3DWeb_${VERSION} ${GCC_APPS}/ssc-annotat3d/
cp ${SIF_FILE} "${GCC_APPS}"/ssc-annotat3d/Annotat3DWeb_${VERSION}.sif
