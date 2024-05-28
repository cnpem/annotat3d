# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.
Add reference to: [Brazilian Synchrotron Light Laboratory (LNLS)](https://lnls.cnpem.br/) and [Sirius](https://lnls.cnpem.br/sirius-en/).
#### files
It is nice to add a description of each file/directory in the root of the project (like in this README), remember to ponctuate its purpose.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

### Users
FooProject package can be directly installed from Pypi server by simply executing the following command line:
```bash
python -m pip install fooproject
```
### Developers
1. First of all, If you want to prepare a development environment, clone the repository into your local machine:
2. Secondly install FooProject by executing pip install . inside the cloned repository
```bash
python -m pip install -e .
```
3. After that install the requirements listed in the requirements-dev.txt file and install the pre-commit.
```bash
python -m pip install -r requirements-dev.txt
pre-commit install
```
## Code development standards
1. When importing anything from within a module to use internally on that module use relative paths.
2. When importing anything from a module, do not use an absolute path, instead use what is being made public by the module.
3. Classes, methods and settings that will be usable from outside the module, should be exposed on __\_\_init\_\_.py__ files
4. Private methods, files and modules should always have their name preceded by '_'.

## Deploy
1. Firstly, remember to update the version value in this README file badge, and on the pyproject.toml file.
2. Secondly, you will need to build your package:
```bash
python -m build
```
3. After that you need to send the new version to the Global PyPi version by executing the following command line. Exchange the <package_version> place holder by the current version that will be deployed:
```bash
twine upload --repository pypi dist/assonant-<package_version>* --verbose
```
**Note**: *To deploy a new version you will need a PyPi token which only the project maintainers have. That said, if you are a project maintainer and don't have access to it, ask your leader for it.*

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Acknowledgment
Show your appreciation to those who have contributed to the project.

## Mantainers
Indicate those who are responsible for this project.
-   👤 **Foo P. Person**
-   👤 **Person F. Foo**

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.

