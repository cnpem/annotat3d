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
    patchBolder: [0, 0, 0]
}

/**
 * Generic interface used to create the ion-select options
 */
export interface SelectInterface {
    key: number,
    value: string,
    label: string
}