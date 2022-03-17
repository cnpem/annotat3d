import React from "react";
import {
    IonIcon, IonInput, IonItem,
    IonSelect, IonSelectOption, IonTitle,
    IonButton, IonCol, IonRow
} from "@ionic/react";

/*Icons import*/
import {lockClosed} from "ionicons/icons";
import {eyeOutline} from "ionicons/icons";
import {contrastOutline} from "ionicons/icons";
import {ClipplingPlaneInterface} from "./TypeScriptFiles/Interfaces/ClipplingPlaneInterface";

/**
 * Component that creates the Clipping Plane toolbar
 * @todo i'll remove this component, since this isn't important rn
 * @param args a list that contains the toolbar components
 * @constructor
 * @return This component returns the Clipping Plane toolbar
 */
const ClippingPlane: React.FC<ClipplingPlaneInterface> = (args) => {

    const inputNumberVal = (event: CustomEvent) => {
        args.onNumberVal(parseInt(event.detail.value!));
    }

    const inputSliceAxis = (event: CustomEvent) => {
        args.onSliceAxis(event.detail.value!);
    }

    const inputPresentVal = (e: CustomEvent) => {
        args.onPresentVal(e.detail.value!);
    }

    return(
        <React.Fragment>
            <IonTitle>{args.titleName!}</IonTitle>
            <IonItem>
                <IonInput type={"number"} value={args.numberVal!} placeholder={"0"} onIonChange={inputNumberVal}/>

                <IonButton>
                    <IonIcon icon={lockClosed}/>
                </IonButton>

                <IonButton>
                    <IonIcon icon={eyeOutline}/>
                </IonButton>

            </IonItem>

            <IonRow>
                <IonCol>
                    <IonSelect value={args.sliceAxis} placeholder={"XY"} interface={"popover"} onIonChange={inputSliceAxis}>
                        <IonSelectOption value="XY">XY</IonSelectOption>
                        <IonSelectOption value="XZ">XZ</IonSelectOption>
                        <IonSelectOption value="YZ">YZ</IonSelectOption>
                        <IonSelectOption value="Plane">Plane</IonSelectOption>
                    </IonSelect>
                </IonCol>

                <IonCol>
                    <IonSelect value={args.presentVal} placeholder={"Original"} interface={"popover"} onIonChange={inputPresentVal}>
                        <IonSelectOption value="Original">Original</IonSelectOption>
                    </IonSelect>
                </IonCol>

                <IonCol>
                    <IonButton>
                        <IonIcon icon={contrastOutline}/>
                    </IonButton>
                </IonCol>
            </IonRow>
        </React.Fragment>
    );

};

export default ClippingPlane;