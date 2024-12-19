import cv2
import numpy as np

def fill_lasso(width, height, points):
    image = np.zeros((height, width), dtype=np.uint8) 
    # Convert the list of points to a format suitable for OpenCV
    contour = np.array(points, dtype=np.int32).reshape((-1, 1, 2))
    # Fill the lasso using cv2.drawContours in grayscale
    fill_color = 1  # Black fill (grayscale)
    cv2.drawContours(image, [contour], -1, fill_color, thickness=cv2.FILLED)

    return image
