import React, {useState} from "react";
import {IonButton, IonIcon, IonInput, IonItem, IonTitle} from "@ionic/react";

/*Icon import*/
import {eyeOutline} from "ionicons/icons";

/**
 * React module that create the sub-windows with a dynamic placeholder
 * @param args a object that contains a number with the value of the placeholder and the tile string box
 * @todo i need to make numberVal change in this function
 * @constructor
 * @return returns the React file to create the site /inbox
 */
const SlicesSubMenu: React.FC<{numberVal: number; titleName: string}> = (args) => {

    const [_, setNumber] = useState<number>();

    return (
        <React.Fragment>
            <IonTitle>{args.titleName!}</IonTitle>
            <IonItem>
                <IonInput type={"number"} value={args.numberVal!} placeholder={"0"} onIonChange={e => setNumber(parseInt(e.detail.value!, 10))}/>

                <IonButton>
                    <IonIcon icon={eyeOutline}/>
                </IonButton>
            </IonItem>
        </React.Fragment>
    );
};

export default SlicesSubMenu;