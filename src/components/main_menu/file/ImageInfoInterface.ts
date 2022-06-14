/**
 * Interface for the image info
 */

import { ImageShapeInterface } from "../../tools_menu/ImageShapeInterface";

export default interface ImageInfoInterface{
    imageShape:ImageShapeInterface;// Array<number> [3];
    imageName: string;
    imageExt: string;
    imageDtype: string;
};