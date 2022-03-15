import React from "react";
import {IonButton, IonIcon, IonInput, IonItem, IonTitle} from "@ionic/react";

/*Icon import*/
import {eyeOutline} from "ionicons/icons";

interface ToolbarComp{
    numberVal: number; onNumberVal: (val: number) => void;
    titleName: string;
}

/**
 * React module that create the sub-windows with a dynamic placeholder
 * @param args a object that contains a number with the value of the placeholder and the tile string box
 * @todo i need to implement the button action
 * @constructor
 * @return returns the React file to create the site /inbox
 */
const SlicesSubMenu: React.FC<ToolbarComp> = (args) => {

    const inputNumberVal = (event: CustomEvent) => {
        args.onNumberVal(parseInt(event.detail.value!));
    }

    return (
        <React.Fragment>
            <IonTitle>{args.titleName!}</IonTitle>
            <IonItem>
                <IonInput type={"number"} value={args.numberVal!} placeholder={"0"} onIonChange={inputNumberVal}/>

                <IonButton>
                    <IonIcon icon={eyeOutline}/>
                </IonButton>
            </IonItem>
        </React.Fragment>
    );
};

export default SlicesSubMenu;