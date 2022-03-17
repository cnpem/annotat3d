import React, {useState} from "react";
import {
    IonButton, IonButtons,
    IonCol, IonIcon,
    IonRow,
} from "@ionic/react";

/*Icons import*/
import {pencilOutline, closeOutline, text} from "ionicons/icons";

/*Interfaces import*/
import {OptionsIconsInterface} from "./TypeScriptFiles/Interfaces/OptionsIconsInterface";

/**
 * Component that creates the buttons in the table label
 * @todo i need to implement the edit name
 * @constructor
 */
const OptionsIcons: React.FC<OptionsIconsInterface> = (args) => {

    const [labelNameInput, setLabelNameInput] = useState<string>("");

    const selectLabelNameInput = () => {
        setLabelNameInput(labelNameInput);
    }

    const removeTheListElement = () => {
        const removeLabel = args.labelList.filter(label => args.removeId !== label.id)
        console.log("labelId : ", args.removeId);
        args.onRemoveLabel(removeLabel);

        if(removeLabel.length == 0)
        {

            args.onIdGenerator(-1);

        }

    }

    const updateLabelName = () => {

        return(
            <IonRow>
                <IonCol>

                </IonCol>
            </IonRow>
        );
    }

    return(
        <IonButtons>
            <IonButton onClick={updateLabelName}>
                <IonIcon icon={pencilOutline}/>
            </IonButton>

            <IonButton onClick={removeTheListElement}>
                <IonIcon icon={closeOutline}/>
            </IonButton>
        </IonButtons>
    );

};

export default OptionsIcons;