import React from "react";
import {InputMenuInterface} from "./TypeScriptFiles/Interfaces/InputMenuInterface";
import {IonLabel, IonSegment, IonSegmentButton} from "@ionic/react";

const InputMenu: React.FC<InputMenuInterface> = (args) => {

    const inputChangeHandler = (e: CustomEvent) => {
        args.onSelectVal(e.detail!.value!);
    }

    return(
        <IonSegment value={args.selectVal} onIonChange={inputChangeHandler}>
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