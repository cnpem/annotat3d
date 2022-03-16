import React from "react";
import {IonButton, IonButtons, IonIcon} from "@ionic/react";
import {ToolbarCompLabel} from "./TypeScriptFiles/Interfaces/LabelsInterface";

/*Icons import*/
import {addOutline, trashOutline} from "ionicons/icons";

/**
 * This component creates the option for add any label in the label section
 * @todo The add Button is now working. I need to customize better the name for each label
 * @todo i need to create a function that deletes all elements of a vector
 * @param args a list that contains the toolbar components
 * @constructor
 * @return This function returns the a window for the user add a label name and color a vector with this new label
 */
const InputLabel: React.FC<ToolbarCompLabel> = (args) => {

    const addNewLabel = () => {
        args.onLabelList({color: "red", labelName: "label " + (args.labelList.length + 1), id: args.idGenerator});
        args.onIdGenerator(args.idGenerator);
    }

    const removeAllLabels = () => {
        const n = args.labelList.splice(0, args.labelList.length);
        console.log(n);
    }

    return(
        <IonButtons>
            <IonButton className={"ion-text-right"} onClick={addNewLabel}>
                <IonIcon icon={addOutline}/>
            </IonButton>

            <IonButton className={"ion-text-right"} slot={"end"} onClick={removeAllLabels}>
                <IonIcon icon={trashOutline} slot={"end"}/>
                Delete all labels
            </IonButton>
        </IonButtons>
    );
};

export default InputLabel;