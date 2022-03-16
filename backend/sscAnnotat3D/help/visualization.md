### Visualization Menu

- Render volume (MIP): Generates a 3D volume of your data. Unclick show slices to see it.
- Render label volume (ISO): Generates a 3D isosurface of the segmentation label with the volume used as texture. Unclick show slices to see it. Label Rendering options:
    - Solid color: Displays the label isosurface with an opaque color.
    - Grayscale: Displays the label using the image's grayscale values.
    - Fast rendering: Speeds up the computation of volume rendering by downgrading resolution.
    - Light intensity: Changes the intensity of light of the scene.
    - Label ISO threshold min: Minimum value used to compute the contrast.
    - Label ISO threshold max: Maximum value used to compute the contrast.
    - Clipping plane dist: Distance of the clipping plane that may be used to slice the image orthogonally to the current view.
- Scroll change slices: Use it at the 3D and 2D canvases to change XY slices automatically according to the mouse wheel position. If this option is unclicked, the mouse wheel will provide the zoom in and out.
- Show markers: Makes the markers visible.
- Show label: Overlays the segmentation label onto the original image.
    - Label Alpha: Controls the alpha value of the segmentation label overlay.
- Show superpixels: Displays the borders of the superpixels. Available after the generation of superpixels.
- Show meshes: Displays the 3D meshes computed for each label.
- Show bounding boxes: Displays bounding boxes around the slices and rendered volumes.

[Back to main menu](help.md)
