/**
 * This script contains the Input interface
 */
import {LabelProp} from "./LabelsInterface";

export interface InputLabelInterface{
    labelList: LabelProp[]; onLabelList: (labelVec: LabelProp[]) => void;
    idGenerator: number; onIdGenerator: (id: number) => void;
}