/**
 * Interface component for CropShapeInterface
 * 
 * Carries the indexes of lower and upper bounds of a cropped image over an axis 
 */
interface CropAxisInterface{
    lower: number;
    upper: number;
}

interface CropShapeInterface{
    cropX: CropAxisInterface;
    cropY: CropAxisInterface;
    cropZ: CropAxisInterface;
}

export type {CropAxisInterface, CropShapeInterface}