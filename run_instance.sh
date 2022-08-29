#!/bin/bash

echo "PID $!"
echo "Args: $@"

# Preventing errors when dealing with JSON and using pt_BR, since commas in floating-point
# numbers messe everything up.
export LC_ALL=en_US.UTF-8

sh run.sh



