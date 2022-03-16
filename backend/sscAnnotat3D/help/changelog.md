## Changelog

#### 0.10.5
**Bugfix**
- Migrate to sscIO.

#### 0.10.4
**Bugfix**
- Share image contrast visualization with Preprocessing Window.

#### 0.10.3
**Bugfix**
- Support for multiple data types on BM3D

#### 0.10.2
**Feature**
- Allow navigation on slices with arrow keys

#### 0.10.1
**Bugfix**
- Fix colors order when removing labels.
- Fix problem with multiclass SVM prediction.

#### 0.10.0

**Performance**
- Cython Wrappers for spin

#### 0.9.11

**Bugfix**
- Fix bug on create new deeplearning workspace
- Fix UI load module error

#### 0.9.10

**Bugfix**
- Fix crash on label editing.
- Fix UI error on label editing parameter settings.

#### 0.9.9

**Features**

- Remote profiling

#### 0.9.8

**Bugfix**

- Fix artifacts appearing on label editing.

**Features**

- Open both Raw/TIFF images by default
- Visual contrast definition for visualization


#### 0.9.7

**Bugfix**

- Simplify superpixel preview to improve performance


#### 0.9.6

**Bugfix**

- Capture all errors to show as an error dialog


#### 0.9.5

**Feature**

- Update to Python3.9


#### 0.9.4

**Bugfix**

- Fix Crash label editing
- Better labels merging strategy

#### 0.9.3

**Bugfix**

- Performance improvement for random forest classifier

#### 0.9.2

**Bugfix**

- Fix deeplearning inference filename nomenclature

#### 0.9.1

**Bugfix**

- Fix load training data on classifier

#### 0.9.0

**Feature**

- Include Tepui Remote Process

#### 0.8.0

**Feature**

- Parallel Edit Labels
- Preview on Data Augmentation

#### 0.7.1

**Bugfix**

- Histogram on contrast adjustment
- Including deeplearning inference error/success messages

#### 0.7.0

**Feature**

- Include Remote Visualization (Experimental)

#### 0.6.4

**Bugfix**

- Performance improvement for a large number of annotations

#### 0.6.3

**Bugfix**

- Classification error on some loaded classifiers

#### 0.6.2

**Added**

- Save volume

#### 0.6.1

**Bugfix**

- Fix a crash opening second image without restart application

#### 0.6.0

**Added**

- Add support for pre-processing filters

#### 0.5.3

**Bugfix**

- Fix support for new hdf5 definition

#### 0.5.2

**Bugfix**

- Fix failure to open some compressed tiff images
- Progressbar on deep learning inference

#### 0.5.1

**Bugfix**

- Brightness underflow on low contrast images

#### 0.5

**Added**

- Pixel classification
- More options on network inference

**Bugfix**

- Speedup on network inference of multiple images

#### 0.4.8

**Added**
- Support new H5 specs

#### 0.4.7

**Bugfix**

- Crash when running superpixels definition multiple times

#### 0.4.6

**Bugfix**

- Error on load classifier

#### 0.4.5

**Added**

- Support floating image deepsirius
- Support RAFT HDF5

#### 0.4.4

**Added**

- Allow to choose data type when saving label
- Allow user to add shape and data type on reading non standard named raw images


#### 0.4.3

**Fixed**

- Speedup superpixel boundary detection

#### 0.4.2

**Added:**

- Superpixel boundaries zoom in subpixel level
- Edit label colormap
- Gradient Descent optimizer

**Fixed**

- Renamed label on annotation permanent
- Compact GUI for low resolution devices

**Removed**

- Manual annotation mode
