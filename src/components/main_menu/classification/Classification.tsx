import React from "react";
import {MenuItem} from "../MenuItems";
import {extensionPuzzleOutline, extensionPuzzleSharp} from "ionicons/icons";
import {IonAccordion, IonIcon, IonItem, IonLabel, IonList} from "@ionic/react";

/**
 * Classification component
 * @constructor
 */
const Classification: React.FC = () => {
    /**
     * menu items
     */
    const items: MenuItem = {
        title: 'Classification',
        subItems: [
            'New Classifier',
            'Load Classifier',
            'Save Classifier'
        ],
        iosIcon: extensionPuzzleOutline,
        mdIcon: extensionPuzzleSharp
    };
    return (
        <IonAccordion>
            <IonItem slot={"header"}>
                <IonIcon slot={"start"} ios={items.iosIcon} md={items.mdIcon}/>
                <IonLabel>{items.title}</IonLabel>
            </IonItem>
            <IonList slot={"content"}>
                <IonItem button>{items.subItems[0]}</IonItem>
                <IonItem button>{items.subItems[1]}</IonItem>
                <IonItem button>{items.subItems[2]}</IonItem>
            </IonList>
        </IonAccordion>
    );
};

export default Classification;
