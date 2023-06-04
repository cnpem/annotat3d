import dataType from '../../file/utils/Dtypes';

/**
 * This script contains all the interfaces for dataset_comp directory

 /**
 * Interface for Augmentation option
 */
export interface IonRangeElement {
    ionRangeId: number;
    ionNameMenu: string;
    ionRangeName: string;
    actualRangeVal: {
        lower: number;
        upper: number;
    };
    ionRangeLimit: {
        minRange: number;
        maxRange: number;
    };
}

export interface AugmentationInterface {
    checkedId: number;
    augmentationOption: string;
    isChecked: boolean;
}

/**
 * Initial state for Augmentation options
 */
export const InitAugmentationOptions: AugmentationInterface[] = [
    {
        augmentationOption: 'vertical-flip',
        isChecked: true,
        checkedId: 0,
    },
    {
        augmentationOption: 'horizontal-flip',
        isChecked: true,
        checkedId: 1,
    },
    {
        augmentationOption: 'rotate-90-degrees',
        isChecked: true,
        checkedId: 2,
    },
    {
        augmentationOption: 'rotate-less-90-degrees',
        isChecked: true,
        checkedId: 3,
    },
    {
        augmentationOption: 'contrast',
        isChecked: true,
        checkedId: 4,
    },
    {
        augmentationOption: 'linear-contrast',
        isChecked: true,
        checkedId: 5,
    },
    {
        augmentationOption: 'dropout',
        isChecked: true,
        checkedId: 6,
    },
    {
        augmentationOption: 'gaussian-blur',
        isChecked: true,
        checkedId: 7,
    },
    {
        augmentationOption: 'average-blur',
        isChecked: true,
        checkedId: 8,
    },
    {
        augmentationOption: 'additive-poisson-noise',
        isChecked: true,
        checkedId: 9,
    },
    {
        augmentationOption: 'elastic-deformation',
        isChecked: true,
        checkedId: 10,
    },
];

export const InitIonRangeVec: IonRangeElement[] = [
    /*Contrast Menu*/
    {
        ionRangeId: 0,
        ionNameMenu: 'Contrast',
        ionRangeName: 'Gamma',
        actualRangeVal: {
            lower: 0.95,
            upper: 1.55,
        },
        ionRangeLimit: {
            minRange: 0.5,
            maxRange: 2.0,
        },
    },
    /*********************/
    /*Linear Contrast menu*/
    {
        ionRangeId: 1,
        ionNameMenu: 'Linear Contrast',
        ionRangeName: 'Gamma',
        actualRangeVal: {
            lower: 0.76,
            upper: 1.24,
        },
        ionRangeLimit: {
            minRange: 0.4,
            maxRange: 1.6,
        },
    },
    /*********************/
    /*Dropout menu*/
    {
        ionRangeId: 2,
        ionNameMenu: 'Dropout',
        ionRangeName: 'Gamma',
        actualRangeVal: {
            lower: 0.06,
            upper: 0.14,
        },
        ionRangeLimit: {
            minRange: 0.0,
            maxRange: 0.2,
        },
    },
    /*********************/
    /*Gaussian Blur*/
    {
        ionRangeId: 3,
        ionNameMenu: 'Gaussian Blur',
        ionRangeName: 'Sigma',
        actualRangeVal: {
            lower: 0.97,
            upper: 2.13,
        },
        ionRangeLimit: {
            minRange: 0.01,
            maxRange: 3.0,
        },
    },
    /*********************/
    /*Average Blur*/
    {
        ionRangeId: 4,
        ionNameMenu: 'Average Blur',
        ionRangeName: 'K',
        actualRangeVal: {
            lower: 4.3,
            upper: 8.7,
        },
        ionRangeLimit: {
            minRange: 1.0,
            maxRange: 12.0,
        },
    },
    /*********************/
    /*Additive Poisson Noise*/
    {
        ionRangeId: 5,
        ionNameMenu: 'Additive Poisson Noise',
        ionRangeName: 'Scale',
        actualRangeVal: {
            lower: 6.0,
            upper: 14.0,
        },
        ionRangeLimit: {
            minRange: 0.0,
            maxRange: 20.0,
        },
    },
    /*********************/
    /*Elastic Deformation*/
    {
        ionRangeId: 6,
        ionNameMenu: 'Elastic Deformation',
        ionRangeName: 'Alpha',
        actualRangeVal: {
            lower: 15.07,
            upper: 35.03,
        },
        ionRangeLimit: {
            minRange: 0.1,
            maxRange: 50.0,
        },
    },
    {
        ionRangeId: 7,
        ionNameMenu: 'Elastic Deformation',
        ionRangeName: 'Sigma',
        actualRangeVal: {
            lower: 1.57,
            upper: 3.53,
        },
        ionRangeLimit: {
            minRange: 0.1,
            maxRange: 4.95,
        },
    },
];

/**
 * Interfaces used on SamplingComp.tsx
 */

export type type_operation = 'Data' | 'Label' | 'Weight';

/**
 * dtypes array
 */
export const dtypeList: dataType[] = [
    {
        value: 'uint8',
        label: '8-bit',
    },
    {
        value: 'int16',
        label: '16-bit Signed',
    },
    {
        value: 'uint16',
        label: '16-bit Unsigned',
    },
    {
        value: 'int32',
        label: '32-bit Signed',
    },
    {
        value: 'uint32',
        label: '32-bit Unsigned',
    },
    {
        value: 'int64',
        label: '64-bit Signed',
    },
    {
        value: 'uint64',
        label: '64-bit Unsigned',
    },
    {
        value: 'float32',
        label: '32-bit Float',
    },
    {
        value: 'float64',
        label: '64-bit Float',
    },
    {
        value: 'complex64',
        label: '64-bit Complex',
    },
];

export type dtype_type =
    | 'uint8'
    | 'int16'
    | 'uint16'
    | 'int32'
    | 'uint32'
    | 'int64'
    | 'uint64'
    | 'float32'
    | 'float64'
    | 'complex64';

/**
 * Build-in interface for Element of data and weight table
 */
export interface TableElement {
    fileName: string;
    shape: Array<number>;
    type: dtype_type;
    scan: string;
    time: number;
    size: number;
    filePath: string;
}

export const InitFileStatus: TableElement = {
    fileName: '',
    shape: new Array(3),
    type: 'uint16',
    scan: '',
    time: 0,
    size: 0,
    filePath: '',
};

/**
 * Element of the vector DataAndWeiTable[]
 */
export interface TableInterface {
    id: number;
    typeOperation: type_operation;
    element: TableElement;
}

export const InitTables: TableInterface[] = [];

/**
 * Interface used for Sampling
 */
export interface SamplingInterface {
    nClasses: number;
    sampleSize: number;
    patchSize: Array<number>;
}
