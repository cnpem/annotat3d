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

#/usr/bin/env bash

bash -c "sleep 10 && ls -1" &
bash -c "sleep 5 && echo hue" &
wait
echo "all done"
