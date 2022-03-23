/**
 * This script contains the Input interface
 */
import {LabelInterface} from "./LabelsInterface";

export interface InputLabelInterface{
    labelList: LabelInterface[]; onLabelList: (labelVec: LabelInterface[]) => void;
    idGenerator: number; onIdGenerator: (id: number) => void;
}
