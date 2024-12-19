import cv2 as cv
import numpy as np

class MagicWandSelector():
    def __init__(self, img: np.array, blur_radius: int = 0, upper_tolerance = 32, lower_tolerance = 32, connectivity: int = 8):

        if img.dtype != "float32" or img.dtype != "uint8":
            self.img = img.astype("float32")
        else:
            self.img = img
        
        self._flood_fill_flags = (
            connectivity | cv.FLOODFILL_FIXED_RANGE | cv.FLOODFILL_MASK_ONLY | 255 << 8
        )
        self.upper_tolerance = (upper_tolerance,) * 3
        self.lower_tolerance = (lower_tolerance,) * 3
        self.blur_radius = blur_radius
        self.flood_mask = np.zeros(img.shape,dtype='uint8')

    def apply_magic_wand(self, x, y):

        flood_mask = np.pad(self.flood_mask, ((1, 1), (1, 1)), 'constant', constant_values=0)

        cv.floodFill(
            self.img,
            flood_mask,
            (x, y),
            255,
            self.lower_tolerance,
            self.upper_tolerance,
            self._flood_fill_flags,
        )

        #remove padding 
        self.flood_mask = flood_mask[1:-1, 1:-1]

        return self._update()

    def _update(self):
        """Returns the updated mask and statistics."""
        mean, stddev = cv.meanStdDev(self.img, mask=self.flood_mask)
        stats = {
            "mean": mean[:, 0].tolist(),
            "stddev": stddev[:, 0].tolist(),
        }
        if self.blur_radius != 0:
            ##CLOSING HOLES
            mask = (self.flood_mask != 0).astype("uint8")
            mask = cv.GaussianBlur(mask, (self.blur_radius * 2 + 1, self.blur_radius * 2 + 1), 0)
        else:
            mask = self.flood_mask
            
        return mask, stats
