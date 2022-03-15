import React from "react";
import {IonButton, IonModal, IonContent} from "@ionic/react";

/**
 * Child component for the ToobarComp
 */
interface LabelProp{
    color: string;
    labelName: string;
}

/**
 * Interface component with the respective variable and setter
 */
interface ToolbarComp{
    labelList: LabelProp[]; onLabelList: (labelElement: LabelProp) => void;
}

/**
 * This component creates the option for add any label in the label section
 * @todo i need to finish this implementation
 * @param args a list that contains the toolbar components
 * @constructor
 * @return This function returns the a window for the user add a label name and color a vector with this new label
 */
const InputLabel: React.FC<ToolbarComp> = (args) => {
    return(
        <React.Fragment>
            <IonButton className={"ion-text-right"} id={"trigger-button"}/>
            <IonModal trigger={"trigger-button"}>
                <IonContent>dadad</IonContent>
            </IonModal>
        </React.Fragment>
    );
};

export default InputLabel;