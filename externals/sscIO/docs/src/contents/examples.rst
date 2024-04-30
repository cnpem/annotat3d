Examples
=============



Load TIFF Image
********************

.. code-block:: python

    """ This example demonstrate how to load a TIFF file. """

    from sscIO import io

    volume, imaging_type = io.read_volume("/path/to/file/foo.tif", "numpy")

Load HDF5 Image
********************

.. code-block:: python

    """ This example demonstrate how to load a HDF5 file. """

    from sscIO import io

    # default loading
    volume, imaging_type = io.read_volume("/path/to/file/foo.h5", "numpy")

    # mpi loading
    volume, imaging_type = io.read_volume("/path/to/file/foo.h5", "numpy", use_MPI=True, nprocs=32)

    # complete loading to shared memory
    volume_shm_id, imaging_type = io.read_volume("/path/to/file/foo.h5", "ssc_volume", shm_key=-1,
                                                 use_MPI=True,
                                                 scan=scan, timepoint=timepoint, channel=channel,
                                                 slice_range=slice_range,
                                                 y_range=y_range, x_range=x_range, nprocs=nprocs)
