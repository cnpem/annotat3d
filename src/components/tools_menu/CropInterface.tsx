/**
 * Crop info component for CropMenu
 */

export interface CropInterface{
    xLower: number;
    xUpper: number;
    yLower: number;
    yUpper: number;
    zLower: number;
    zUpper: number;
}

export interface CropAxis{
    begin: number;
    end: number;
}