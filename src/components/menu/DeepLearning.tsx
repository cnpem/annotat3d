import React from "react";
import {MenuItem} from "./MenuItems";
import {layersOutline, layersSharp} from "ionicons/icons";
import {IonAccordion, IonIcon, IonItem, IonLabel, IonList} from "@ionic/react";

const DeepLearning: React.FC = () => {
    const items: MenuItem = {
        title: 'Deep Learning',
        subItems: [
            'Workspace',
            'Dataset',
            'Network',
            'Batch Inference'
        ],
        iosIcon: layersOutline,
        mdIcon: layersSharp
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

export default DeepLearning;