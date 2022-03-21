import React from "react";
import {IonButton, IonButtons, IonItem, IonItemDivider, IonTitle} from "@ionic/react";

/**
 * Module that create the Segmentation options
 * @todo i need to implement a real function for this buttons and pass a args for superpixels
 * @todo maybe i can place a icon on each button
 * @constructor
 */
const SegmentationButtons: React.FC = () => {

    return(
        <React.Fragment>
            <IonTitle>Segmentation Module</IonTitle>

            <IonButtons>
                <IonButton>Generate Superpixel</IonButton>

                <IonButton>Preview</IonButton>

                <IonButton>Apply</IonButton>
            </IonButtons>
        </React.Fragment>
    );

}

export default SegmentationButtons;