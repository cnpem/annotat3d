/**
 * Generic interface used to create the ion-select options
 */
export interface SelectInterface {
    key: number,
    value: string,
    label: string,
}
/**
 * Standard interface for the payload of the event "workspace loaded"
 */
export interface WorkspaceLoadedPayloadInterface {
    workspaceFullPath: string,
    isDisabled: boolean, 
    gpus: SelectInterface[]
}