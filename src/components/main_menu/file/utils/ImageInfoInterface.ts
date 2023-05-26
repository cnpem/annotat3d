/**
 * Interface for the image info
 */

import { CropShapeInterface } from '../../../tools_menu/utils/CropInterface';
import { ImageShapeInterface } from '../../../tools_menu/utils/ImageShapeInterface';
import { LabelInterface } from '../../../tools_menu/annotation_menu/label_table/LabelInterface';

export interface ImageInfoInterface {
    imageShape: ImageShapeInterface;
    imageName: string;
    imageExt: string;
    imageDtype: string;
    imageFullPath: string;
    cropShape?: CropShapeInterface; // do i remove this?
}

export interface ImageInfoPayload {
    imageShape: ImageShapeInterface;
    imageName: string;
    imageExt: string;
    imageDtype: string;
    imageFullPath: string;
    cropShape?: CropShapeInterface;
    labelList: LabelInterface[]; // do i remove this?
}
