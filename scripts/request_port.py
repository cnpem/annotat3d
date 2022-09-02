#!/usr/bin/env python3

import socket
import argparse
import random
import time

def rv_is_port_used(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        # Trying to bind to local port in order to determine if it is used
        s.bind(('', int(port)))
        s.close()
        return False
    except:
        return True

def rv_request_port(port_range, is_port_used_internally_func=None):
    port = -1
    attempts = 0
    step_size = 20 # Making port multiple of step_size. Ports between the selected value and the next step_size may be used by IndeX
    nelems = (port_range[1] - port_range[0] + 1) // step_size
    
    random.seed(time.time())

    while port < 0 and attempts < nelems:
        port = random.randint(0, nelems) * step_size + port_range[0]
        print('Trying port:', port)
        if is_port_used_internally_func is None or is_port_used_internally_func(port):
            port = -1
            attempts += 1

    return port

def main():

    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('--port_range', '-p', type=int, nargs=2, required=True, help='Port range from which the socket port is to be selected')

    params = vars(parser.parse_args())

    port_range = params['port_range']

    port = -1

    port = rv_request_port(port_range, rv_is_port_used)
    
    print("REQUESTED_PORT {}".format(port))

    return 0

if __name__ == "__main__":
    main()