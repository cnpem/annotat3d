import React from "react";
import {IonButton, IonIcon, IonInput, IonItem, IonTitle} from "@ionic/react";

/*Icon import*/
import {eyeOutline} from "ionicons/icons";
import {SliceSubMenuInterface} from "./TypeScriptFiles/Interfaces/SliceSubMenuInterface";

/**
 * React module that create the sub-windows with a dynamic placeholder
 * @param args a object that contains a number with the value of the placeholder and the tile string box
 * @todo i'll change this window to stay equal to Sarmento's annotat3d
 * @constructor
 * @return returns the React file to create the site /inbox
 */
const SlicesSubMenu: React.FC<SliceSubMenuInterface> = (args) => {

    const inputNumberVal = (event: CustomEvent) => {
        args.onNumberVal(parseInt(event.detail.value!));
    }

    return (
        <React.Fragment>
            <IonTitle>{args.titleName!}</IonTitle>
            <IonItem>
                <IonInput type={"number"} value={args.numberVal!} placeholder={"0"} onIonChange={inputNumberVal}/>
            </IonItem>
        </React.Fragment>
    );
};

export default SlicesSubMenu;