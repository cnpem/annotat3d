from flask import Blueprint, request, jsonify
import numpy as np

from ssc_remotevis import remote_visualization as rv

from sscAnnotat3D.repository import data_repo

from flask_cors import cross_origin

middleware_host = 'index.lnls.br'
middleware_port = 31000

app = Blueprint('remotevis', __name__)

@app.route('/remotevis/visualization_server')
@cross_origin()
def visualization_server():
    info = rv.query_visualization_server(middleware_host, middleware_port)

    import pdb; pdb.set_trace()

    print(info)

    if info is None:

        shape = request.json.get('shape', [1024, 1024, 1024])
        dtype = request.json.get('dtype', 'uint16')
        beamline = request.json.get('beamline', 'vis')
        rv.initialize_visualization_server(middleware_host, middleware_port,
                                           shape=shape, dtype=dtype,
                                           wait_init=60, requested_beamline=beamline)

        print(info)

    return jsonify(info)
