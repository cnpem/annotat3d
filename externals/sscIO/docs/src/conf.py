# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.

import os
import sys
import glob
import ast


def list_imports(filepath):
    # import pdb; pdb.set_trace()
    if not filepath.endswith(".py"):
        return set()
    with open(os.path.join(filepath), "rb") as f:
        content = f.read()
        parsed = ast.parse(content)
        top_imported = set()
        for node in ast.walk(parsed):
            if isinstance(node, ast.Import):
                for name in node.names:
                    top_imported.add(name.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.level > 0:
                    # Relative imports always refer to the current package.
                    continue
                assert node.module
                top_imported.add(node.module.split('.')[0])
        return top_imported


def list_all_imports(folder):
    imports = set()
    for file in glob.glob(f'{folder}/**/*.py', recursive=True):
        imports.update(list_imports(file))
    return imports


print(list_all_imports('../../python/sscIO/') - {'numpy'})

docs_path = 'python/sscIO'
# print(docs_path)
sys.path.insert(0, os.path.abspath('../../'))
# sys.path.insert(1, os.path.abspath('../'))

# -- Project information -----------------------------------------------------

project = 'sscIO'
copyright = '2022, GCC'
author = 'GCC'

# The full version, including alpha/beta/rc tags
release = '0.1.4.4'
version = '0.1.4.4'

# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
"""
sphinx.ext.autodoc: reads python documentation (of functions,
for example) and use them to generate the project documentation. The python
documentation needs to be in rst style.

sphinx.ext.napoleon: used together with sphinx.ext.autodoc. It makes
sphinx.ext.autodoc accept python documentation in numpy or google style.

breathe: used together with doxygen. After using doxygen for generate
documentation in xml for other languages rather than python, breathe reads
the xml files and generates the project documentation.
"""
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.mathjax',
    'sphinx_rtd_theme',
    'breathe',
    # 'exhale'
]

breathe_projects = {"proj": "../build/xml/"}
breathe_default_project = "proj"
"""
Breathe does not support cuda C++, then cuda special words used in function
declaration must be added as C++ atributes, because we'll read cuda C++ as
C++.
"""
# cpp_index_common_prefix = ['_Complex', 'cufftComplex']
# cpp_id_attributes = ['__global__', '__device__', '_Complex', 'cufftComplex', '__restrict__', 'restrict']
cpp_id_attributes = ['__global__', '__device__', '__host__']
# cpp_paren_attributes = ['restrict', '__restrict__']

# Setup the exhale extension
# exhale_args = {
#     # These arguments are required
#     "containmentFolder":     "./api",
#     "rootFileName":          "library_root.rst",
#     "rootFileTitle":         "Library API",
#     "doxygenStripFromPath":  "..",
#     # Suggested optional arguments
#     "createTreeView":        True,
#     # TIP: if using the sphinx-bootstrap-theme, you need
#     # "treeViewIsBootstrap": True,
#     "exhaleExecutesDoxygen": True,
#     "exhaleDoxygenStdin":    "INPUT = ../../inc"
# }

# # Tell sphinx what the primary language being documented is.
# primary_domain = 'cpp'

# # Tell sphinx what the pygments highlight language should be.
# highlight_language = 'cpp'

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = []

autodoc_mock_imports = list(list_all_imports('../../python/sscIO/') - {'numpy'})  #pq o sphinx eh chorao

# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
html_theme = 'sphinx_rtd_theme'
# html_theme = 'alabaster'
