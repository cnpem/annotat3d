import React from "react";
import {IonLabel, IonSegment, IonSegmentButton} from "@ionic/react";

interface InputMenuInterface{
    selectedVal: "Visualization" | "Annotation";
    onSelectedVal: (val: "Visualization" | "Annotation") => void;
}

const InputMenu: React.FC<InputMenuInterface> = (props) => {

    const inputChangeHandler = (e: CustomEvent) => {
        props.onSelectedVal(e.detail.value);
    }

    return(
        <IonSegment value={props.selectedVal} onIonChange={inputChangeHandler}>
            <IonSegmentButton value={"Annotation"}>
                <IonLabel>Annotation</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value={"Visualization"}>
                <IonLabel>Visualization</IonLabel>
            </IonSegmentButton>
        </IonSegment>
    );

}

export default InputMenu;
