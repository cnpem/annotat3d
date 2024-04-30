"""
Obs : In case that you want to change some template parameters, you have to edit the rst_template document in ./src/contentes

"""

import glob
import os
from jinja2 import Environment, FileSystemLoader


def title_from_filepath(filepath):
    return os.path.basename(filepath).replace('.py', '')


def module_name_from_filepath(filepath):
    ext_removed = os.path.splitext(filepath)[0]
    module_name = ext_removed.replace('/', '.').strip('.')
    return module_name


def list_modules(file_list):
    return [{
        'title': title_from_filepath(filepath),
        'file': module_name_from_filepath(filepath)
    } for filepath in file_list if not '__init__' in filepath and not '__version__' in filepath]


def folder_structure(basefolder):
    structure = {}
    for folder in glob.glob(f'{basefolder}/*'):
        if not os.path.isdir(folder):
            continue
        modules = list_modules(glob.glob(f"{folder}/*.py"))
        if modules:
            structure[os.path.basename(folder)] = modules

    structure['\\/'] = list_modules(glob.glob(f'{basefolder}/*.py'))
    return structure


file_loader = FileSystemLoader('src/contents')
env = Environment(loader=file_loader)

template = env.get_template('rst_template')

output = template.render(structure=folder_structure('../python/sscIO/'))

print(output)
