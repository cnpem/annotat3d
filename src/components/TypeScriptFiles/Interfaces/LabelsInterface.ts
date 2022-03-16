/**
 * This script contains all the labels interfaces calls
 */

/**
 * Child component for the ToolbarComp
 */
export interface LabelProp{
    id: number;
    color: string;
    labelName: string;
}

/**
 * Interface component with the respective variable and setter
 */
export interface ToolbarCompLabel{
    labelList: LabelProp[]; onLabelList: (labelElement: LabelProp) => void; onRemoveLabel: (labelId: number) => void;
    idGenerator: number; onIdGenerator: (id: number) => void;
}