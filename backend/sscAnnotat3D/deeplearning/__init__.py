import os

# TODO: move to global __init__.py when sscAnnotat3D becomes a package
__ui_path__ = os.path.join(os.path.dirname(__file__), '..', 'ui')

_annotat3d_singularity_img_path = '/ibira/lnls/labs/tepui/apps/Annotat3D-dev-cuda11.sif'

_tepui_partitions = {
    '1 GPU': {
        'partition': 'annot1',
        'num_gpus': 1,
    },
    '2 GPUs': {
        'partition': 'annot2',
        'num_gpus': 2,
    },
    '4 GPUs': {
        'partition': 'annot4',
        'num_gpus': 4
    }
}

from .deeplearning_workspace_dialog import DeepLearningWorkspaceDialog
"""from .deeplearning_dataset_dialog import DeepLearningDatasetDialog
from .deeplearning_network_dialog import DeepLearningNetworkDialog
from .deeplearning_inference_dialog import DeepLearningInferenceDialog"""