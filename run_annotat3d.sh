#!/bin/bash

# echo "PID $!"
# echo "Args: $@"

# Preventing errors when dealing with JSON and using pt_BR, since commas in floating-point
# numbers messe everything up.
export LC_ALL=en_US.UTF-8

export ANNOTAT3D_PATH=$(pwd)
export ANNOTAT3D_VOLUME_PATH=Foo.raw
export ANNOTAT3D_VOLUME_XSIZE=2048 
export ANNOTAT3D_VOLUME_YSIZE=2048 
export ANNOTAT3D_VOLUME_ZSIZE=2048 
export ANNOTAT3D_VOLUME_FORMAT=uint16
VISIBLE_DEVICES="all"  
export ANNOTAT3D_PORT="8083"
export ANNOTAT3D_RTMP_VIDEO_STREAMING_PORT=1935
export ANNOTAT3D_HTTP_PORT=8080
export ANNOTAT3D_ADMIN_HTTP_PORT=8081
export ANNOTAT3D_STREAMING_PORT=3333
export ANNOTAT3D_REACT_FS_TREEVIEW_PORT=8093
export ANNOTAT3D_ADVANCED_STATS_PORT="5005"
export ANNOTAT3D_LNLS_EXTENSION_NOTIF_HOST="localhost" 
export ANNOTAT3D_SCRIPTS=$ANNOTAT3D_PATH/scripts
export ANNOTAT3D_PORT_RANGE0=60000
export ANNOTAT3D_PORT_RANGE1=70000
# export ANNOTAT3D_LNLS_EXTENSION_RENDERING_NOTIF_PORT="12345"
# export ANNOTAT3D_LNLS_EXTENSION_SHUTDOWN_NOTIF_PORT="12346"
export MESSAGE_BUS=$(pwd)/../src/plugins/lnls_extension/message-bus
export PYTHONPATH=$MESSAGE_BUS/python:$PYTHONPATH
export LD_LIBRARY_PATH=$MESSAGE_BUS/build:$LD_LIBRARY_PATH
GDB=""

if [ $(hostname) == "ada" ]; then
    echo "--- NOTE: Adding /usr/local/lib64 to fix issue with path on Ada (i.e., hack)" 
    export LD_LIBRARY_PATH=/usr/local/lib64:$LD_LIBRARY_PATH
fi

project_file="zeros.prj"

# From: https://unix.stackexchange.com/questions/146756/forward-sigterm-to-child-in-bash
prep_signal()
{
    unset child_pid
    unset kill_needed
    trap 'handle_signal' USR1 INT
}

handle_signal()
{
    if [ "${child_pid}" ]; then
        echo "Handling signal ${child_pid}"

        kill -USR1 "${child_pid}" 2>/dev/null
    else
        echo "Kill needed"

        kill_needed="yes"
    fi
}

wait_signal()
{
    child_pid=$!
    if [ "${kill_needed}" ]; then
        kill -USR1 "${child_pid}" 2>/dev/null 
    fi
    echo "CHILD ${child_pid}"
    wait ${child_pid} 2>/dev/null
    trap - USR1 INT
    wait ${child_pid} 2>/dev/null
}

run_index()
{
    export ANNOTAT3D_VOLUME_DIR=$(dirname ${ANNOTAT3D_VOLUME_PATH})
    export ANNOTAT3D_VOLUME_BASENAME=$(basename ${ANNOTAT3D_VOLUME_PATH})
    export ANNOTAT3D_VOLUME_EXT=.${ANNOTAT3D_VOLUME_BASENAME#*.}
    export ANNOTAT3D_VOLUME_BASENAME=${ANNOTAT3D_VOLUME_BASENAME%${ANNOTAT3D_VOLUME_EXT}}

    
    export ANNOTAT3D_VOLUME_XTRANS=`expr -$ANNOTAT3D_VOLUME_XSIZE / 2` 
    export ANNOTAT3D_VOLUME_YTRANS=`expr -$ANNOTAT3D_VOLUME_YSIZE / 2` 
    export ANNOTAT3D_VOLUME_ZTRANS=`expr -$ANNOTAT3D_VOLUME_ZSIZE / 2` 

    export ANNOTAT3D_VOLUME_XMAX=`expr $ANNOTAT3D_VOLUME_XSIZE - 1` 
    export ANNOTAT3D_VOLUME_YMAX=`expr $ANNOTAT3D_VOLUME_YSIZE - 1` 
    export ANNOTAT3D_VOLUME_ZMAX=`expr $ANNOTAT3D_VOLUME_ZSIZE - 1` 

    if [ $VISIBLE_DEVICES != "all" ]; then
        export CUDA_VISIBLE_DEVICES=$VISIBLE_DEVICES
    else
        unset CUDA_VISIBLE_DEVICES
    fi

    echo "Environment variable setting selected for running Annotat3D Web"
    echo ""

    echo "ANNOTAT3D_PATH :" $ANNOTAT3D_PATH
    echo ""

    # echo "ANNOTAT3D_VOLUME_XSIZE:" $ANNOTAT3D_VOLUME_XSIZE
    # echo "ANNOTAT3D_VOLUME_YSIZE:" $ANNOTAT3D_VOLUME_YSIZE
    # echo "ANNOTAT3D_VOLUME_ZSIZE:" $ANNOTAT3D_VOLUME_ZSIZE
    # echo "ANNOTAT3D_VOLUME_FORMAT:" $ANNOTAT3D_VOLUME_FORMAT
    # echo ""

    # echo "ANNOTAT3D_VOLUME_XMAX:" $ANNOTAT3D_VOLUME_XMAX
    # echo "ANNOTAT3D_VOLUME_YMAX:" $ANNOTAT3D_VOLUME_YMAX
    # echo "ANNOTAT3D_VOLUME_ZMAX:" $ANNOTAT3D_VOLUME_ZMAX
    # echo ""

    # echo "ANNOTAT3D_VOLUME_XTRANS:" $ANNOTAT3D_VOLUME_XTRANS
    # echo "ANNOTAT3D_VOLUME_YTRANS:" $ANNOTAT3D_VOLUME_YTRANS
    # echo "ANNOTAT3D_VOLUME_ZTRANS:" $ANNOTAT3D_VOLUME_ZTRANS
    # echo ""
    
    echo "CUDA_VISIBLE_DEVICES:" $CUDA_VISIBLE_DEVICES
    echo ""

    echo "ANNOTAT3D_PORT:" $ANNOTAT3D_PORT
    echo "ANNOTAT3D_HTTP_PORT:" $ANNOTAT3D_HTTP_PORT
    echo "ANNOTAT3D_ADMIN_HTTP_PORT:" $ANNOTAT3D_ADMIN_HTTP_PORT
    echo "ANNOTAT3D_STREAMING_PORT:" $ANNOTAT3D_STREAMING_PORT
    echo "ANNOTAT3D_RTMP_VIDEO_STREAMING_PORT:" $ANNOTAT3D_RTMP_VIDEO_STREAMING_PORT
    echo "ANNOTAT3D_ADVANCED_STATS_PORT:" $ANNOTAT3D_ADVANCED_STATS_PORT
    echo ""

    echo "ANNOTAT3D_LNLS_EXTENSION_NOTIF_HOST:" $ANNOTAT3D_LNLS_EXTENSION_NOTIF_HOST
    echo "ANNOTAT3D_LNLS_EXTENSION_RENDERING_NOTIF_PORT:" $ANNOTAT3D_LNLS_EXTENSION_RENDERING_NOTIF_PORT
    echo "ANNOTAT3D_LNLS_EXTENSION_SHUTDOWN_NOTIF_PORT:" $ANNOTAT3D_LNLS_EXTENSION_SHUTDOWN_NOTIF_PORT
    echo ""

    echo "Running Annotat3DWeb-alpha as user: $(whoami) -- $(id -u)"
    echo "Running Annotat3DWeb-alpha from folder: $(pwd)"
    echo ""

    # # Running Gunicorn server 
    # nohup gunicorn --threads 32 --workers 1 --bind ${ANNOTAT3D_LNLS_EXTENSION_NOTIF_HOST}:${ANNOTAT3D_PORT} sscAnnotat3D.app:app 2>&1

    singularity run --nv --app Annotat3D -B /ibira,/tmp,/dev/shm /ibira/lnls/labs/tepui/apps/Annotat3DWeb-alpha.sif -b ${ANNOTAT3D_LNLS_EXTENSION_NOTIF_HOST}:${ANNOTAT3D_PORT} &

    FS_TREEVIEW_SERVER_PID=$!
    echo "FS TreeView Server PID $FS_TREEVIEW_SERVER_PID"

    wait_signal

    echo "Killing FS TreeView Server PID $FS_TREEVIEW_SERVER_PID"
    kill $FS_TREEVIEW_SERVER_PID

    # # # For now, IndeX is cleaning up its own session files, no need to clean up here since
    # # # IndeX knows the names of the files more accurately
    # # clean_session_files
}

clean_session_files()
{
    echo "Cleaning session files from folder: $ANNOTAT3D_INSTANCE_CONFIG_DIR"
    find $ANNOTAT3D_INSTANCE_CONFIG_DIR -iname "*$ANNOTAT3D_PORT*.json" -exec bash -c 'echo "-- Cleaning up session file: {}"; rm -f {}' \; 2> /dev/null
    echo "- Done cleaning up for instance"
}

usage() 
{
    params=$(printf -- "--input_file %s --input_project %s --size %d %d %d --format %s --devices %s --index_port %s/--index_port_range %d %d --notification_host %s --rendering_notification_port %d --shutdown_notification_port %d" $ANNOTAT3D_VOLUME_PATH $project_file $ANNOTAT3D_VOLUME_XSIZE $ANNOTAT3D_VOLUME_YSIZE $ANNOTAT3D_VOLUME_ZSIZE $ANNOTAT3D_VOLUME_FORMAT $VISIBLE_DEVICES $ANNOTAT3D_PORT $ANNOTAT3D_PORT_RANGE0 $ANNOTAT3D_PORT_RANGE1 $ANNOTAT3D_LNLS_EXTENSION_NOTIF_HOST $ANNOTAT3D_LNLS_EXTENSION_RENDERING_NOTIF_PORT $ANNOTAT3D_LNLS_EXTENSION_SHUTDOWN_NOTIF_PORT)

    echo "usage (with default values): $0 $params"
}

while [ "$1" != "" ]; do
    case $1 in
        --input_file)           shift
                                export ANNOTAT3D_VOLUME_PATH=$1
                                ;;
        -i | --input_project )  shift
                                project_file=$1
                                ;;
        --index_port_range )    shift
                                ANNOTAT3D_PORT_RANGE0=$(printf "%d" $1)
                                shift
                                ANNOTAT3D_PORT_RANGE1=$(printf "%d" $1)
                                export ANNOTAT3D_PORT=$(printf "%d" `$ANNOTAT3D_SCRIPTS/request_port.py --port_range $ANNOTAT3D_PORT_RANGE0 $ANNOTAT3D_PORT_RANGE1 | grep REQUESTED_PORT | sed 's/REQUESTED_PORT //g'`)
                                export ANNOTAT3D_STREAMING_PORT=`expr $ANNOTAT3D_PORT + 1`
                                export ANNOTAT3D_HTTP_PORT=`expr $ANNOTAT3D_PORT + 2`
                                export ANNOTAT3D_ADMIN_HTTP_PORT=`expr $ANNOTAT3D_PORT + 3`
                                export ANNOTAT3D_RTMP_VIDEO_STREAMING_PORT=`expr $ANNOTAT3D_PORT + 4`
                                ANNOTAT3D_ADVANCED_STATS_PORT_INT=`expr $ANNOTAT3D_PORT + 5`
                                export ANNOTAT3D_ADVANCED_STATS_PORT=$(printf "%d" $ANNOTAT3D_ADVANCED_STATS_PORT_INT)
                                #The react-fs-treeview server port MUST be equal to the IndeX server port + 10.
                                #Please set it accordingly when starting IndeX since the React app is compiled
                                #considering this value
                                export ANNOTAT3D_REACT_FS_TREEVIEW_PORT=`expr $ANNOTAT3D_PORT + 10`
                                echo "Selecting port range"
                                ;;
        -p | --index_port )     shift
                                export ANNOTAT3D_PORT=$(printf "%d" $1)
                                export ANNOTAT3D_STREAMING_PORT=`expr $ANNOTAT3D_PORT + 1`
                                export ANNOTAT3D_HTTP_PORT=`expr $ANNOTAT3D_PORT + 2`
                                export ANNOTAT3D_ADMIN_HTTP_PORT=`expr $ANNOTAT3D_PORT + 3`
                                export ANNOTAT3D_RTMP_VIDEO_STREAMING_PORT=`expr $ANNOTAT3D_PORT + 4`
                                ANNOTAT3D_ADVANCED_STATS_PORT_INT=`expr $ANNOTAT3D_PORT + 5`
                                export ANNOTAT3D_ADVANCED_STATS_PORT=$(printf "%d" $ANNOTAT3D_ADVANCED_STATS_PORT_INT)
                                #The react-fs-treeview server port MUST be equal to the IndeX server port + 10.
                                #Please set it accordingly when starting IndeX since the React app is compiled
                                #considering this value
                                export ANNOTAT3D_REACT_FS_TREEVIEW_PORT=`expr $ANNOTAT3D_PORT + 10`
                                ;;
        -d | --devices )         shift
                                VISIBLE_DEVICES=$1
                                ;;
        -s | --size )           shift
                                export ANNOTAT3D_VOLUME_XSIZE=$1
                                # Maximum x coordinate for bounding box computation
                                export ANNOTAT3D_VOLUME_XMAX=`expr $ANNOTAT3D_VOLUME_XSIZE - 1`
                                shift
                                export ANNOTAT3D_VOLUME_YSIZE=$1
                                # Maximum y coordinate for bounding box computation
                                export ANNOTAT3D_VOLUME_YMAX=`expr $ANNOTAT3D_VOLUME_YSIZE - 1`
                                shift
                                export ANNOTAT3D_VOLUME_ZSIZE=$1
                                # Maximum z coordinate for bounding box computation
                                export ANNOTAT3D_VOLUME_ZMAX=`expr $ANNOTAT3D_VOLUME_ZSIZE - 1`
                                ;;
        -f | --format )         shift
                                export ANNOTAT3D_VOLUME_FORMAT=$1
                                ;;
        --notification_host )   shift
                                export ANNOTAT3D_LNLS_EXTENSION_NOTIF_HOST=$1
                                ;;
        --rendering_notification_port )   shift
                                export ANNOTAT3D_LNLS_EXTENSION_RENDERING_NOTIF_PORT=$1
                                ;;
        --shutdown_notification_port )  shift
                                export ANNOTAT3D_LNLS_EXTENSION_SHUTDOWN_NOTIF_PORT=$1
                                ;;
        --gdb-batch )  shift
                                export GDB=--gdb-batch
                                ;;
        -h | --help )           usage
                                exit
                                ;;
        * )                     usage
                                exit 
                                ;;
    esac
    shift
done

# Calling function to run index
run_index
