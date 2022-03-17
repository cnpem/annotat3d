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
export interface LabelTableInterface{
    labelList: LabelProp[]; onLabelList: (labelVec: LabelProp[]) => void;
}