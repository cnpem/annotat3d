import React from "react";
import {documentOutline, documentSharp} from "ionicons/icons";
import {IonAccordion, IonIcon, IonItem, IonLabel, IonList} from "@ionic/react";

import {MenuItem} from "./MenuItems";
import FileDialog from "./FileDialog";

/**
 * File I/O component
 * @constructor
 */
const File: React.FC = () => {
    /**
     * file items
     */
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
                        <>
                        {/*<IonItem button>{subItem}</IonItem>*/}
                        <FileDialog name={subItem}></FileDialog>
                        </>
                    );
                })}
            </IonList>
        </IonAccordion>
    );
};

export default File;