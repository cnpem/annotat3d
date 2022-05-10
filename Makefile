PYTHON = python3
YARN = yarn
HOST = $(shell hostname)
FRONTEND_PORT = 8092

.PHONY = cleanall

.DEFAULT_GOAL = help

build-backend:
	@echo "Building the backend application"
	cd backend && ${PYTHON} setup.py bdist_wheel

build-frontend: install-frontend
	@echo "Building the frontend application"
	${YARN} build

build: build-frontend
	@echo "Done!"

build-all: build-backend build-frontend

install-backend:
	@echo "Install the backend application"
	cd backend && ${PYTHON} setup.py install

install-frontend:
	@echo "Install the frontend application"
	${YARN} install

install: install-frontend
	@echo "Done!"

install-all: install-backend install-frontend
	@echo "Done!"

run-backend:
	@echo "Running the backend application"
	${PYTHON} backend/sscAnnotat3D/app.py

run-frontend:
	@echo "Running the frontend application"
	serve -s build --debug

run-app: install-backend run-frontend

clean-backend:
	rm -rf backend/build* backend/dist* *.egg-info

clean-frontend:
	rm -rf build node_modules

clean-all: clean-backend clean-frontend

