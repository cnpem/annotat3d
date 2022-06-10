/**
 * This script contains all the interfaces for dataset_compo directory

 /**
 * Interface for Augmentation option
 */
export interface IonRangeElement {
    ionRangeId: number,
    ionRangeName: string,
    actualRangeVal: number,
    ionRangeLimit: {
        minRange: number,
        maxRange: number,
    },
}

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
];

export const InitIonRangeVec: IonRangeElement[] = [
    /*Contrast Menu*/
    {
        ionRangeId: 0,
        ionRangeName: "Gamma",
        actualRangeVal: 0.95,
        ionRangeLimit: {
            minRange: 0.50,
            maxRange: 2.00,
        },
    },
    {
        ionRangeId: 1,
        ionRangeName: "Gamma",
        actualRangeVal: 1.55,
        ionRangeLimit: {
            minRange: 0.50,
            maxRange: 2.00,
        },
    },
    /*********************/
    /*Linear Contrast menu*/
    {
        ionRangeId: 2,
        ionRangeName: "Gamma",
        actualRangeVal: 0.76,
        ionRangeLimit: {
            minRange: 0.40,
            maxRange: 1.60,
        },
    },
    {
        ionRangeId: 3,
        ionRangeName: "Gamma",
        actualRangeVal: 1.24,
        ionRangeLimit: {
            minRange: 0.40,
            maxRange: 1.60,
        },
    },
    /*********************/
    /*Dropout menu*/
    {
        ionRangeId: 4,
        ionRangeName: "Dropout",
        actualRangeVal: 0.06,
        ionRangeLimit: {
            minRange: 0.00,
            maxRange: 0.20,
        },
    },
    {
        ionRangeId: 5,
        ionRangeName: "Dropout",
        actualRangeVal: 0.14,
        ionRangeLimit: {
            minRange: 0.00,
            maxRange: 0.20,
        },
    },
    /*********************/
    /*Gaussian Blur*/
    {
        ionRangeId: 6,
        ionRangeName: "Sigma",
        actualRangeVal: 0.97,
        ionRangeLimit: {
            minRange: 0.01,
            maxRange: 3.00,
        },
    },
    {
        ionRangeId: 7,
        ionRangeName: "Sigma",
        actualRangeVal: 2.13,
        ionRangeLimit: {
            minRange: 0.01,
            maxRange: 3.00,
        },
    },
    /*********************/
    /*Average Blur*/
    {
        ionRangeId: 8,
        ionRangeName: "K",
        actualRangeVal: 4.30,
        ionRangeLimit: {
            minRange: 1.00,
            maxRange: 12.00,
        },
    },
    {
        ionRangeId: 9,
        ionRangeName: "K",
        actualRangeVal: 8.70,
        ionRangeLimit: {
            minRange: 1.00,
            maxRange: 12.00,
        },
    },
    /*********************/
    /*Additive Poisson Noise*/
    {
        ionRangeId: 10,
        ionRangeName: "Scale",
        actualRangeVal: 6.00,
        ionRangeLimit: {
            minRange: 0.00,
            maxRange: 20.00,
        },
    },
    {
        ionRangeId: 11,
        ionRangeName: "Scale",
        actualRangeVal: 14.00,
        ionRangeLimit: {
            minRange: 0.00,
            maxRange: 20.00,
        },
    },
    /*********************/
    /*Elastic Deformation*/
    {
        ionRangeId: 12,
        ionRangeName: "Alpha",
        actualRangeVal: 15.07,
        ionRangeLimit: {
            minRange: 0.10,
            maxRange: 50.00,
        },
    },
    {
        ionRangeId: 13,
        ionRangeName: "Alpha",
        actualRangeVal: 35.03,
        ionRangeLimit: {
            minRange: 0.10,
            maxRange: 50.00,
        },
    },
    {
        ionRangeId: 14,
        ionRangeName: "Sigma",
        actualRangeVal: 1.57,
        ionRangeLimit: {
            minRange: 0.10,
            maxRange: 4.95,
        }
    }
];