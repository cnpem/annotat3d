import os

# TODO: move to global __init__.py when sscAnnotat3D becomes a package
__ui_path__ = os.path.join(os.path.dirname(__file__), "..", "ui")

from .about import about_help
from .changelog import changelog_help
from .help import widget_help
from .license import license_help
