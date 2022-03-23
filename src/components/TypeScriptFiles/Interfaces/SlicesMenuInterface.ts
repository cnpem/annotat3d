/**
 * Interface component for SlicesMenuInterface
 */
import {ImagePropsInterface} from "./ImagePropsInterface";

export interface SlicesMenuInterface{
    imageProps: ImagePropsInterface;
    onImageProps: (image: ImagePropsInterface) => void;
}
