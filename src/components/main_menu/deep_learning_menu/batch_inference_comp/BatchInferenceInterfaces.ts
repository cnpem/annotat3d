import {TableElement} from "../dataset_comp/DatasetInterfaces";

/**
 * Interface used for add files in the table
 */
export interface MultiplesPath {
    id: number,
    workspacePath: string,
    file: TableElement,
}

/**
 * Interface used for the Patches in Settings.tsx
 */
export interface PatchesInterface {
    volumePadding: Array<number>,
    patchBolder: Array<number>,
}

/**
 * Initial state for the Patches in Inference.tsx component
 */
export const initialPatches: PatchesInterface = {
    volumePadding: [0, 0, 0],
    patchBolder: [0, 0, 0],
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

/**
 * Interface for CUDADevice in Settings.tsx
 */
export interface CudaDeviceGPU {
    key: number,
    value: string,
    label: string,
    isDisabled: boolean,
    isChecked: boolean,
}

export interface OutputInterface {
    workspacePath: string,
    filePath: string,
    probabilityMap: boolean,
    label: boolean,
    outputBits: dtype_pm,
}

/**
 * Export dtype for pm
 */
export type dtype_pm = "16-bits" | "32-bits";

/**
 * Export gpu type for Settings menu.
 */
export type gpu_partition = "1-gpu" | "2-gpu" | "4-gpu";

/**
 * Interface for the component output used in InterfaceComp.tsx
 */
export const initialOutput: OutputInterface = {
    workspacePath: "",
    filePath: "",
    probabilityMap: false,
    label: false,
    outputBits: "16-bits",
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