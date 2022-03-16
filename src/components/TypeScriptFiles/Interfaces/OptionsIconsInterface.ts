/**
 * Interface component for OptionsIconsMenu
 */

import {LabelProp} from "./LabelsInterface";

export interface OptionsIconsInterface{
    labelList: LabelProp[]; onRemoveLabel: (labelId: number) => void;
    removeId: number;
}