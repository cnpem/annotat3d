/**
 * Interface for the image info
 */

import { CropShapeInterface } from "../../../tools_menu/CropInterface";
import { ImageShapeInterface } from "../../../tools_menu/ImageShapeInterface";

export default interface ImageInfoInterface{
    imageShape:ImageShapeInterface;
    imageName: string;
    imageExt: string;
    imageDtype: string;
    imageFullPath: string;
    cropShape?:CropShapeInterface; // do i remove this?
};