/**
 * Interface component for OptionsIconsMenu
 */

import {LabelProp} from "./LabelsInterface";

export interface OptionsIconsInterface{
    labelList: LabelProp[]; onRemoveLabel: (labelElement: LabelProp[]) => void;
    onIdGenerator: (id: number) => void;
    removeId: number;
}