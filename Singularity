Bootstrap: docker-daemon
From: gitregistry.cnpem.br/gcd/data-science/segmentation/ssc-annotat3d:cuda-11.2

%files
    ./backend/dist/*whl /opt/Annotat3D/
    ./backend/requirements.txt /opt/Annotat3D/requirements.txt
    ./backend/requirements-dev.txt /opt/Annotat3D/requirements-dev.txt

%post
    ls /opt/Annotat3D/
    mkdir -p ~/.pip
    printf "[global]\nindex-url = $GCC_PYPI_SERVER\ntrusted-host = $GCC_PYPI_HOST\nextra-index-url = https://pypi.python.org/simple" > ~/.pip/pip.conf
    cat ~/.pip/pip.conf
    python3 -m pip install -r /opt/Annotat3D/requirements.txt
    python3 -m pip install -r /opt/Annotat3D/requirements-dev.txt
    python3 -m pip install /opt/Annotat3D/sscAnnotat3D*.whl
    python3 -m pip install gunicorn

%apprun Annotat3D
    gunicorn --threads 32 --workers 1 sscAnnotat3D.app:app $@
