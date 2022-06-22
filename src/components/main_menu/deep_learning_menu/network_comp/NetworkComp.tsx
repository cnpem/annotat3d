import React, {Fragment} from "react";
import {IonButton, IonContent, IonItem, IonLabel, IonList, IonPopover} from "@ionic/react";

/**
 * This component is just a test to see if I can create a nested popover
 * TODO : Need to change this component later
 * @constructor
 */
const NetworkComp: React.FC = () => {
    return (
        <Fragment>
            <IonButton id="nested-button">Click to open popover</IonButton>
            <IonPopover trigger="nested-button" dismissOnSelect={false}>
                <IonContent>
                    <IonList>
                        <IonItem button={true} detail={false}>
                            <IonLabel>Option 1</IonLabel>
                        </IonItem>
                        <IonItem button={true} detail={false}>
                            <IonLabel>Option 2</IonLabel>
                        </IonItem>
                        <IonItem button={true} detail={true} id="nested-trigger">
                            <IonLabel>Option 3</IonLabel>
                        </IonItem>
                    </IonList>
                </IonContent>
                <IonPopover trigger="nested-trigger" dismissOnSelect={true} side="end">
                    <IonContent>
                        <IonItem button={true}>
                            <IonLabel>Nested Option</IonLabel>
                        </IonItem>
                    </IonContent>
                </IonPopover>
            </IonPopover>
        </Fragment>
    );
}

export default NetworkComp