import subprocess
import argparse
import time
from sscIO import io
import numpy as np

import SharedArray as sa
from sscIO import shared_memory as shm

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--filepath', '-f', type=str, required=True, default='/ibira/sirius/beamlines/mogno/apps/tvs-test/tomo_0001_20-zinger_recon_FBP_it-1200.raw', help='File saved in remote storage for visualization (RAFT/beamline data HDF5, or binary. Binary files must follow convention tomo-XSIZExYSIZExZSIZE_dtype.raw/.b, where dtype is 8bit, 16bit, float32, or complex64.')
    parser.add_argument('--scan', '-s', type=int, required=False, default=0, help='Scan, or scan range (e.g., 0 2 -> [0,2]), to be read from file')
    parser.add_argument('--timepoint', '-t', type=int, required=False, default=0, help='Timepoint, or timepoint range (e.g., 0 2 -> [0,2]), to be read from the scan')
    parser.add_argument('--channel', '-c', type=int, required=False, default=0, help='Channel to be read from the timepoint')
    parser.add_argument('--slice_range', '-r', type=int, required=False, default=(0, -1), nargs=2, help='Slice range to be read from the channel')
    parser.add_argument('--y_range', '-y', type=int, required=False, default=(0, -1), nargs=2, help='Y range to be read from the slices')
    parser.add_argument('--x_range', '-x', type=int, required=False, default=(0, -1), nargs=2, help='X range to be read from the slices')
    parser.add_argument('--shape', type=int, required=False, default=None, nargs=3, help='Input shape of raw volume file')
    parser.add_argument('--dtype', type=str, required=False, default=None, help='Input dtype of raw volume file')
    parser.add_argument('--output_type', type=str, required=False, default='ssc_volume', help='Shared memory type to be used')
    parser.add_argument('--shm_key', type=str, required=False, default=str(-1), help='Shared memory key to save the file')

    params = vars(parser.parse_args())
    
    print('Reading with MPI')
    t0 = time.time()
    try:
        ret_MPI = io.read_volume(use_MPI=True, **params)
    except Exception as e:
        print(str(e))
    else:
        print('Read Total time: {}s'.format(time.time() - t0))
        volume_MPI, imaging_type = ret_MPI   
        if params['output_type'].lower() == 'ssc_volume':
            volume_MPI = shm.read_ssc_volume_from_shared_memory(volume_MPI)

    output_file = 'restored.h5'
    t0 = time.time()
    try:
        print('Avg', volume_MPI[0].mean(), volume_MPI[-1].mean())
        if params['output_type'].lower() == 'shared_array':
            io.write_volume_HDF5(str(volume_MPI.base.name), output_file, 'pimega', use_MPI=True, compression= 'gzip', compression_opts=4, nprocs=64)
        else:
            io.write_volume_HDF5(volume_MPI, output_file, 'pimega', use_MPI=True, compression= 'gzip', compression_opts=4, nprocs=64)
    except Exception as e:
        print(str(e))
    else:
        print('Write Total time: {}s'.format(time.time() - t0))
        
        # For some reason, could not call sequential reading before MPI...
        print('Reading sequentially')
        params['filepath'] = output_file
        t0 = time.time()
        try:
            ret = io.read_volume(use_MPI=True, **params)
        except Exception as e:
            print(str(e))
        else:
            print('Read Total time: {}s'.format(time.time() - t0))
            volume, imaging_type = ret

            if params['output_type'].lower() == 'ssc_volume':
                volume = shm.read_ssc_volume_from_shared_memory(volume)

            print('Avg', volume_MPI[0].mean(), volume_MPI[-1].mean())
            print('Avg', volume[0].mean(), volume[-1].mean())

            print('Check all:', volume.shape, volume_MPI.shape, np.all(volume == volume_MPI))

        try:
            print(type(volume), volume.base, imaging_type)
        except:
            print('ssh_volume', volume, imaging_type)
        
        if params['output_type'].lower() == 'ssc_volume':
            shm.destroy_shared_volume(ret[0])
    if params['output_type'].lower() == 'ssc_volume':
        shm.destroy_shared_volume(ret_MPI[0])
    elif params['output_type'].lower() == 'shared_array':
        sa.delete(params['shm_key'])

if __name__ == '__main__':
    main()