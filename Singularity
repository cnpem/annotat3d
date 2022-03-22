Bootstrap: docker-daemon
From: gccdockers/annotat3d:cuda-11.2

%files
    ./backend/dist/*whl /opt/Annotat3D/
    ./backend/requirements.txt /opt/Annotat3D/requirements.txt
    ./build/ /opt/Annotat3D/

%post
    ls /opt/Annotat3D/
    #mkdir -p ~/.pip
    #printf "[global]\nindex-url = $GCC_PYPI_SERVER\ntrusted-host = $GCC_PYPI_HOST\nextra-index-url = https://pypi.python.org/simple" > ~/.pip/pip.conf
    cat ~/.pip/pip.conf
    python3 -m pip install -r /opt/Annotat3D/requirements.txt
    python3 -m pip install /opt/Annotat3D/sscAnnotat3D*.whl

%apprun Annotat3D
    serve -s /opt/Annotat3D/build & FLASK_APP=sscAnnotat3D.app flask run
