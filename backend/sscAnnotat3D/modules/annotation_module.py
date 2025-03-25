import logging
import math
import pickle
from collections import defaultdict
from operator import itemgetter

import numpy as np
from skimage import draw
from sscAnnotat3D import aux_functions
from time import time
from itertools import repeat
from collections import deque

class AnnotationModule:
    """docstring for Annotation"""

    def __init__(self, image_shape, **kwargs):

        logging.debug("Creating Annotation_Canvas")

        self.zsize, self.ysize, self.xsize = image_shape
        self.__annotation_image = (-1) * np.ones((self.zsize, self.ysize, self.xsize), dtype="int16")

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
        self.added_labels = []

        self.radius = 5

        self.create_labels()

        self.annotation_slice_dict = {0: set(), 1: set(), 2: set()}
        self.annotation_history = deque(maxlen=5)

    @property
    def clipping_plane_dist(self):
        return self.__clipping_plane_dist

    @clipping_plane_dist.setter
    def clipping_plane_dist(self, val):
        self.__clipping_plane_dist = val


    def initialize(self):
        self.annotation = {}

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

    def update_image_shape(self, new_image_shape):
        """
        Update the shape of the image and reinitialize relevant attributes.
        """
        if len(new_image_shape) != 3:
            raise ValueError("new_image_shape must be a tuple of three dimensions (z, y, x).")

        logging.info(f"Updating image shape from {self.zsize, self.ysize, self.xsize} to {new_image_shape}")

        # Update dimensions
        self.zsize, self.ysize, self.xsize = new_image_shape

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

    def _get_current_slice_indexing(self):
            s = [slice(None, None, None), slice(None, None, None), slice(None, None, None)]
            slice_num = [self.xyslice, self.xzslice, self.yzslice]
            s[self.current_axis] = slice_num[self.current_axis]
            return s

    ##maybe add a remove slice annotated
    def add_slice_annotated(self):
        slice_num = [self.xyslice, self.xzslice, self.yzslice]
        self.annotation_slice_dict[self.current_axis].add(slice_num[self.current_axis])
        return (self.current_axis, slice_num[self.current_axis])

    
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

    def get_labels_object(self):
        return self.added_labels

    def get_label_object(self, label):
        labels = [l for l in self.added_labels if l.id == label]
        return labels[0]

    def get_labels(self):
        return [l.id for l in self.added_labels]

    def remove_label(self, label_id: int, marker_id: int):

        # updating the marker id, the remove label is considered an erase (of label) action
        self.order_markers.add(marker_id)

        slices_coords_removed = []
        # iteration through all the dict to get last label added equal to label_id coords
        for axis, slice_nums in self.annotation_slice_dict.items():
            for slice_num in slice_nums:
                # Extract the appropriate slice along the given axis
                annot_slice = np.take(self.__annotation_image, slice_num, axis=axis)
                # Find where the label is located at
                bool_mask = annot_slice == label_id

                rr, cc = np.nonzero(bool_mask)
                fixed_slice = np.zeros_like(rr)
                fixed_slice[:] = slice_num
                # Depending on the axis, build the coordinate tuples accordingly
                if axis == 0:
                    coords = (fixed_slice, rr, cc)
                    slices_coords_removed.append(coords)
                    self.__annotation_image[coords] = -1
                elif axis == 1:
                    coords = (fixed_slice, rr, cc)
                    slices_coords_removed.append(coords)
                    self.__annotation_image[coords] = -1
                elif axis == 2:
                    coords = (rr, cc, fixed_slice)
                    slices_coords_removed.append(coords)
                    self.__annotation_image[coords] = -1
                else:
                    raise ValueError(f"Unsupported axis: {axis}")
        
        self.annotation_history.append(['label_removed', slices_coords_removed, label_id])

        # update the label list
        added_labels = [l for l in self.added_labels if l.id != label_id]
        self.added_labels = added_labels

        ###end###

    def erase_all(self):
        self.order_markers = set()
        self.added_labels = []
        self.__annotation_image = (-1) * np.ones((self.zsize, self.ysize, self.xsize), dtype="int16")

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
            
            if len(self.annotation_history) > 0:
                # get last annoted coords
                last_activity = self.annotation_history.pop()

                # we need to tell the frontend that the label has returned
                if 'label_removed' in last_activity:
                    _ , slices_coords_removed, label_restored = last_activity
                    for coords_removed in slices_coords_removed:
                        self.__annotation_image[coords_removed] = label_restored
                else:
                    label_restored = -1
                    get_slice, last_slice = last_activity
                    self.__annotation_image[get_slice] = last_slice

                return marker_to_remove, label_restored
        return None, -1

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
            self.add_slice_annotated()
            get_slice = self._get_current_slice_indexing()
            self.annotation_history.append([get_slice, self.__annotation_image[get_slice].copy()])
            self.__annotation_image[get_slice][label_mask] = marker_lb

        else:
            self.__annotation_image[label_mask] = marker_lb

    def multilabel_updated(self, new_annot, marker_id, new_click = True, annot_mask = None):
        #if there are no changes do nothing
        if annot_mask is not None and not annot_mask.any():
            return
        
        # Undo previous iteration        
        if new_click == False:
            self.undo()

        ## Updating the markers with the current marker id ##
        self.order_markers.add(marker_id)

        if new_annot.ndim == 2:
            # Get the coordinates where the mask is non-zero to draw
                self.add_slice_annotated()
                get_slice = self._get_current_slice_indexing()
                self.annotation_history.append([get_slice, self.__annotation_image[get_slice].copy()])
                self.__annotation_image[get_slice] = new_annot
        else:
            self.__annotation_image = new_annot

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
        width, height = self.get_current_slice_shape()
        pencil_drawing_bool = np.zeros((width, height), dtype=np.bool_)

        for coord in cursor_coords:
            # check if its valid coord, invert for y (or z),x mode. Coord inputs are in x,y (or z).
            if self.valid_coords(coord[::-1]):
                y, x = list(map(int, np.floor(coord)))
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
                pencil_drawing_bool[x_start:x_end, y_start:y_end] += disk_mask[mask_x_start:mask_x_end, mask_y_start:mask_y_end]

        if erase:
            marker_lb = -1

        self.add_slice_annotated()
        get_slice = self._get_current_slice_indexing()
        self.annotation_history.append([get_slice, self.__annotation_image[get_slice].copy()])
        self.__annotation_image[get_slice][pencil_drawing_bool] = marker_lb

        # print('draw backend time {}'.format(time()-start))

    def draw_init_levelset(self, cursor_coords):
        #same as funtion of draw_marker_curve, excpet it returns the bool image array

        ### Creating the mask in the size of the brush ###
        radius = 3
        size = 2 * radius + 1
        disk_mask = np.zeros((size, size), dtype=np.bool_)
        rr, cc = draw.disk((radius, radius), radius)
        disk_mask[rr, cc] = True

        ### Create a mask image for adding the drawings ###
        height, width = self.get_current_slice_shape()
        image = np.zeros((height, width), dtype=np.bool_)
        #print(image.shape)
        for coord in cursor_coords:
            # check if its valid coord, invert for y (or z),x mode. Coord inputs are in x,y (or z).
            if self.valid_coords(coord):
                x, y = list(map(int, np.floor(coord)))
                # ensure the drawing of the disk is within the image range
                x_start = max(0, x - radius)
                y_start = max(0, y - radius)
                x_end = min(height, x + radius + 1)
                y_end = min(width, y + radius + 1)

                mask_x_start = radius - (x - x_start)
                mask_y_start = radius - (y - y_start)
                mask_x_end = radius + (x_end - x)
                mask_y_end = radius + (y_end - y)

                # make the drawing
                image[x_start:x_end, y_start:y_end] += disk_mask[mask_x_start:mask_x_end, mask_y_start:mask_y_end]
        
        return image

    def get_annotation_slice_dict(self):
        total_subitems = sum(len(subset) for subset in self.annotation_slice_dict.values())
        #return empty dict in case there no annotation
        if total_subitems == 0:
            return {}
        else:
            return self.annotation_slice_dict
    
    def set_annotation_slice_dict(self, annotation_slice_dict):
        self.annotation_slice_dict = annotation_slice_dict
        
    def get_annotation_coords(self):

        # Accumulate coordinates separately for each axis (z, y, x)
        z_coords, y_coords, x_coords = [], [], []
        for axis, slice_nums in self.annotation_slice_dict.items():
            for slice_num in slice_nums:
                # Extract the appropriate slice along the given axis.
                annot_slice = np.take(self.__annotation_image, slice_num, axis=axis)
                # Find where the condition holds.
                rr, cc = np.nonzero(annot_slice >= 0)
                # Create an array filled with the slice number.
                fixed_slice = np.full(rr.shape, slice_num)
                
                if axis == 0:
                    # For axis 0, the fixed coordinate is z.
                    z_coords.append(fixed_slice)
                    y_coords.append(rr)
                    x_coords.append(cc)
                elif axis == 1:
                    # For axis 1, the fixed coordinate is y.
                    z_coords.append(rr)
                    y_coords.append(fixed_slice)
                    x_coords.append(cc)
                elif axis == 2:
                    # For axis 2, the fixed coordinate is x.
                    z_coords.append(rr)
                    y_coords.append(cc)
                    x_coords.append(fixed_slice)
                else:
                    raise ValueError(f"Unsupported axis: {axis}")

        # Concatenate the lists into single NumPy arrays for each dimension.
        z_all = np.concatenate(z_coords)
        y_all = np.concatenate(y_coords)
        x_all = np.concatenate(x_coords)

        # Use the tuple of coordinate arrays for advanced indexing.
        annotation_labels = self.__annotation_image[(z_all, y_all, x_all)]

        return (z_all, y_all, x_all), annotation_labels

    def set_annotation_from_coords(self, annotation_coords, annotation_labels):
        self.__annotation_image[annotation_coords] = annotation_labels


    def set_annotation_from_dict(self, annotation_dict):
        for coord3D, marker_lb in annotation_dict.items():
            marker_lb = marker_lb[0]
            self.__annotation_image[coord3D] = marker_lb
            
    def set_annotation_image(self, annotation_image):
        self.__annotation_image = annotation_image

