import {TableElement} from "../dataset_comp/DatasetInterfaces";

/**
 * Interface used for add files in the table
 */
export interface MultiplesPath {
    id: number,
    workspacePath: string,
    file: TableElement,
}