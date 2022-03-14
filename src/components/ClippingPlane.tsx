import React, {useState} from "react";
import {
    IonIcon, IonInput, IonItem,
    IonSelect, IonSelectOption, IonTitle,
    IonItemDivider, IonButton, IonCol, IonRow
} from "@ionic/react";

/*Icons import*/
import {lockClosed} from "ionicons/icons";
import {eyeOutline} from "ionicons/icons";
import {contrastOutline} from "ionicons/icons";

/**
 * @todo i need this function need to get
 * @todo need to remove the option "Your Selection"
 * @param args
 * @constructor
 */
const ClippingPlane: React.FC<{numberVal: number; titleName: string}> = (args) => {

    const [_, setNumber] = useState<number>();
    const [presentVal, setPresentVal] = useState<string>("Original");
    const [sliceAxis, setSliceAxis] = useState<string>("XY");

    return(
        <React.Fragment>
            <IonTitle>{args.titleName!}</IonTitle>
            <IonItem>
                <IonInput type={"number"} value={args.numberVal!} placeholder={"0"} onIonChange={e => setNumber(parseInt(e.detail.value!, 10))}/>

                <IonButton>
                    <IonIcon icon={lockClosed}/>
                </IonButton>

                <IonButton>
                    <IonIcon icon={eyeOutline}/>
                </IonButton>

            </IonItem>

            <IonRow>
                <IonCol>
                    <IonSelect value={sliceAxis} okText="Okay" placeholder={"XY"} cancelText="Cancel" onIonChange={e => setSliceAxis(e.detail.value)}>
                        <IonSelectOption value="XY">XY</IonSelectOption>
                        <IonSelectOption value="XZ">XZ</IonSelectOption>
                        <IonSelectOption value="YZ">YZ</IonSelectOption>
                        <IonSelectOption value="Plane">Plane</IonSelectOption>
                    </IonSelect>
                </IonCol>

                <IonCol>
                    <IonSelect value={presentVal} okText="Okay" placeholder={"Original"} cancelText="Cancel" onIonChange={e => setPresentVal(e.detail.value)}>
                        <IonSelectOption value="Original">Original</IonSelectOption>
                    </IonSelect>
                </IonCol>

                <IonCol>
                    <IonButton>
                        <IonIcon icon={contrastOutline}/>
                    </IonButton>
                </IonCol>
            </IonRow>

            <IonItemDivider>Your Selections</IonItemDivider>
            <IonItem>Slice selected : {sliceAxis}</IonItem>
            <IonItem>Present Value : {presentVal}</IonItem>
        </React.Fragment>
    );

};

export default ClippingPlane;