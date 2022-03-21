import React from "react";
import {IonButton, IonButtons, IonIcon} from "@ionic/react";

/*Icons import*/
import {closeOutline} from "ionicons/icons";

/*Interfaces import*/
import {OptionsIconsInterface} from "./TypeScriptFiles/Interfaces/OptionsIconsInterface";

/**
 * Component that creates the buttons in the table label
 * @todo i need to implement the edit name
 * @todo i need to implement a option to change the color
 * @constructor
 */
const OptionsIcons: React.FC<OptionsIconsInterface> = (args) => {

    const removeTheListElement = () => {
        const removeLabel = args.labelList.filter(label => args.removeId !== label.id);
        args.onRemoveLabel(removeLabel);

        if(removeLabel.length == 0) {

            args.onIdGenerator(0);

        }

    }

    if(args.removeId !== 0)
    {

        return(
            <IonButtons>
                <IonButton onClick={removeTheListElement}>
                    <IonIcon icon={closeOutline}/>
                </IonButton>
            </IonButtons>
        );

    }

    return(
        <></>
    )

};

export default OptionsIcons;