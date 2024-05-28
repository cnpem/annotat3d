PYTHON = python3
YARN = yarn
HOST = $(shell hostname)
FRONTEND_PORT = 8092


build-backend:
	@echo "Build Backend"
	cd backend && ${PYTHON} setup.py bdist_wheel

build-frontend: install-frontend
	@echo "Build Frontend"
	${YARN} build

build: build-backend build-frontend
	@echo "Done."


install-backend:
	@echo "Install Backend"
	cd backend && pip install -e .

install-frontend:
	@echo "Install Frontend"
	${YARN} install

install: install-backend install-frontend
	@echo "Done."


run-backend:
	@echo "Run Backend"
	${PYTHON} backend/sscAnnotat3D/app.py

run-frontend:
	@echo "Run Frontend"
	${YARN} start

clean-backend:
	@echo "Uninstall Annotat3D"
	pip uninstall sscAnnotat3D

	@echo "Clean Backend"
	rm -rf backend/build* backend/dist* backend/*.egg-info
	find backend/sscAnnotat3D -iname *.so -exec rm {} \;
	find backend/sscAnnotat3D -iname *.c -exec rm {} \;
	find backend/sscAnnotat3D -iname *.cpp -exec rm {} \;
	@echo "Done."

clean-frontend:
	@echo "Clean Frontend"
	rm -rf build node_modules package-lock.json yarn.lock
	@echo "Done."

clean-all: clean-backend clean-frontend
