.PHONY: python

all: python

python:
	cd backend && python3 setup.py install

clean:
	rm -rf backend/build/*
