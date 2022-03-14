import React from "react";
import {MenuItem} from "./MenuItems";
import {extensionPuzzleOutline, extensionPuzzleSharp} from "ionicons/icons";
import {IonAccordion, IonIcon, IonItem, IonLabel, IonList} from "@ionic/react";

const Classification: React.FC = () => {
    const items: MenuItem = {
        title: 'Classification',
        subItems: [
            'Load Classifier',
            'Save Classifier',
            'Load Annotation',
            'Save Annotation'
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
                {items.subItems.map((subItem) => {
                    return (
                        <IonItem button>{subItem}</IonItem>
                    );
                })}
            </IonList>
        </IonAccordion>
    );
};

export default Classification;