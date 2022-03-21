import {ImagePropsInterface} from "./ImagePropsInterface";

/**
 * Interface Component for SideMenuAnnotat
 */
export interface SideMenuAnnotatInterface{
    imageSlice: ImagePropsInterface; onImageSlice: (slice: ImagePropsInterface) => void;
}