/**
 * This script contains all the interfaces for dataset_compo directory

 /**
 * Interface for Augmentation option
 */
export interface IonRangeElement {
    ionRangeId: number,
    ionNameMenu: string,
    ionRangeName: string,
    actualRangeVal: {
        lower: number,
        upper: number,
    }
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
        ionNameMenu: "Contrast",
        ionRangeName: "Gamma",
        actualRangeVal: {
            lower: 0.95,
            upper: 1.55,
        },
        ionRangeLimit: {
            minRange: 0.50,
            maxRange: 2.00,
        },
    },
    /*********************/
    /*Linear Contrast menu*/
    {
        ionRangeId: 1,
        ionNameMenu: "Linear Contrast",
        ionRangeName: "Gamma",
        actualRangeVal: {
            lower: 0.76,
            upper: 1.24,
        },
        ionRangeLimit: {
            minRange: 0.40,
            maxRange: 1.60,
        },
    },
    /*********************/
    /*Dropout menu*/
    {
        ionRangeId: 2,
        ionNameMenu: "Dropout",
        ionRangeName: "Gamma",
        actualRangeVal: {
            lower: 0.06,
            upper: 0.14,
        },
        ionRangeLimit: {
            minRange: 0.00,
            maxRange: 0.20,
        },
    },
    /*********************/
    /*Gaussian Blur*/
    {
        ionRangeId: 3,
        ionNameMenu: "Gaussian Blur",
        ionRangeName: "Sigma",
        actualRangeVal: {
            lower: 0.97,
            upper: 2.13,
        },
        ionRangeLimit: {
            minRange: 0.01,
            maxRange: 3.00,
        },
    },
    /*********************/
    /*Average Blur*/
    {
        ionRangeId: 4,
        ionNameMenu: "Average Blur",
        ionRangeName: "K",
        actualRangeVal: {
            lower: 4.30,
            upper: 8.70,
        },
        ionRangeLimit: {
            minRange: 1.00,
            maxRange: 12.00,
        },
    },
    /*********************/
    /*Additive Poisson Noise*/
    {
        ionRangeId: 5,
        ionNameMenu: "Additive Poisson Noise",
        ionRangeName: "Scale",
        actualRangeVal: {
            lower: 6.00,
            upper: 14.00,
        },
        ionRangeLimit: {
            minRange: 0.00,
            maxRange: 20.00,
        },
    },
    /*********************/
    /*Elastic Deformation*/
    {
        ionRangeId: 6,
        ionNameMenu: "Elastic Deformation",
        ionRangeName: "Alpha",
        actualRangeVal: {
            lower: 15.07,
            upper: 35.03,
        },
        ionRangeLimit: {
            minRange: 0.10,
            maxRange: 50.00,
        },
    },
    {
        ionRangeId: 7,
        ionNameMenu: "Elastic Deformation",
        ionRangeName: "Sigma",
        actualRangeVal: {
            lower: 1.57,
            upper: 3.53,
        },
        ionRangeLimit: {
            minRange: 0.10,
            maxRange: 4.95,
        }
    }
];

/**
 * Interfaces used on SamplingComp.tsx
 */

/**
 * Build-in interface for Element of data and weight table
 */
interface TableElement {
    file: string,
    shape: Array<number>,
    type: string,
    scan: string,
    time: number,
    size: number,
    fullPath: string
}

/**
 * Element of the vector DataAndWeiTable[]
 */
export interface TableInterface {
    id: number,
    element: TableElement,
}

export const InitTables: TableInterface[] = [{
    id: 0,
    element: {
        file: "",
        shape: [0, 0, 0],
        type: "",
        scan: "",
        time: 0,
        size: 0,
        fullPath: ""
    }
}]

