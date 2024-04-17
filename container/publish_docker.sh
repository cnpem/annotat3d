#!/usr/bin/env bash

docker login gitregistry.cnpem.br
docker push gitregistry.cnpem.br/gcd/data-science/segmentation/ssc-annotat3d:cuda-11.2
