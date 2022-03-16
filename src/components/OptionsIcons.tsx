import React from "react";
import {IonButton, IonButtons, IonIcon} from "@ionic/react";

/*Icons import*/
import {ellipsisHorizontalOutline, colorPaletteOutline, pencilOutline, closeOutline} from "ionicons/icons";

/*Interfaces import*/
import {OptionsIconsInterface} from "./TypeScriptFiles/Interfaces/OptionsIconsInterface";

/**
 * Component that creates the buttons in the table label
 * @todo i need to implement the edit name and color
 * @constructor
 */
const OptionsIcons: React.FC<OptionsIconsInterface> = (args) => {

    const removeTheListElement = () => {
        args.onRemoveLabel(args.removeId);
    }

    return(
        <IonButtons>
            <IonButton>
                <IonIcon icon={ellipsisHorizontalOutline}/>
            </IonButton>

            <IonButton>
                <IonIcon icon={pencilOutline}/>
            </IonButton>

            <IonButton>
                <IonIcon icon={colorPaletteOutline}/>
            </IonButton>

            <IonButton onClick={removeTheListElement}>
                <IonIcon icon={closeOutline}/>
            </IonButton>
        </IonButtons>
    );

};

export default OptionsIcons;