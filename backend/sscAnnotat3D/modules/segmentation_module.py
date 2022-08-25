import abc

from abc import abstractmethod


class SegmentationModule(abc.ABC):
    _module_name = 'Generic Segmentation'

    @classmethod
    def module_name(cls):
        return cls._module_name

    @abstractmethod
    def has_preprocess(self):
        pass

    @abstractmethod
    def preprocess(self, slices=None):
        pass

    @abstractmethod
    def execute(self, annotations, force_feature_extraction=False, **kwargs):
        pass

    @abstractmethod
    def has_preview(self):
        pass

    @abstractmethod
    def preview(self, slices=[0], selected_axis=0):
        pass

    @abstractmethod
    def load_label(self, label):
        pass
