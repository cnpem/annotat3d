import logging
import math
import pickle
from collections import defaultdict
from operator import itemgetter

import numpy as np
from skimage import draw
from sscAnnotat3D import aux_functions


class Label(object):
    def __init__(self, id, name=None):
        self.name = name
        self.id = id

    def __lt__(self, other):
        return self.id < other.id

    def __str__(self):
        return "Label(name={}, id={})".format(self.name, self.id)

    def __repr__(self):
        return str(self)

    def __eq__(self, other):
        if type(other) is type(self):
            return self.id == other.id
        else:
            return False

    def __hash__(self):
        return hash(self.id)


class AnnotationModule:
    """docstring for Annotation"""

    def __init__(self, image_shape, **kwargs):

        logging.debug("Creating Annotation_Canvas")

        self.__image_path = kwargs["path"] if "path" in kwargs else ""
        aux_functions.log_usage(op_type="load_image", image_path=self.__image_path, image_shape=image_shape)

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
        self.__default_marker_label_selection_type = "from_user"
        self.set_marker_label_selection_type(self.__default_marker_label_selection_type)
        self.added_labels = []

        self.marker_mode = "add"
        self.manual_marker_mode = False

        self.radius = 5

        # initialize annotation property, therefore creating underscore itens
        self.annotation = defaultdict(list)

        # list that appends every new annotation in order
        self.__annotation_list = []

        self.removed_annotation = {}

        # dicitionary with marker id (oder of operation) as entry and label id as key, necessary
        # for restoration of labeltable in frontend after deleting whole label
        # and pressing undo operation
        self.__annot_label_removed = {}

        self.create_labels()

        self.selected_cmap = "grays"
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

        self.__annotation_image = (-1) * np.ones((self.zsize, self.ysize, self.xsize), dtype="int16")

        for c, v in self.__annotation.items():
            self.__annotation_image[c] = v[-1]

    def initialize(self):
        self.annotation = {}
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
        d0, d1, d2 = data["shape"]
        diag = data["diag"]

        grid_x, grid_y = np.meshgrid(
            np.array(range(-(diag // 2), diag - (diag // 2))),
            np.array(range(-(diag // 2), diag - (diag // 2))),
            indexing="xy",
        )
        self.clipping_plane_grid = np.zeros((grid_x.shape[0], grid_x.shape[1], 3), dtype="float32")
        self.clipping_plane_grid[:, :, 0] = grid_x
        self.clipping_plane_grid[:, :, 1] = grid_y

    def reload(self, image, **kwargs):
        logging.info("Reloading annotation class")

        self.__image_path = kwargs["path"] if "path" in kwargs else ""
        aux_functions.log_usage(op_type="load_image", image_path=self.__image_path, image_shape=image.shape)

        self.initialize()

        self.create_labels()

        self.__default_marker_label_selection_type = "from_user"
        self.set_marker_label_selection_type(self.__default_marker_label_selection_type)

        logging.debug("Reloading complete for annotation class")

    def get_volume_grid_data(self, volume_data=None):
        d0, d1, d2 = self.zsize, self.ysize, self.xsize
        diag = int(math.sqrt(d0 * d0 + d1 * d1 + d2 * d2))

        return {"shape": (d0, d1, d2), "diag": diag}

    def get_clipping_plane_data(self):
        data = self.get_volume_grid_data()

        diag = data["diag"]

        return {"shape": (diag, diag)}

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
        d0, d1, d2 = data["shape"]
        diag = data["diag"]

        coords3d = np.zeros(3, dtype="float32")

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

        coords3d = coords3d + np.array((d0 // 2, d1 // 2, d2 // 2), dtype="float32")
        coords3d = tuple(coords3d.astype("int32"))

        return coords3d

    def transform_3d_coords_to_2d_clipping_plane_coords(self, transform, coords3d, proximity_threshold=0.6):
        data = self.get_volume_grid_data()
        d0, d1, d2 = data["shape"]
        diag = data["diag"]

        center = np.array((d2 // 2, d1 // 2, d0 // 2), dtype="float32")
        coords3d = np.array((coords3d[2], coords3d[1], coords3d[0]), dtype="float32") - center

        dist = (
            self.clipping_plane_normal.dot(coords3d) + self.clipping_plane_dist - self.clipping_plane_adjustment_dist
        ) / np.linalg.norm(self.clipping_plane_normal)

        # verifying if coordinate is on plane. If it isn't, then we return None
        is_on_plane = abs(dist) <= proximity_threshold

        coords3d = transform.map(coords3d)[..., :3]

        if is_on_plane:
            tmp = coords3d[1] + diag // 2
            coords3d[1] = coords3d[0] + diag // 2
            coords3d[0] = tmp
            coords2d = tuple(coords3d.astype("int32"))[:2]

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
            raise Exception("Please select a clipping plane first")
        return self.transform_clipping_plane_coords_to_3d(self.clipping_plane_transform, coords)

    def get_current_clipping_plane_2d_coord(self, coord_3d, proximity_threshold=0.6):
        if self.clipping_plane_transform is None:
            raise Exception("Please select a clipping plane first")
        return self.transform_3d_coords_to_2d_clipping_plane_coords(
            self.clipping_plane_transform, coord_3d, proximity_threshold
        )

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
                raise Exception("Please select a clipping plane first")
            return self.get_clipping_plane_data()["shape"]
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
        # Increasing the maximum available label id by 1
        added_labels = [l.id for l in self.added_labels]
        new_label = new_base_label + (np.max(added_labels) if len(self.added_labels) > 0 else 0) + 1

        self.added_labels.append(Label(new_label, name))

    def remove_label(self, label_id: int, marker_id: int):

        # updating the marker id, the remove label is considered an erase (of label) action
        self.order_markers.add(marker_id)

        self.__annot_label_removed[marker_id] = label_id

        new_annotation = []
        # iteration through all the dict to get last label added equal to label_id coords
        for coord3D, label_list in self.__annotation.items():
            if label_list[-1] == label_id:
                # take last label from this coords, garantee to have since it's on the list
                self.__annotation[coord3D].append(-1)
                self.__annotation_image[coord3D] = -1
                new_annotation.append(coord3D)

        self.__annotation_list.append(new_annotation)

        # update the label list
        added_labels = [l for l in self.added_labels if l.id != label_id]
        self.added_labels = added_labels

        ###end###

    def erase_all_markers(self):

        self.annotation = defaultdict(list)
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
                map(lambda coord: coord if not coords3d else self.get_current_slice_3d_coord(coord), zip(rr, cc))
            )
        else:
            coords = [(y, x) if not coords3d else self.get_current_slice_3d_coord((y, x))]

        valid_coords = list(filter(lambda c: self.valid_coords(c), coords))

        return valid_coords

    def undo(self):
        print("gonna undo ...", self.order_markers)
        if len(self.order_markers) > 0:
            marker_to_remove = max(self.order_markers)
            print("marker_to_remove", marker_to_remove)
            self.order_markers.remove(marker_to_remove)

            # we need to tell the frontend that the label has returned
            if marker_to_remove in self.__annot_label_removed.keys():
                label_restored = self.__annot_label_removed[marker_to_remove]
                del self.__annot_label_removed[marker_to_remove]
            else:
                label_restored = -1

            # get last annoted coords
            coords_to_remove = self.__annotation_list.pop()

            for coord3D in coords_to_remove:

                # take last label from this coords, garantee to have since it's on the list
                self.__annotation[coord3D].pop()

                # if there is one label, it writes as the previous label, otherwise it will write as -1
                if len(self.__annotation[coord3D]) > 0:
                    self.__annotation_image[coord3D] = self.__annotation[coord3D][-1]
                else:
                    self.__annotation_image[coord3D] = -1
                    del self.__annotation[coord3D]

            return marker_to_remove, label_restored
        return -1

    @property
    def current_mk_id(self):
        marker_id = max(self.order_markers) + 1 if self.order_markers else 1
        return marker_id

    def labelmask_update(self, label_mask, marker_lb, marker_id, new_click):

        # Undo previous iteration        
        if new_click == False:
            self.undo()

        ## Updating the markers with the current marker id ##
        self.order_markers.add(marker_id)

        if label_mask.ndim == 2:
            # Get the coordinates where the mask is non-zero to draw
            rr,cc = np.nonzero(label_mask)

            new_annotation = []
            for coord2D in zip(rr,cc):
                coord3D = self.get_current_slice_3d_coord(coord2D)
                self.__annotation[coord3D].append(marker_lb)
                self.__annotation_image[coord3D] = marker_lb
                #save the coords
                new_annotation.append(coord3D)

        else:
            rr,cc,dd = np.nonzero(label_mask)
            new_annotation = []
            for coord3D in zip(rr,cc,dd):
                self.__annotation[coord3D].append(marker_lb)
                self.__annotation_image[coord3D] = marker_lb
                #save the coords
                new_annotation.append(coord3D)

        self.__annotation_list.append(new_annotation)


    def labelmask_multiupdate(self, label_masks, marker_lbs, marker_id, new_click):

        # Undo previous iteration        
        if new_click == False:
            self.undo()

        ## Updating the markers with the current marker id ##
        self.order_markers.add(marker_id)
        
        new_annotation = []
        for label_mask, marker_lb in zip(label_masks, marker_lbs):
            if label_mask.ndim == 2:
                # Get the coordinates where the mask is non-zero to draw
                rr,cc = np.nonzero(label_mask)
                for coord2D in zip(rr,cc):
                    coord3D = self.get_current_slice_3d_coord(coord2D)
                    self.__annotation[coord3D].append(marker_lb)
                    self.__annotation_image[coord3D] = marker_lb
                    #save the coords
                    new_annotation.append(coord3D)

            else:
                rr,cc,dd = np.nonzero(label_mask)
                for coord3D in zip(rr,cc,dd):
                    self.__annotation[coord3D].append(marker_lb)
                    self.__annotation_image[coord3D] = marker_lb
                    #save the coords
                    new_annotation.append(coord3D)

        self.__annotation_list.append(new_annotation)

    def draw_marker_curve(self, cursor_coords, marker_id, marker_lb, erase=False):

        # from time import time
        ## Updating the markers with the current marker id ##
        self.order_markers.add(marker_id)

        ### Creating the mask in the size of the brush ###
        radius = self.radius
        size = 2 * radius + 1
        disk_mask = np.zeros((size, size), dtype=np.bool_)
        rr, cc = draw.disk((radius, radius), radius)
        disk_mask[rr, cc] = True

        ### Create a mask image for adding the drawings ###
        height, width = self.get_current_slice_shape()
        image = np.zeros((width, height), dtype=np.bool_)

        for coord in cursor_coords:
            # check if its valid coord, invert for y (or z),x mode. Coord inputs are in x,y (or z).
            if self.valid_coords(coord[::-1]):
                x, y = list(map(int, np.floor(coord)))
                # ensure the drawing of the disk is within the image range
                x_start = max(0, x - radius)
                y_start = max(0, y - radius)
                x_end = min(width, x + radius + 1)
                y_end = min(height, y + radius + 1)

                mask_x_start = radius - (x - x_start)
                mask_y_start = radius - (y - y_start)
                mask_x_end = radius + (x_end - x)
                mask_y_end = radius + (y_end - y)

                # make the drawing
                image[x_start:x_end, y_start:y_end] += disk_mask[mask_x_start:mask_x_end, mask_y_start:mask_y_end]

        # print('first {}'.format(time()-start))

        rr, cc = np.nonzero(image)

        # print('second {}'.format(time()-start))

        # all the coords are valid, therefore no need to use the self.get_valid_coords

        if erase:
            marker_lb = -1

        new_annotation = []
        # since get_current_slice_3D gives, (z,y,x) coords, we need to provide cc,rr coords not rr,cc
        for coord2D in zip(cc, rr):
            coord3D = self.get_current_slice_3d_coord(coord2D)
            self.__annotation[coord3D].append(marker_lb)
            self.__annotation_image[coord3D] = marker_lb
            # save the coords
            new_annotation.append(coord3D)

        self.__annotation_list.append(new_annotation)

        # print('draw backend time {}'.format(time()-start))

    def __update_annotation_image(self, annotation, label=None):
        if label is not None:
            for c in annotation:
                self.__annotation_image[c] = label
        else:
            for c, v in annotation.items():
                self.__annotation_image[c] = v[-1]

    def get_annotation(self):
        return self.annotation

    def set_annotation(self, label_annotation: dict):
        self.annotation = label_annotation
        return self.annotation

    def update_annotation(self, annotations):
        # Drawing markers on top of the marker label/id images
        labels = aux_functions.get_label_ids(annotations)

        marker_ids = aux_functions.get_marker_ids(annotations)
        min_new_mk_id = min(marker_ids) if len(marker_ids) > 0 else 0

        marker_ids = aux_functions.get_marker_ids(self.annotation)
        max_old_mk_id = max(marker_ids) if len(marker_ids) > 0 else 0

        logging.debug("Old len annotation: {}, new annotation len: {}".format(len(self.annotation), len(annotations)))
        # Updating annotations and ensuring that the marker ids follow an ever growing sequence
        self.annotation.update({(k, (v[0], v[1] - min_new_mk_id + max_old_mk_id + 1)) for k, v in annotations.items()})
        self.__update_annotation_image(self.annotation)

        logging.debug(
            "Updated len annotation: {}, new annotation len: {}".format(len(self.annotation), len(annotations))
        )

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
            with open(path, "wb") as f:
                pickle.dump(self.annotation, f)
                return True
        else:
            raise Exception("Empty annotation file. Please annotate the image before saving.")

    def load_annotation(self, path):
        success = False

        annotation = {}

        with open(path, "rb") as f:
            try:
                annotation = pickle.load(f)
            finally:
                max_coords = np.zeros(3, dtype="int32")
                # Looking up maximum coordinates
                for coords in annotation:
                    c = np.array(coords, dtype="int32")
                    max_coords = np.maximum(max_coords, c)

                if np.all(max_coords < np.array((self.zsize, self.ysize, self.xsize))):
                    logging.debug("Loading annotation: {}".format(len(annotation)))
                    self.update_annotation(annotation)
                    success = True
                else:
                    raise Exception(
                        "Annotated image coordinates do not match the current image! (Maximum annotated coordinates: %s. Image size %s)"
                        % (str(max_coords), str(self.volume_data.shape))
                    )

        if success:
            aux_functions.log_usage(
                op_type="load_annotation",
                num_annotated_voxels=len(annotation),
                num_selected_markers=len(np.unique(list(map(itemgetter(1), annotation.values())))),
            )

        return success
