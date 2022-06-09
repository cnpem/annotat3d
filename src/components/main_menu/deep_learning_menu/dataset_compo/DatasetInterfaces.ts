/**
 * This script contains all the interfaces for dataset_compo directory

 /**
 * Interface for Augmentation option
 */
export interface AugmentationInterface {
    checkedId: number,
    augmentationOption: string,
    isChecked: boolean,
}

/**
 * Initial state for Augmentation options
 */
export const InitAugmentationOptions: AugmentationInterface[] = [
    {
        augmentationOption: "Vertical Flip",
        isChecked: false,
        checkedId: 0,
    },
    {
        augmentationOption: "Horizontal Flip",
        isChecked: false,
        checkedId: 1,
    },
    {
        augmentationOption: "Rotate 90 Degress",
        isChecked: false,
        checkedId: 2,
    },
    {
        augmentationOption: "Rotate -90 Degress",
        isChecked: false,
        checkedId: 3,
    },
    {
        augmentationOption: "Contrast",
        isChecked: false,
        checkedId: 4,
    },
    {
        augmentationOption: "Linear Contrast",
        isChecked: false,
        checkedId: 5,
    },
    {
        augmentationOption: "Dropout",
        isChecked: false,
        checkedId: 6,
    },
    {
        augmentationOption: "Gaussian Blur",
        isChecked: false,
        checkedId: 7,
    },
    {
        augmentationOption: "Average Blur",
        isChecked: false,
        checkedId: 8,
    },
    {
        augmentationOption: "Additive Poisson Noise",
        isChecked: false,
        checkedId: 9,
    },
    {
        augmentationOption: "Elastic Deformation",
        isChecked: false,
        checkedId: 10,
    }
]