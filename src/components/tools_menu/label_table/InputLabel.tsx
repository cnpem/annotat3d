import React from "react";
import {IonButton, IonIcon} from "@ionic/react";
import { LabelInterface } from "./LabelInterface";
import {colorFromId} from '../../../utils/colormap';

/*Icons import*/
import {addOutline, trashOutline} from "ionicons/icons";

import './OptionsIcons.css';

interface InputLabelProps {
    colors: [number, number, number][];
    onLabelList: (labels: LabelInterface[]) => void;
    labelList: LabelInterface[];
    newLabelId: number;
    onNewLabelId: (id: number) => void;
}

/**
 * This component creates the option for add any label in the label section
 * @param props a list that contains the toolbar components
 * @constructor
 * @return This function returns a window for the user add a label name and color a vector with this new label
 */
const InputLabel: React.FC<InputLabelProps> = (props: InputLabelProps) => {

    const addNewLabel = () => {
        const newColor = colorFromId(props.colors, props.newLabelId); 
        const newLabel = {
            labelName: "Label " + props.newLabelId,
            color: newColor,
            id: props.newLabelId
        };
        props.onLabelList([...props.labelList, newLabel]);
        props.onNewLabelId(props.newLabelId);
    }

    const removeAllLabels = () => {
        const newVec = props.labelList.filter(lab => lab.id === 0);
        props.onLabelList(newVec);
        props.onNewLabelId(0); // This value resets the id generator
    }

    return(
        <div style={ {display: "flex", justifyContent: "flex-end"} }>
            <IonButton size="small" onClick={addNewLabel}>
                <IonIcon icon={addOutline} slot={"end"}/>
                Add
            </IonButton>

            <IonButton size="small" slot={"end"} onClick={removeAllLabels}>
                <IonIcon icon={trashOutline} slot={"end"}/>
                Delete all
            </IonButton>
        </div>
    );
};

export default InputLabel;
