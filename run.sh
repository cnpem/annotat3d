#/usr/bin/env bash

intexit() {
    # Kill all subprocesses (all processes in the current process group)
    kill -HUP -$$
}

hupexit() {
    # HUP'd (probably by intexit)
    echo
    echo "Interrupted"
    exit
}

trap hupexit HUP
trap intexit INT

python3 backend/sscAnnotat3D/app.py &
ionic serve &

wait
echo "all done"
