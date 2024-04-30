Install
=======

Installing sscIO
*******************

The prerequisite for installing sscResolution is indeed ``Python`` itself. ``MPI`` and ``HDF5`` are also needed for opening ``.h5`` files in parallel.

sscIO can be installed with either ``pip`` or ``git``.

PIP
***

One can install ``sscIO`` directly from our ``pip server`` by:

.. code-block:: bash

    pip config --user set global.extra-index-url http://gcc.cnpem.br:3128/simple/
    pip config --user set global.trusted-host gcc.cnpem.br

    pip install sscIO

Or manually download it from the `package <http://gcc.cnpem.br:3128/packages/>`_ list.

GIT
***

One may also clone our `gitlab <https://gitlab.cnpem.br/GCC/sscIO>`_ repository for deployment.