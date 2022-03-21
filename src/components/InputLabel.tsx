import React from "react";
import {IonButton, IonButtons, IonIcon} from "@ionic/react";
import {InputLabelInterface} from "./TypeScriptFiles/Interfaces/InputLabelInterface";

/*Icons import*/
import {addOutline, trashOutline} from "ionicons/icons";

/**
 * This component creates the option for add any label in the label section
 * @param args a list that contains the toolbar components
 * @constructor
 * @return This function returns a window for the user add a label name and color a vector with this new label
 */
const InputLabel: React.FC<InputLabelInterface> = (args) => {

    const addNewLabel = () => {
        const newColor = String(Math.floor(Math.random() * 255)) + "," + String(Math.floor(Math.random() * 255)) + "," + String(Math.floor(Math.random() * 255));
        const newLabel = (args.idGenerator > 0) ? { labelName: "label " + args.idGenerator, color: newColor, id: args.idGenerator} : { labelName: "background", color: "229,16,249", id: args.idGenerator}; // The background color is pink
        args.onLabelList([...args.labelList, newLabel]);
        args.onIdGenerator(args.idGenerator);
    }

    const removeAllLabels = () => {
        const newVec = args.labelList.filter(lab => lab.labelName === "");
        args.onLabelList(newVec);
        args.onIdGenerator(-1); // This value resets the id generator
    }

    return(
        <IonButtons>
            <IonButton className={"ion-text-right"} onClick={addNewLabel}>
                <IonIcon icon={addOutline} slot={"end"}/>
                Add a label
            </IonButton>

            <IonButton className={"ion-text-right"} slot={"end"} onClick={removeAllLabels}>
                <IonIcon icon={trashOutline} slot={"end"}/>
                Delete all labels
            </IonButton>
        </IonButtons>
    );
};

export default InputLabel;