import React from "react";
import {IonButton, IonButtons, IonIcon} from "@ionic/react";
import { LabelInterface } from "./TypeScriptFiles/Interfaces/LabelsInterface";

/*Icons import*/
import {addOutline, trashOutline} from "ionicons/icons";

interface InputLabelProps {
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
        const newColor: [number, number, number] = [
            Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255)
        ];
        const newLabel = {
            labelName: "Label " + props.newLabelId,
            color: newColor,
            id: props.newLabelId
        }; // The background color is pink
        props.onLabelList([...props.labelList, newLabel]);
        props.onNewLabelId(props.newLabelId);
    }

    const removeAllLabels = () => {
        const newVec = props.labelList.filter(lab => lab.labelName === "Background");
        props.onLabelList(newVec);
        props.onNewLabelId(0); // This value resets the id generator
    }

    return(
        <IonButtons>
            <IonButton onClick={addNewLabel}>
                <IonIcon icon={addOutline} slot={"end"}/>
                Add a label
            </IonButton>

            <IonButton  slot={"end"} onClick={removeAllLabels}>
                <IonIcon icon={trashOutline} slot={"end"}/>
                Delete all labels
            </IonButton>
        </IonButtons>
    );
};

export default InputLabel;
