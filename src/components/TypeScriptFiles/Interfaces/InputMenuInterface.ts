/**
 * Interface for the module InputMenu
 */
export interface InputMenuInterface{
    selectVal: "Visualization" | "Annotation";
    onSelectVal: (val: "Visualization" | "Annotation") => void;
}