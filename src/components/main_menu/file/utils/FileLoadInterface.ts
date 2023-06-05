import DataType from './Dtypes';

/**
 * dtypes array
 */
export const dtypeList: DataType[] = [
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

/**
 * Macro for all dtypes
 */
export type DtypeType =
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
 * Macro for all images load/save operations
 */
export type ImgOperation = 'image' | 'superpixel' | 'label';

/**
 * Interface used for load/save menu to load the files
 */
export interface MultiplesPath {
    workspacePath: string;
    imagePath: string;
    superpixelPath: string;
    labelPath: string;
    annotPath: string;
    classificationPath: string;
}

/**
 * Interface used for load/save menu to show the queue of errors
 */
export interface QueueToast {
    message: string;
    isError: boolean;
}
