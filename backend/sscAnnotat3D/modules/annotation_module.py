import logging
import math
import pickle
import numpy as np

from skimage import draw
from operator import itemgetter

from sscAnnotat3D import aux_functions

class Label(object):
    def __init__(self, id, name=None):
        self.name = name
        self.id = id

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

        self.zsize, self.ysize, self.xsize = image_shape
        self.volume_data = kwargs["image"] if "image" in kwargs else None
        self.xyslice = 0
        self.xzslice = 0
        self.yzslice = 0
        self.current_axis = 0  # Default axis: XY

        self.image_slice = None
        self.labels_image = None

        self.order_markers = set()
        # Markers
        self.current_label = -1
        self.__default_marker_label_selection_type = 'from_user'
        self.set_marker_label_selection_type(self.__default_marker_label_selection_type)
        self.added_labels = []

        self.marker_mode = 'add'
        self.manual_marker_mode = False

        self.radius = 5

        # Annotation result
        self.annotation = {}

        self.label_merging_scribbles = {}
        self.label_splitting_scribbles = {}
        self.removed_annotation = {}

        self.create_labels()

        self.selected_cmap = 'grays'
        self.classifier = None

    # So we need to pay attention if anything broke on the code
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
            self.__annotation_image[c] = v[0]

    def initialize(self):
        self.annotation = {}
        self.label_merging_scribbles = {}
        self.label_splitting_scribbles = {}
        self.removed_annotation = {}

        self.set_slice_xy(0, False)
        self.set_slice_xz(0, False)
        self.set_slice_yz(0, True)

        # Clipping plane data
        self.clipping_plane_transform = None
        self.clipping_plane_normal = None
        self.clipping_plane_dist = 0.0
        self.clipping_plane_adjustment_dist = 0.0

        data = self.get_volume_grid_data()
        d0, d1, d2 = data['shape']
        diag = data['diag']

        grid_x, grid_y = np.meshgrid(np.array(range(-(diag // 2), diag - (diag // 2))),
                                     np.array(range(-(diag // 2), diag - (diag // 2))),
                                     indexing='xy')
        self.clipping_plane_grid = np.zeros((grid_x.shape[0], grid_x.shape[1], 3), dtype='float32')
        self.clipping_plane_grid[:, :, 0] = grid_x
        self.clipping_plane_grid[:, :, 1] = grid_y
 
    def reload(self, image, **kwargs):
        logging.info('Reloading annotation class')

        self.__image_path = kwargs['path'] if 'path' in kwargs else ''
        aux_functions.log_usage(op_type='load_image',
                                image_path=self.__image_path,
                                image_shape=image.shape)

        self.initialize()

        self.create_labels()

        self.__default_marker_label_selection_type = 'from_user'
        self.set_marker_label_selection_type(self.__default_marker_label_selection_type)

        logging.debug('Reloading complete for annotation class')
 
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

    def set_slice_xy(self, xyslice):
        if xyslice < 0 or xyslice >= self.zsize:
            return
        self.xyslice = xyslice

    def set_slice_xz(self, xzslice):
        if xzslice < 0 or xzslice >= self.ysize:
            return
        self.xzslice = xzslice

    def set_slice_yz(self, yzslice):
        if yzslice < 0 or yzslice >= self.xsize:
            return
        self.yzslice = yzslice

    @property
    def annotation_image(self):
        return self.__annotation_image

    def set_marker_label_selection_type(self, type):
        self.marker_label_selection_type = type

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

    def remove_label(self, label_id: int):
        self.remove_annotation(labels=(label_id, ))

        removed_labels = aux_functions.get_marker_ids(self.removed_annotation)
        try:
            self.order_markers -= removed_labels
        except Exception as e:
            print(str(e))

        #update the label list
        added_labels = [l for l in self.added_labels if l.id != label_id]
        self.added_labels = added_labels
        return removed_labels

    def erase_all_markers(self):
        # Copying all removed annotation
        self.removed_annotation = dict(self.annotation)

        self.annotation = {}
        self.label_merging_scribbles = {}
        self.label_splitting_scribbles = {}
        self.order_markers = set()

    def clear_removed_data(self):
        self.removed_annotation = {}

    def get_radius(self):
        return self.radius

    def set_radius(self, radius):
        if int(radius) == self.radius:
            return
        self.radius = int(radius)

    def get_coords_surrounding_point(self, y, x, coords3d=True, tolerance=2):
        if self.current_axis < 0:

            rr, cc = draw.disk((y, x), radius=tolerance, shape=self.get_current_slice_shape())

            coords = list(
                map(lambda coord: coord if not coords3d else self.get_current_slice_3d_coord(coord), zip(rr, cc)))
        else:
            coords = [(y, x) if not coords3d else self.get_current_slice_3d_coord((y, x))]

        valid_coords = list(filter(lambda c: self.valid_coords(c), coords))

        return valid_coords

    def undo(self):
        print('gonna undo ...', self.order_markers)
        if len(self.order_markers) > 0:
            marker_to_remove = max(self.order_markers)

            self.order_markers.remove(marker_to_remove)
            self.remove_annotation(ids=(marker_to_remove, ))

    @property
    def current_mk_id(self):
        marker_id = max(self.order_markers) + 1 if self.order_markers else 1
        return marker_id

    def draw_marker_dot(self, y, x, marker_lb, marker_id, erase=False):

        self.order_markers.add(marker_id)

        if self.radius == 0:
            if not erase:
                # Draw point using current label
                c = self.get_current_slice_3d_coord((y, x))
                print(c)
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
                rr, cc = draw.disk((y, x), radius=self.radius, shape=self.get_current_slice_shape())
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

    #TODO : Need to make possible for the user to choose a colormap
    def load_label_from_file_load_dialog(self, label):
        new_labels = np.unique(label)
        # if we have more labels than our colormap supports, load a bigger colormap
        self.include_labels(new_labels)
        label_list = []
        i = 0
        for _ in self.added_labels:
            label_list.append({
                "labelName": "Label {}".format(i) if i > 0 else "Background",
                "id": i,
                "color": []})
            i += 1

        aux_functions.log_usage(op_type='load_label',
                                label_shape=label.shape,
                                label_dtype=str(label.dtype))

        return label_list

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
        for marker in marker_ids:
            self.order_markers.add(marker)

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

