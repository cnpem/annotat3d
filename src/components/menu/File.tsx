import React from "react";
import {MenuItem} from "./MenuItems";
import {documentOutline, documentSharp} from "ionicons/icons";
import {IonAccordion, IonIcon, IonItem, IonLabel, IonList} from "@ionic/react";

const File: React.FC = () => {
    const items: MenuItem = {
        title: 'File',
        subItems: [
            'Load Image',
            'Save Image'
        ],
        iosIcon: documentOutline,
        mdIcon: documentSharp
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

export default File;