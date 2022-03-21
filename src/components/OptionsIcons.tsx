import React from "react";
import {IonButton, IonButtons, IonIcon} from "@ionic/react";

/*Icons import*/
import {closeOutline} from "ionicons/icons";

/*Interfaces import*/
import {OptionsIconsInterface} from "./TypeScriptFiles/Interfaces/OptionsIconsInterface";

/**
 * Component that creates the buttons in the table label
 * @todo i need to implement the edit name
 * @todo i need to implement the draw label option. Prob i'll need to ask help for Peixinho or Matheus
 * @todo i need to implement a radius option for the brush
 * @constructor
 */
const OptionsIcons: React.FC<OptionsIconsInterface> = (args) => {

    const removeTheListElement = () => {
        const removeLabel = args.labelList.filter(label => args.removeId !== label.id)
        console.log("labelId : ", args.removeId);
        args.onRemoveLabel(removeLabel);

        if(removeLabel.length == 0) {

            args.onIdGenerator(-1);

        }

    }

    return(
        <IonButtons>
            <IonButton onClick={removeTheListElement}>
                <IonIcon icon={closeOutline}/>
            </IonButton>
        </IonButtons>
    );

};

export default OptionsIcons;