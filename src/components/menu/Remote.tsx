import React from "react";
import {MenuItem} from "./MenuItems";
import {paperPlaneOutline, paperPlaneSharp} from "ionicons/icons";
import {IonAccordion, IonIcon, IonItem, IonLabel, IonList} from "@ionic/react";

/**
 * Remote visualization component
 * @constructor
 */
const Remote: React.FC = () => {
    /**
     * Items of Remote Accordion
     */
    const items: MenuItem = {
        title: 'Remote Visualization',
        subItems: [
            'To IndeX \u00AE'
        ],
        iosIcon: paperPlaneOutline,
        mdIcon: paperPlaneSharp
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

export default Remote;