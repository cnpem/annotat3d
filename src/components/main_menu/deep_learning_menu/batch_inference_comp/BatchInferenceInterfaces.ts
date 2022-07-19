/**
 * Dtype for files loaded into the input images
 */
export type dtype_type =
    "uint8"
    | "int16"
    | "uint16"
    | "int32"
    | "uint32"
    | "int64"
    | "uint64"
    | "float32"
    | "float64"
    | "complex64";

/**
 * Interface used for add files in the table
 */
export interface MultiplesPath {
    id: number,
    workspacePath: string,
    file: TableElement,
}

/**
 * Table row for loaded files in input Image
 */
interface TableElement {
    fileName: string,
    shape: Array<number>,
    type: dtype_type,
    scan: string,
    time: number,
    size: number,
    filePath: string
}

/**
 * Interface used for the Patches in Settings.tsx
 */
export interface PatchesInterface {
    volumePadding: Array<number>,
    patchBorder: Array<number>,
}

/**
 * Initial state for the Patches in Inference.tsx component
 */
export const initialPatches: PatchesInterface = {
    volumePadding: [0, 0, 0],
    patchBorder: [0, 0, 0],
}

/**
 * Generic interface used to create the ion-select options
 */
export interface SelectInterface {
    key: number,
    value: string,
    label: string,
}

/**
 * Interface for BatchInference in Settings.tsx
 */
export interface BatchInference {
    value: number,
    isDisabled: boolean,
}

export interface OutputInterface {
    outputPath: string,
    probabilityMap: boolean,
    label: boolean,
    outputBits: dtype_pm,
    outputExt: extension_file
}

/**
 * Export dtype for pm
 */
export type dtype_pm = "16-bits" | "32-bits";

/**
 * Export extension file to user save the output
 */
export type extension_file = ".raw" | ".tif";

/**
 * Export gpu type for Settings menu.
 */
export type gpu_partition = "1-gpu" | "2-gpu" | "4-gpu";

/**
 * Interface for the component output used in InterfaceComp.tsx
 */
export const initialOutput: OutputInterface = {
    outputPath: "",
    probabilityMap: false,
    label: false,
    outputBits: "16-bits",
    outputExt: ".raw"
}

/**
 * Partition type used in Settings.tsx
 */
export const typePartition: SelectInterface[] = [
    {
        key: 0,
        value: "1-gpu",
        label: "1 GPU",
    },
    {
        key: 1,
        value: "2-gpu",
        label: "2 GPU",
    },
    {
        key: 2,
        value: "4-gpu",
        label: "4 GPU",
    }
];

/**
 * Types of possible pm for the output
 */
export const typePM: SelectInterface[] = [
    {
        key: 0,
        value: "16-bits",
        label: "16 bits",
    },
    {
        key: 1,
        value: "32-bits",
        label: "32 bits",
    }
];

export const typeExt: SelectInterface[] = [
    {
        key: 0,
        value: ".raw",
        label: ".raw",
    },
    {
        key: 1,
        value: ".tif",
        label: ".tif",
    }
];