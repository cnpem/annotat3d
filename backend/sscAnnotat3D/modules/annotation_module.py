from typing import List, Tuple

import logging
import math
import os.path
import pickle
import sys
import threading
from collections import Counter
from operator import itemgetter
from time import time

import numpy as np
import scipy.ndimage.measurements
import skimage.exposure as sk_exposure
import sscPySpin.image as spin_img
import vispy
from skimage import draw, morphology, segmentation
from sklearn.preprocessing import LabelEncoder

from sscAnnotat3D import aux_functions, utils

class Label(object):
    def __init__(self, id, name=None, color=None):
        self.id = id
        self.name = self._default_name()

    def _default_name(self):
        if self.id == 0:
            name = 'Background'
        else:
            name = 'Label {}'.format(self.id)
        return name

    def color_id(self, colormap_label, offset=0):

        # The marker colormap includes a color for the background scribble
        ncolors = len(colormap_label.colors)
        color_id = ((self.id + offset) % (ncolors - 1)) + 1

        return color_id

    def __lt__(self, other):
        return self.id < other.id

    def __str__(self):
        return 'Label(name={}, id={})'.format(self.name, self.id)

    def __repr__(self):
        return str(self)

    def __eq__(self, other):
        if type(other) is type(self):
            return self.id == other.id
        else:
            return False

    def __hash__(self):
        return hash(self.id)

class AnnotationModule():
    """docstring for Annotation"""
    def __init__(self, image_shape, **kwargs):

        logging.debug('Creating Annotation_Canvas')

        self.__image_path = kwargs['path'] if 'path' in kwargs else ''
        aux_functions.log_usage(op_type='load_image',
                                image_path=self.__image_path,
                                image_shape=image_shape)
        # volume
        # self.volume_data_alt_vis = none

        self.set_current_volume_visualization('orig')

        self.zsize, self.ysize, self.xsize = image_shape

        self.label_flag = False
        self.markers_image = None

        self.xyslice = 0
        self.xzslice = 0
        self.yzslice = 0
        self.current_axis = 0  # Default axis: XY

        self.image_slice = None
        self.labels_image = None

        self.order_markers = set()
        # Markers
        self.is_drawing = False
        self.current_label = -1
        self.__default_marker_label_selection_type = 'from_user'
        self.set_marker_label_selection_type(self.__default_marker_label_selection_type)
        self.added_labels = []

        self.last_x = None
        self.last_y = None
        self.current_x = None
        self.current_y = None
        self.marker_mode = 'add'
        self.manual_marker_mode = False


        self.radius = 5

        self.highlighted_labels = set()
        self.recently_updated_labels = set()

        self.current_mk_id = 0  # Equals to the number of markers drawn on the image

        self.last_markers = []
        # Annotation result
        self.annotation = {}
        self.labels_to_remove = set()

        self.label_merging_scribbles = {}
        self.label_splitting_scribbles = {}
        self.removed_annotation = {}

        self.create_labels()
        self.create_ids()

        self.move_flag = False

        self.marker_path = {}
        self.marker_lines_path = {}
        self.update_annotation_timer = None
        self.update_annotation_next_time = None
        self.annotation_buffer = []

        self.selected_cmap = 'grays'

    @property
    def marker_mode_support(self):
        return self.classifier.marker_mode_support

    @marker_mode_support.setter
    def marker_mode_support(self, val):
        pass

    @property
    def clipping_plane_dist(self):
        return self.__clipping_plane_dist

    @clipping_plane_dist.setter
    def clipping_plane_dist(self, val):
        self.__clipping_plane_dist = val

    @property
    def annotation(self):
        return self.__annotation

    @annotation.setter
    def annotation(self, val):
        self.__annotation = val

        self.__annotation_image = (-1) * np.ones((self.zsize, self.ysize, self.xsize), dtype='int16')

        for c, v in self.__annotation.items():
            self.__annotation_image[c] = v[0] + 1

    def label_interpolator(self, volume, grid):
        # WORKAROUND: defining a generic interpolator for label-like data
        self.__label_interpolator.values = volume
        return self.__label_interpolator(grid)

    @property
    def volume_data_alt_vis(self):
        return self.__volume_data_alt_vis

    @volume_data_alt_vis.setter
    def volume_data_alt_vis(self, val):
        if val is not None:
            data = self.get_volume_grid_data(val)

            min_val = data['min_val']
            max_val = data['max_val']

            self.__volume_data_alt_vis = val
            self.__volume_data_alt_vis_min = min_val
            self.__volume_data_alt_vis_max = max_val

            # WORKAROUND: same workaround as for the regular volume
            self.__invalid_grid_factor_alt_vis = max(1, (max_val - min_val) * 0.005)
            d = max(0, min_val - self.__invalid_grid_factor_alt_vis)

        else:
            self.__volume_data_alt_vis = None
            self.alt_volume_interpolator = None

    def initialize(self):
        self.volume_data_alt_vis = None
        self.annotation = {}
        self.labels_to_remove = set()
        self.label_merging_scribbles = {}
        self.label_splitting_scribbles = {}
        self.removed_annotation = {}

        self.highlighted_labels = set()
        self.contrast = 0.0

        self.set_slice_xy(0, False)
        self.set_slice_xz(0, False)
        self.set_slice_yz(0, True)
        self.set_label(-1)

        # Clipping plane data
        self.clipping_plane_transform = None
        self.clipping_plane_normal = None
        self.clipping_plane_dist = 0.0
        self.clipping_plane_adjustment_dist = 0.0

        data = self.get_volume_grid_data()
        d0, d1, d2 = data['shape']
        diag = data['diag']

        # grid_x, grid_y = np.meshgrid(np.linspace(-scaling*diag,scaling*diag, diag), np.linspace(-scaling*diag,scaling*diag, diag), indexing='xy')

        grid_x, grid_y = np.meshgrid(np.array(range(-(diag // 2), diag - (diag // 2))),
                                     np.array(range(-(diag // 2), diag - (diag // 2))),
                                     indexing='xy')
        self.clipping_plane_grid = np.zeros((grid_x.shape[0], grid_x.shape[1], 3), dtype='float32')
        self.clipping_plane_grid[:, :, 0] = grid_x
        self.clipping_plane_grid[:, :, 1] = grid_y

    def reset_zoom(self):
        self.setup_camera()
        self.update_annotation_slice()

    def load_label(self, label):
        self.prediction = label

        new_labels = np.unique(self.prediction)
        #if we have more labels than our colormap supports, load a bigger colormap
        self.include_labels(new_labels)

        aux_functions.log_usage(op_type='load_label', label_shape=label.shape, label_dtype=str(label.dtype))

    def load_alternative_visualization_volume(self, image):
        self.volume_data_alt_vis = image

        logging.debug('Loading alternative volume')

        aux_functions.log_usage(op_type='load_alternative_visualization_volume',
                                image_shape=image.shape)

    def set_current_volume_visualization(self, vis):
        self.cur_visualization = vis

    def update_classifier_params(self, **kwargs):

        logging.debug('Update classifier params: {}'.format(kwargs))

        cur_module = self.module_from_args(**kwargs)

        logging.debug('Segmentation Module selected: {}'.format(cur_module))

        self.force_feature_extraction_flag = True


    def get_preview_data(self, selected_axis=None):

        if selected_axis is None:
            selected_axis = self.current_axis

        if selected_axis < 0:
            raise Exception(
                'Preview mode unsupported for clipping plane view. Please choose an orthogonal axis instead')

        if selected_axis == 0:
            curr_slice = self.xyslice
            axis_size = self.zsize
        elif selected_axis == 1:
            curr_slice = self.xzslice
            axis_size = self.ysize
        else:
            curr_slice = self.yzslice
            axis_size = self.xsize

        if self.classifier.preview_slice_range > 0:
            selected_slices = set(
                range(max(0, curr_slice - self.classifier.preview_slice_range),
                      min(axis_size, curr_slice + self.classifier.preview_slice_range)))
        else:
            selected_slices = set((curr_slice, ))

        return selected_slices, selected_axis

    def execute(self, preview, **kwargs):
        labels_to_merge = {}
        labels_to_split = set()

        prev_label = self.prediction

        try:
            checkpoint = self.classifier.checkpoint
        except:
            pass
        else:
            logging.debug('label merging scribbles ... {}'.format(self.label_merging_scribbles))
            if prev_label is not None:
                for coord, value in self.label_merging_scribbles.items():
                    # Ensuring that the old label stored by the Segmentation Module be considered for label merging
                    lb = prev_label[coord]
                    marker_lb, marker_id = value

                    if marker_id > checkpoint:

                        #Disregarding background label for merging
                        if lb > 0:
                            labels_to_merge[lb] = marker_lb

                            # Updating marker labels selected for merging
                            for k in self.annotation:
                                old_lb, mk_id = self.annotation[k]
                                if old_lb == lb:
                                    self.annotation[k] = (marker_lb, mk_id)

                            # Converting label splitting scribbles to merging label as well, just to be safe, although in practice
                            # those scribbles are already inside self.annotation and therefore this code should not be used.
                            for k in self.label_splitting_scribbles:
                                old_lb, mk_id = self.label_splitting_scribbles[k]

                                if old_lb == lb:
                                    self.label_splitting_scribbles[k] = (marker_lb, mk_id)

                            self.__update_annotation_image(self.annotation)

                        else:
                            removed_annotation = {}
                            # Removing label merging scribbles selected on the background to prevent leakages to undesired areas
                            if coord in self.annotation:
                                removed_annotation[coord] = (0, -1)
                                del self.annotation[coord]

                            self.__update_annotation_image(removed_annotation, 0)

                for coord, value in self.label_splitting_scribbles.items():
                    marker_lb, marker_id = value
                    # Ensuring that the old label stored by the Segmentation Module be considered for label merging
                    lb = prev_label[coord]

                    if marker_id > 0:
                        #Disregarding background label for merging
                        if lb > 0:
                            labels_to_split.add(lb)
                        else:
                            removed_annotation = {}
                            # Removing label merging scribbles selected on the background to prevent leakages to undesired areas
                            if coord in self.annotation:
                                removed_annotation[coord] = (0, -1)
                                del self.annotation[coord]

                            self.__update_annotation_image(removed_annotation, 0)

        self.recently_updated_labels = set()

        logging.debug('Labels to merge before all: {}'.format(labels_to_merge))

        if preview:
            if self.classifier.has_preprocess():
                if self.classifier.get_superpixel() is None:
                    self.execute_preprocess(True)

            selected_slices, selected_axis = self.get_preview_data()
            prediction = self.classifier.preview(
                self.annotation,
                selected_slices=selected_slices,
                selected_axis=selected_axis,
                labels_to_remove=self.labels_to_remove,
                # labels_to_merge=labels_to_merge,
                label_merging_scribbles=self.label_merging_scribbles,
                labels_to_split=labels_to_split,
                removed_annotations=self.removed_annotation,
                **kwargs)
        else:
            prediction = self.classifier.execute(
                self.annotation,
                force_feature_extraction=self.force_feature_extraction_flag,
                labels_to_remove=self.labels_to_remove,
                # labels_to_merge=labels_to_merge,
                label_merging_scribbles=self.label_merging_scribbles,
                labels_to_split=labels_to_split,
                removed_annotations=self.removed_annotation,
                manual_annotation=self.manual_marker_mode,
                **kwargs)

        self.label_splitting_scribbles = {}
        self.label_merging_scribbles = {}

        st = time()

        # Since the annotated pixels that were removed by the user have already been processed by the segmentation module,
        # we are able to remove them here
        self.clear_removed_data()

        if prediction is not None:
            if type(prediction) == tuple:
                highlighted_labels = prediction[1]
                prediction = prediction[0]

                self.set_highlighted_labels(highlighted_labels)

            if self.prediction is not None and self.highlighted_labels:
                self.recently_updated_labels = set(np.setxor1d(prediction, self.prediction))

            self.force_feature_extraction_flag = False

            if self.prediction is not None:
                self.prediction[...] = prediction
            else:
                self.prediction = prediction

            end = time()

            logging.debug('Copying label time: {}'.format(end - st))

            logging.debug('Done!')
 
    def reload(self, image, **kwargs):
        logging.info('Reloading annotation class')

        self.__image_path = kwargs['path'] if 'path' in kwargs else ''
        aux_functions.log_usage(op_type='load_image',
                                image_path=self.__image_path,
                                image_shape=image.shape)

        self.unfreeze()
        self.set_volume(image)
        self.initialize()

        self.create_labels()
        self.create_ids()
        self.view.camera.reset()
        self.setup_camera()

        self.classifier = None
        self.update_classifier_params(force_load=True)

        self.__default_marker_label_selection_type = 'from_user'
        self.set_marker_label_selection_type(self.__default_marker_label_selection_type)

        self.label_flag = False
        self.show_markers = True
        self.label_boundaries = False
        self.update_annotation_slice()
        self.prediction = None
        self.move_flag = False

        logging.debug('Reloading complete for annotation class')

    def get_contrast_min(self):
        return self.contrast_min

    def get_contrast_max(self):
        return self.contrast_max
 
    def get_volume_grid_data(self, volume_data=None):
        d0, d1, d2 = self.zsize, self.ysize, self.xsize
        diag = int(math.sqrt(d0 * d0 + d1 * d1 + d2 * d2))

        return {'shape': (d0, d1, d2), 'diag': diag}

    def get_clipping_plane_data(self):
        data = self.get_volume_grid_data()

        diag = data['diag']

        return {'shape': (diag, diag)}

    def transform_clipping_plane(self, transform):
        clipping_plane_grid = self.clipping_plane_grid.copy()
        # Setting depth to clipping plane grid (and considering the adjustment distance, in case the rotation center does not correspond to the image's center)
        clipping_plane_grid[..., 2] = self.clipping_plane_dist - self.clipping_plane_adjustment_dist

        # Transforming clipping plane grid according to matrix
        clipping_plane_grid = transform.imap(clipping_plane_grid)[..., :3]

        # Converting cartesian coordinates to image coordinates
        tmp = clipping_plane_grid[..., 2].copy()
        clipping_plane_grid[..., 2] = clipping_plane_grid[..., 0].copy()
        clipping_plane_grid[..., 0] = tmp

        return clipping_plane_grid

    def transform_clipping_plane_coords_to_3d(self, transform, coords):
        data = self.get_volume_grid_data()
        d0, d1, d2 = data['shape']
        diag = data['diag']

        coords3d = np.zeros(3, dtype='float32')

        if len(coords) == 2:
            coords3d[0] = coords[1] - diag // 2
            coords3d[1] = coords[0] - diag // 2
            coords3d[2] = self.clipping_plane_dist - self.clipping_plane_adjustment_dist
        else:
            coords3d[0] = coords[2] - diag // 2
            coords3d[1] = coords[1] - diag // 2
            ## IMPORTANT: expecting z coord to be relative instead of absolute
            coords3d[2] = self.clipping_plane_dist - self.clipping_plane_adjustment_dist + coords[0]

        coords3d = transform.imap(coords3d)[..., :3]

        tmp = coords3d[2]
        coords3d[2] = coords3d[0]
        coords3d[0] = tmp

        coords3d = coords3d + np.array((d0 // 2, d1 // 2, d2 // 2), dtype='float32')
        coords3d = tuple(coords3d.astype('int32'))

        return coords3d

    def transform_3d_coords_to_2d_clipping_plane_coords(self, transform, coords3d, proximity_threshold=0.6):
        data = self.get_volume_grid_data()
        d0, d1, d2 = data['shape']
        diag = data['diag']

        center = np.array((d2 // 2, d1 // 2, d0 // 2), dtype='float32')
        coords3d = np.array((coords3d[2], coords3d[1], coords3d[0]), dtype='float32') - center

        dist = (self.clipping_plane_normal.dot(coords3d) + self.clipping_plane_dist -
                self.clipping_plane_adjustment_dist) / np.linalg.norm(self.clipping_plane_normal)

        # verifying if coordinate is on plane. If it isn't, then we return None
        is_on_plane = abs(dist) <= proximity_threshold

        coords3d = transform.map(coords3d)[..., :3]

        if is_on_plane:
            tmp = coords3d[1] + diag // 2
            coords3d[1] = coords3d[0] + diag // 2
            coords3d[0] = tmp
            coords2d = tuple(coords3d.astype('int32'))[:2]

            return coords2d
        else:
            return None

    def create_labels(self):
        self.added_labels = []

    def create_ids(self):
        pass

    def get_colormap(self):
        return self.colormap_label

    def get_marker_colormap(self):
        return self.colormap_markers

    def valid_coords(self, coords):
        if len(coords) == 2 and self.current_axis >= 0:
            if self.current_axis == 0:
                return self.xsize > coords[1] >= 0 <= coords[0] < self.ysize
            elif self.current_axis == 1:
                return 0 <= coords[1] < self.xsize and 0 <= coords[0] < self.zsize
            else:
                return 0 <= coords[1] < self.ysize and 0 <= coords[0] < self.zsize
        else:
            if len(coords) == 2:
                coords = self.get_current_clipping_plane_3d_coord(coords)

            return 0 <= coords[2] < self.xsize and 0 <= coords[1] < self.ysize and 0 <= coords[0] < self.zsize

    def set_current_axis(self, current_axis):
        self.current_axis = current_axis

    def set_current_slice(self, current_slice):
        if self.current_axis == 0:
            self.xyslice = current_slice
        elif self.current_axis == 1:
            self.xzslice = current_slice
        elif self.current_axis == 2:
            self.yzslice = current_slice

    def get_current_axis(self):
        return self.current_axis

    def get_current_slice_2d_coord(self, coord_3d, axis, proximity_threshold=0.6):
        coord = None
        if axis < 0:
            coord = self.get_current_clipping_plane_2d_coord(coord_3d, proximity_threshold)
        elif axis == 0 and coord_3d[0] == self.xyslice:
            coord = coord_3d[1:]
        elif axis == 1 and coord_3d[1] == self.xzslice:
            coord = (coord_3d[0], coord_3d[2])
        elif axis == 2 and coord_3d[2] == self.yzslice:
            coord = coord_3d[:2]

        return coord

    def get_current_clipping_plane_3d_coord(self, coords):
        if self.clipping_plane_transform is None:
            raise Exception('Please select a clipping plane first')
        return self.transform_clipping_plane_coords_to_3d(self.clipping_plane_transform, coords)

    def get_current_clipping_plane_2d_coord(self, coord_3d, proximity_threshold=0.6):
        if self.clipping_plane_transform is None:
            raise Exception('Please select a clipping plane first')
        return self.transform_3d_coords_to_2d_clipping_plane_coords(self.clipping_plane_transform, coord_3d,
                                                                    proximity_threshold)

    def get_current_slice_3d_coord(self, coord_2d):
        if self.current_axis < 0:
            return self.get_current_clipping_plane_3d_coord(coord_2d)
        elif self.current_axis == 0:
            return self.xyslice, coord_2d[0], coord_2d[1]
        elif self.current_axis == 1:
            return coord_2d[0], self.xzslice, coord_2d[1]
        else:
            return coord_2d[0], coord_2d[1], self.yzslice

    def get_current_slice_shape(self):
        if self.current_axis < 0:
            if self.clipping_plane_transform is None:
                raise Exception('Please select a clipping plane first')
            return self.get_clipping_plane_data()['shape']
        elif self.current_axis == 0:
            return (self.ysize, self.xsize)
        elif self.current_axis == 1:
            return (self.zsize, self.xsize)
        else:
            return (self.zsize, self.ysize)

    def get_current_slice(self, vol):
        return self.get_slice(vol, self.current_axis)

    def get_slice(self, vol, axis):
        if axis == 0:
            try:
                return np.take(vol, self.xyslice, axis=axis)
            except:
                return None
        elif axis == 1:
            try:
                return np.take(vol, self.xzslice, axis=axis)
            except:
                return None
        else:
            try:
                return np.take(vol, self.yzslice, axis=axis)
            except:
                return None

    def get_slice_xy(self):
        return self.xyslice

    def get_slice_xz(self):
        return self.xzslice

    def get_slice_yz(self):
        return self.yzslice

    def set_slice_xy(self, xyslice, update=True):
        if xyslice < 0 or xyslice >= self.zsize:
            return
        self.xyslice = xyslice
        if update:
            self.update_annotation_slice()

    def set_slice_xz(self, xzslice, update=True):
        if xzslice < 0 or xzslice >= self.ysize:
            return
        self.xzslice = xzslice
        if update:
            self.update_annotation_slice()

    def set_slice_yz(self, yzslice, update=True):
        if yzslice < 0 or yzslice >= self.xsize:
            return
        self.yzslice = yzslice
        if update:
            self.update_annotation_slice()

    def set_contrast(self, c, image_min, image_max):
        self.contrast = c
        self.contrast_min = image_min
        self.contrast_max = image_max

    @property
    def annotation_image(self):
        return self.__annotation_image

    def draw_data_on_clipping_plane(self):
        if self.clipping_plane_transform is not None:
            # Projecting clipping plane grid according to transform into the coordinate system of the scene
            clipping_plane_grid = self.transform_clipping_plane(self.clipping_plane_transform)

            # Interpolating transformed clipping plane from volume data (image and labels)
            return self.draw_data_on_clipping_plane_aux(clipping_plane_grid)
        else:
            return None, None, None

    def draw_data_on_clipping_plane_aux(self, clipping_plane_grid):
        current_slice = None
        #if not markers_only:
        #update what will be shown on canvas
        if self.volume_data_alt_vis is None or self.cur_visualization == 'orig':
            current_slice = self.volume_interpolator(clipping_plane_grid)
        else:
            current_slice = self.alt_volume_interpolator(clipping_plane_grid)

        labels_slice = None

        #if not markers_only:
        #logging.debug('Drawing on axis', axis, 'xy', self.xyslice, 'xz', self.xzslice, 'yz', self.yzslice)
        #logging.debug('highlighted_labels', self.highlighted_labels)
        if self.label_flag is True:
            if self.prediction is not None:
                labels_slice = self.prediction_interpolator(clipping_plane_grid)

                if labels_slice is not None:
                    label_slice_tmp = labels_slice

                    if len(self.highlighted_labels) > 0:
                        tmp = np.zeros(labels_slice.shape, dtype='uint16')
                        for lb in self.highlighted_labels:
                            tmp[labels_slice == lb] = lb

                        labels_slice = tmp
                    else:
                        labels_slice = label_slice_tmp.astype('uint16')
            else:
                labels_slice = None
        elif self.label_boundaries is True:
            pass
            #TODO: Allow the display of superpixel boundaries on clipping plane
            superpixels_vol = self.classifier.get_superpixel()
            if superpixels_vol is not None:
                superpixel = self.label_interpolator(superpixels_vol, clipping_plane_grid)

                if superpixel is not None:
                    #labels_slice = spin_img.spin_find_boundaries(superpixel).astype('uint16')
                    labels_slice = spin_img.spin_find_boundaries_subpixel(superpixel, dtype='uint8')
                    logging.debug('labels_slice: {} {}'.format(labels_slice.min(), labels_slice.max()))
        else:
            labels_slice = None
            self.window.check_superpixel.setChecked(False)
            self.window.label_visualization.setChecked(False)

        markers_slice = None

        if self.show_markers is True:  # Pointing the marker's slice to the appropriate position, if self.show_markers is True
            #markers_slice = np.zeros(current_slice.shape, dtype='uint16')
            markers_slice = self.__annotation_interpolator(clipping_plane_grid).astype('uint16')
            #self.draw_annotation_on_image(markers_slice, -1)

        return current_slice, labels_slice, markers_slice


    def update_annotation_slice(self):
        pass
        # if self.current_axis >= 0:
            # current_slice, labels_slice, markers_slice = self.draw_data_on_slice(self.current_axis)
        # else:
            # current_slice, labels_slice, markers_slice = self.draw_data_on_clipping_plane()

        # self.update_visuals(current_slice, labels_slice, markers_slice)

    def set_marker_label_selection_type(self, type):
        self.marker_label_selection_type = type

    def set_label(self, label):
        self.current_label = int(label)

    def get_labels_object(self):
        return self.added_labels

    def get_label_object(self, label):
        labels = [l for l in self.added_labels if l.id == label]
        return labels[0]

    def get_labels(self):
        return [l.id for l in self.added_labels]

    def include_labels(self, labels):
        new_labels = set(labels).union(set([l.id for l in self.added_labels]))
        self.added_labels = [Label(l) for l in sorted(new_labels)]

    def add_label(self, name=None, new_base_label=0):
        #Increasing the maximum available label id by 1
        added_labels = [l.id for l in self.added_labels]
        new_label = new_base_label + (np.max(added_labels) if len(self.added_labels) > 0 else 0) + 1

        self.added_labels.append(Label(new_label, name))
        #self.label_name.append(name if name is not None else 'Label ' + str(new_label))

    def remove_label(self, label):
        label = int(label)

        if self.prediction is not None:
            np.place(self.prediction, self.prediction == label, 0)

        self.classifier.load_label(self.prediction)

        self.remove_annotation(labels=(label, ))

        #update the label list
        added_labels = [l for l in self.added_labels if l.id != label]
        removed = added_labels != self.added_labels

        self.added_labels = added_labels
        self.window.update_views()

        return removed

    def erase_all_markers(self):
        # Copying all removed annotation
        self.removed_annotation = dict(self.annotation)

        self.annotation = {}
        self.labels_to_remove = set()
        self.label_merging_scribbles = {}
        self.label_splitting_scribbles = {}

    def clear_removed_data(self):
        self.removed_annotation = {}
        self.labels_to_remove = set()

    def get_radius(self):
        return self.radius

    def set_radius(self, radius):
        if int(radius) == self.radius:
            return
        self.radius = int(radius)


    def __select_label_under_click(self, event):
        if event.button == 1:
            tr = self.scene.node_transform(self.image_slice)
            img_coord = tr.map(event.pos)[:2]
            y = int(img_coord[1])
            x = int(img_coord[0])

            if self.prediction is not None:
                lb = self.prediction[self.get_current_slice_3d_coord((y, x))]
                self.window.set_current_label_selection(lb, programmatic_selection=True)

    def add_new_marker(self, event):
        if event.button == 1:
            try:
                tr = self.scene.node_transform(self.image_slice)
                img_coord = tr.map(event.pos)[:2]
                x = int(img_coord[1])
                y = int(img_coord[0])

                if not self.valid_coords((x, y)):
                    return

                logging.debug('marker selection {}'.format(self.marker_label_selection_type))

                if self.marker_label_selection_type == 'from_previous_label':
                    self.__select_label_under_click(event)
                elif self.marker_label_selection_type == 'sequential_labeling':
                    self.window.add_label()
                    #self.window.set_current_label_selection(self.added_labels[-1])

                if self.current_label < 0 and self.marker_mode in ['add', 'extend', 'merge']:
                    return

                logging.debug('Adding new marker with current label {}'.format(self.current_label))

                # Set marker coordinates
                self.current_x = x
                self.current_y = y
                self.last_x = x
                self.last_y = y
                # Start drawing marker
                self.is_drawing = True
                self.last_markers = []

                marker_ids = aux_functions.get_marker_ids(self.annotation)
                self.current_mk_id = max(self.current_mk_id, max(marker_ids) if len(marker_ids) > 0 else 0) + 1

                self.update_annotation_next_time = -1

                logging.debug('New marker id: {}'.format(self.current_mk_id))

                self.marker_path[self.current_mk_id] = [(x, y)]
                self.marker_lines_path[self.current_mk_id] = [(event.pos[0], event.pos[1])]

                #self.draw_marker()
                #self.update_annotation_slice()
            except Exception as e:
                aux_functions.log_error(e)
                # QMessageBox.critical(self.window, 'Error', str(e))

    def on_mouse_move(self, event):
        try:
            tr = self.scene.node_transform(self.image_slice)
            scene_to_screen_radius = tr.imap((self.radius, self.radius, 0, 1)) - tr.imap((0, 0, 0, 1))
            img_coord = tr.map(event.pos)[:2]
            x = int(img_coord[1])
            y = int(img_coord[0])

            self.mouse_cursor.center = (event.pos[0], event.pos[1])
            self.mouse_cursor.radius = (scene_to_screen_radius[0], scene_to_screen_radius[1])
            _, color_id = self.get_label_name_and_color_id(self.current_label)
            color = self.get_marker_colormap().colors[color_id]

            c = color.rgba[0]
            c[3] = 0.6

            self.mouse_cursor.color = c

            coord3d = self.get_current_slice_3d_coord((x, y))
            coord2d = self.get_current_slice_2d_coord(coord3d, self.current_axis)

            self.info_text_visuals.text = ('%d %d %d' % (coord3d[2], coord3d[1], coord3d[0]))
            if self.current_axis >= 0 and self.valid_coords(coord2d):
                val_orig = -1
                val_label = -1
                val_superpixel = -1
                # superpixel_vol = self.classifier.get_superpixel()

                # val_orig = self.get_slice(self.volume_data, self.current_axis)[coord2d]

                # if self.prediction is not None:
                    # val_label = self.get_slice(self.prediction, self.current_axis)[coord2d]

                # if superpixel_vol is not None:
                    # val_superpixel = self.get_slice(self.classifier.get_superpixel(), self.current_axis)[coord2d]

                # self.info_text_visuals.text = (
                    # '%d %d %d [%d, %d, %d]' % (coord3d[2], coord3d[1], coord3d[0], val_orig, val_label, val_superpixel))

            if event.button == 1:

                if self.label_boundaries is True and self.is_drawing is True:
                    self.update_annotation_slice()
                if self.current_label < 0 and self.marker_mode in ['add', 'extend', 'merge']:
                    return
                #tr = self.scene.node_transform(self.image_slice)
                #img_coord = tr.map(event.pos)[:2]
                #x = int(img_coord[1])
                #y = int(img_coord[0])
                if not self.valid_coords((x, y)):
                    return
                if not self.is_drawing:
                    return

                #Getting new center of zoom
                #verify if diference between the last position and
                #new position is bigger than the radius
                aux_x = self.last_x - x
                if aux_x < 0:
                    aux_x = -aux_x
                aux_y = self.last_y - y
                if aux_y < 0:
                    aux_y = -aux_y
                #if len(self.last_markers)<1 or (aux_x)>=(self.radius) or (aux_y)>=(self.radius):
                if aux_x >= (self.radius / 2) + 1 or aux_y >= (self.radius / 2) + 1:
                    self.last_x = self.current_x
                    self.last_y = self.current_y

                    self.current_x = x
                    self.current_y = y

                    self.marker_path[self.current_mk_id].append((x, y))
                    self.marker_lines_path[self.current_mk_id].append((event.pos[0], event.pos[1]))

                    self.drawing_line.set_data(pos=np.array(self.marker_lines_path[self.current_mk_id]),
                                               width=scene_to_screen_radius[0] * 2,
                                               color=c)

                    self.update_annotation_next_time = -1

        except Exception as e:
            aux_functions.log_error(e)
            import sys
            # QMessageBox.critical(self.window, 'Error', str(e))

    def draw_points(self, points: List[Tuple[int, int, int]], mk_id: int):
        self.current_mk_id = mk_id

        self.marker_path[self.current_mk_id] = [*(self.marker_path[self.current_mk_id]), *points]

    def get_coords_surrounding_point(self, y, x, coords3d=True, tolerance=2):
        if self.current_axis < 0:
            #rr, cc = draw.circle(y, x, radius = tolerance, shape = self.get_current_slice_shape())
            #coords = list(map(lambda coord: self.get_current_slice_3d_coord(coord), zip(rr, cc)))

            rr, cc = draw.circle(y, x, radius=tolerance, shape=self.get_current_slice_shape())

            coords = list(
                map(lambda coord: coord if not coords3d else self.get_current_slice_3d_coord(coord), zip(rr, cc)))
        else:
            coords = [(y, x) if not coords3d else self.get_current_slice_3d_coord((y, x))]

        valid_coords = list(filter(lambda c: self.valid_coords(c), coords))

        return valid_coords

    def right_click(self, event):
        tr = self.scene.node_transform(self.image_slice)
        img_coord = tr.map(event.pos)[:2]
        y = int(img_coord[1])
        x = int(img_coord[0])

        coords = self.get_coords_surrounding_point(y, x, coords3d=True, tolerance=2)

        for c in coords:
            if c in self.annotation:
                i = self.annotation[c][1]
                self.remove_annotation(ids=(i, ))

                self.update_annotation_slice()

    def on_mouse_release(self, event):
        if self.is_drawing:
            tr = self.scene.node_transform(self.image_slice)
            img_coord = tr.map(event.pos)[:2]
            x = int(img_coord[1])
            y = int(img_coord[0])

            if self.valid_coords((x, y)):
                self.marker_path[self.current_mk_id].append((x, y))
                self.marker_lines_path[self.current_mk_id].append((event.pos[0], event.pos[1]))

        if len(self.marker_path) > 0:
            self.update_annotation_next_time = time() + 1.0
            for k, p in self.marker_path.items():
                self.annotation_buffer.append((
                    self.current_label,
                    self.current_mk_id,
                    self.marker_mode,
                    p,
                ))

            if self.update_annotation_timer is None:
                self.update_annotation_timer = vispy.app.Timer(0.15, self.update_annotation_tick, start=False)
                self.update_annotation_timer.start()

            self.drawing_line.set_data(pos=None, color=(0, 0, 0, 0))

            self.marker_lines_path.clear()
            self.marker_path.clear()

        try:
            # Stop drawing marker
            self.is_drawing = False
            self.last_x = None
            self.last_y = None
            self.current_x = None
            self.current_y = None
            self.move_count = 0

            logging.debug('++++++++= marker_mode: {}'.format(self.marker_mode))
            logging.debug('current_mk_id: {}'.format(self.current_mk_id))
            logging.debug('annotation: {}'.format(self.annotation_buffer))

            if self.marker_mode == 'merge':
                # Selecting all labels under the currently selected scribble for merging with the label of the marker

                current_scribble = []
                for lb, mk_id, mode, slice_annots in self.annotation_buffer:
                    current_scribble.extend(
                        (self.get_current_slice_3d_coord(annot), (lb, mk_id)) for annot in slice_annots)
                # current_scribble = [(k, v)
                # for k, v in self.annotation.items()
                # if v[1] == self.current_mk_id]
                self.label_merging_scribbles.update(current_scribble)
            elif self.marker_mode == 'split':
                # Selecting all labels under the currently selected scribble for merging with the label of the marker
                current_scribble = [(k, v) for k, v in self.annotation.items() if v[1] == self.current_mk_id]
                self.label_splitting_scribbles.update(current_scribble)
            elif self.marker_mode == 'erase':
                # if QMessageBox.question(self.window,
                                        # 'Label removal',
                                        # 'Removing marker.\nWould you also like to remove the entire label?',
                                        # defaultButton=QMessageBox.No) == QMessageBox.Yes:
                self.mark_label_for_removal(event)

            self.order_markers.add(self.current_mk_id)

        except Exception as e:
            aux_functions.log_error(e)
            # QMessageBox.critical(self.window, 'Error', f'Exception {e} on line {sys.exc_info()[-1].tb_lineno}')

    def update_annotation_tick(self, event):
        if 0 < self.update_annotation_next_time <= time():
            self.update_annotation_next_time = -1

            for current_label, current_mk_id, marker_mode, p, in self.annotation_buffer:
                self.draw_marker_path(current_label, current_mk_id, marker_mode, p)
            self.annotation_buffer.clear()

            self.update_annotation_slice()
            self.view.camera.view_changed()

    def draw_marker_path(self, current_label, current_mk_id, marker_mode, marker_path):
        last_time = time()

        if len(marker_path) > 0:
            last_x, last_y = marker_path[0]
            for current_x, current_y in marker_path[1:]:
                self.draw_marker(last_x, last_y, current_x, current_y, current_label, current_mk_id, marker_mode)
                last_x, last_y = current_x, current_y

        logging.debug('draw_marker_path took {}s'.format(time() - last_time))

    def mark_label_for_removal(self, event):
        tr = self.scene.node_transform(self.image_slice)
        img_coord = tr.map(event.pos)[:2]
        x = int(img_coord[1])
        y = int(img_coord[0])

        if not self.valid_coords((x, y)):
            return

        if self.prediction is None:
            return

        lb = self.prediction[self.get_current_slice_3d_coord((x, y))]

        if lb > 0:
            logging.debug('Erasing label: {}'.format(lb))
            self.remove_label(lb)
            self.labels_to_remove.add(lb)

            self.window.update_label_list()
            self.window.update_views()

    def set_highlighted_labels(self, labels):
        self.highlighted_labels = labels

    def set_visualization_slices(self, event):
        tr = self.scene.node_transform(self.image_slice)
        img_coord = tr.map(event.pos)[:2]
        x = int(img_coord[0])
        y = int(img_coord[1])

        if not self.valid_coords((y, x)):
            return

        coord = self.get_current_slice_3d_coord((y, x))

        self.__set_visualization_slices(coord)

    def __set_visualization_slices(self, coord):

        self.window.set_spin_slice_xy(coord[0])
        self.window.set_spin_slice_xz(coord[1])
        self.window.set_spin_slice_yz(coord[2])

        self.window.set_center(coord)
        self.window.update_views()

    def draw_marker(self,
                    last_x=None,
                    last_y=None,
                    current_x=None,
                    current_y=None,
                    current_label=None,
                    current_mk_id=None,
                    marker_mode=None):

        last_x = last_x if last_x is not None else self.last_x
        last_y = last_y if last_y is not None else self.last_y

        current_x = current_x if current_x is not None else self.current_x
        current_y = current_y if current_y is not None else self.current_y

        current_label = current_label if current_label is not None else self.current_label
        current_mk_id = current_mk_id if current_mk_id is not None else self.current_mk_id

        marker_mode = marker_mode if marker_mode is not None else self.marker_mode

        #last_time = time()
        xi = last_x
        yi = last_y
        xf = current_x
        yf = current_y

        rr, cc = draw.line(xi, yi, xf, yf)  # Rows and cols
        for y, x in zip(rr, cc):
            self.draw_marker_dot(y, x, current_label, current_mk_id, erase=marker_mode == 'erase')

    def undo(self):
        if self.current_mk_id > 0:
            if len(self.order_markers) > 0:
                marker_to_remove = max(self.order_markers)

                self.order_markers.remove(marker_to_remove)

                last_remaining_marker = max(self.order_markers) if len(self.order_markers) > 0 else 0

                if not self.classifier.undo(last_remaining_marker):
                    self.order_markers.add(marker_to_remove)

                    # QMessageBox.warning(self.window, 'Undo', 'Maximum undo limit reached. Can not undo further')
                else:
                    self.remove_annotation(ids=(marker_to_remove, ))

                self.window.update_views()

    def draw_marker_dot(self, y, x, marker_lb, marker_id, erase=False):
        print('draw marker dot')
        self.last_markers.append(marker_id)
        if self.radius == 0:
            if not erase:
                # Draw point using current label
                c = self.get_current_slice_3d_coord((y, x))
                if self.valid_coords(c):
                    self.annotation[c] = (marker_lb, marker_id)
                    self.__annotation_image[c] = marker_lb
            else:
                coord3d = self.get_current_slice_3d_coord((y, x))

                if coord3d in self.annotation:
                    self.removed_annotation[coord3d] = self.annotation[coord3d]
                    del self.annotation[coord3d]
                    self.__annotation_image[coord3d] = -1

                try:
                    del self.label_merging_scribbles[coord3d]
                except:
                    pass
                try:
                    del self.label_splitting_scribbles[coord3d]
                except:
                    pass
        else:

            if self.current_axis < 0:
                sphere = draw.ellipsoid(self.radius, self.radius, self.radius)
                dd, rr, cc = np.nonzero(sphere)
                center = np.array(sphere.shape) // 2

                #coords = map(lambda coord: (self.get_current_slice_3d_coord(coord), (marker_lb, marker_id)), zip(dd - center[0], rr - center[1] + y, cc - center[2] + x))
                coord = self.get_current_slice_3d_coord((y, x))
                coords = map(lambda co: (tuple((np.array(co)).astype('int32')), (marker_lb, marker_id)),
                             zip(dd - center[0] + coord[0], rr - center[1] + coord[1], cc - center[2] + coord[2]))
            else:
                rr, cc = draw.circle(y, x, radius=self.radius, shape=self.get_current_slice_shape())
                coords = map(lambda co: (self.get_current_slice_3d_coord(co), (marker_lb, marker_id)), zip(rr, cc))

            valid_coords = {c: v for c, v in coords if self.valid_coords(c)}

            if erase:
                for coords in valid_coords:
                    if coords in self.annotation:
                        self.removed_annotation[coords] = self.annotation[coords]

                        del self.annotation[coords]
                        self.__annotation_image[coords] = -1

                    if coords in self.label_merging_scribbles:
                        del self.label_merging_scribbles[coords]
                    if coords in self.label_splitting_scribbles:
                        del self.label_splitting_scribbles[coords]
            else:
                self.annotation.update(valid_coords)

                self.__update_annotation_image(valid_coords)

    def __update_annotation_image(self, annotation, label=None):
        if label is not None:
            for c in annotation:
                self.__annotation_image[c] = label
        else:
            for c, v in annotation.items():
                self.__annotation_image[c] = v[0]

    def remove_annotation(self, labels=None, ids=None):
        if (labels is None and ids is None) or (labels is not None and ids is not None):
            raise Exception('Please select one type of marker removal: label or id based. (Labels %s, Ids %s)',
                            str(labels), str(ids))

        self.__update_annotation_image(self.annotation, 0)

        if labels is not None:
            remaining_annotation = {key: value for key, value in self.annotation.items() if value[0] not in labels}
            self.label_merging_scribbles = {
                key: value
                for key, value in self.label_merging_scribbles.items() if value[0] not in labels
            }
            self.label_splitting_scribbles = {
                key: value
                for key, value in self.label_splitting_scribbles.items() if value[0] not in labels
            }
        else:
            remaining_annotation = {key: value for key, value in self.annotation.items() if value[1] not in ids}
            self.label_merging_scribbles = {
                key: value
                for key, value in self.label_merging_scribbles.items() if value[1] not in ids
            }
            self.label_splitting_scribbles = {
                key: value
                for key, value in self.label_splitting_scribbles.items() if value[1] not in ids
            }

        self.removed_annotation = {
            key: value
            for key, value in self.annotation.items() if key not in remaining_annotation
        }
        self.annotation = remaining_annotation

    def get_annotation(self):
        return self.annotation

    def update_annotation(self, annotations):
        # Drawing markers on top of the marker label/id images
        labels = aux_functions.get_label_ids(annotations)

        marker_ids = aux_functions.get_marker_ids(annotations)
        min_new_mk_id = min(marker_ids) if len(marker_ids) > 0 else 0

        marker_ids = aux_functions.get_marker_ids(self.annotation)
        max_old_mk_id = max(marker_ids) if len(marker_ids) > 0 else 0

        logging.debug('Old len annotation: {}, new annotation len: {}'.format(len(self.annotation), len(annotations)))
        # Updating annotations and ensuring that the marker ids follow an ever growing sequence
        self.annotation.update({(k, (v[0], v[1] - min_new_mk_id + max_old_mk_id + 1)) for k, v in annotations.items()})
        self.__update_annotation_image(self.annotation)

        logging.debug('Updated len annotation: {}, new annotation len: {}'.format(len(self.annotation),
                                                                                  len(annotations)))

        # updating the current marker id
        marker_ids = aux_functions.get_marker_ids(self.annotation)
        self.current_mk_id = max(self.current_mk_id, max(marker_ids) if len(marker_ids) > 0 else 0)

        for i in sorted(labels):
            if i not in self.added_labels:
                self.added_labels.append(Label(i))
        self.added_labels = sorted(self.added_labels)

    def save_annotation(self, path):

        if len(self.annotation) > 0:
            with open(path, 'wb') as f:
                pickle.dump(self.annotation, f)
                return True
        else:
            raise Exception('Empty annotation file. Please annotate the image before saving.')

    def load_annotation(self, path):
        success = False

        annotation = {}

        with open(path, 'rb') as f:
            try:
                annotation = pickle.load(f)
            finally:
                max_coords = np.zeros(3, dtype='int32')
                # Looking up maximum coordinates
                for coords in annotation:
                    c = np.array(coords, dtype='int32')
                    max_coords = np.maximum(max_coords, c)

                if np.all(max_coords < np.array((self.zsize, self.ysize, self.xsize))):
                    logging.debug('Loading annotation: {}'.format(len(annotation)))
                    self.update_annotation(annotation)
                    self.update_annotation_slice()
                    success = True
                else:
                    raise Exception(
                        'Annotated image coordinates do not match the current image! (Maximum annotated coordinates: %s. Image size %s)'
                        % (str(max_coords), str(self.volume_data.shape)))

        if success:
            aux_functions.log_usage(op_type='load_annotation',
                                    num_annotated_voxels=len(annotation),
                                    num_selected_markers=len(np.unique(list(map(itemgetter(1), annotation.values())))))

        return success

