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


FLASK_APP=sscAnnotat3D.app flask run --host 0.0.0.0 &
serve -s /opt/Annotat3D/build &

wait
echo "all done"
