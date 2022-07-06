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
 * Export machine type
 */
export type type_machine = "local" | "tepui";

/**
 * Export network type
 */
export type type_network = "u-net-2d" | "u-net-3d" | "v-net";

/**
 * Export dtype for pm
 */
export type dtype_pm = "16 bits" | "32 bits";

/**
 * Interface for the component output used in InterfaceComp.tsx
 */
export const initialOutput: OutputInterface = {
    workspacePath: "",
    filePath: "",
    probabilityMap: false,
    label: false,
    outputBits: "16 bits",
}

/**
 * Initial state for machine type in Settings.tsx
 */
export const typeMachine: SelectInterface[] = [
    {
        key: 0,
        value: "local",
        label: "Local",
    },
    {
        key: 1,
        value: "tepui",
        label: "Tepui",
    }
];

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
 * Type of CUDA devices used in Settings.tsx
 */
export const typeCUDADevices: CudaDeviceGPU[] = [
    {
        key: 0,
        value: "gpu-0",
        label: "GPU 0",
        isDisabled: false,
        isChecked: true,
    },
    {
        key: 1,
        value: "gpu-1",
        label: "GPU 1",
        isDisabled: true,
        isChecked: false,
    },
    {
        key: 2,
        value: "gpu-2",
        label: "GPU 2",
        isDisabled: true,
        isChecked: false,
    },
    {
        key: 3,
        value: "gpu-3",
        label: "GPU 3",
        isDisabled: true,
        isChecked: false,
    },
    {
        key: 4,
        value: "gpu-4",
        label: "GPU 4",
        isDisabled: true,
        isChecked: false,
    },
    {
        key: 5,
        value: "gpu-5",
        label: "GPU 5",
        isDisabled: true,
        isChecked: false,
    },
    {
        key: 6,
        value: "gpu-6",
        label: "GPU 6",
        isDisabled: true,
        isChecked: false,
    },
    {
        key: 7,
        value: "gpu-7",
        label: "GPU 7",
        isDisabled: true,
        isChecked: false,
    }
];

/**
 * Type of networks used in InferenceComp.tsx
 */
export const typeNetworks: SelectInterface[] = [
    {
        key: 0,
        value: "u-net-2d",
        label: "U-Net 2D",
    },
    {
        key: 1,
        value: "u-net-3d",
        label: "U-Net 3D",
    },
    {
        key: 2,
        value: "v-net",
        label: "V-Net",
    },
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