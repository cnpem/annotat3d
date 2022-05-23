import React from "react";
import {MenuItem} from "../MenuItems";
import {layersOutline, layersSharp} from "ionicons/icons";
import {IonAccordion, IonIcon, IonItem, IonLabel, IonList} from "@ionic/react";
import FileLoadDeepDialog from "./FileLoadDeepDialog";

/**
 * Deep Learning component menu
 */
const DeepLearning: React.FC = () => {
    /**
     * component items
     */
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
                {/*Workspace menu*/}
                <FileLoadDeepDialog header={items.subItems[0]}/>

                {/*Network menu*/}
                <FileLoadDeepDialog header={items.subItems[2]}/>
                {/*Batch Inference menu*/}
                <FileLoadDeepDialog header={items.subItems[3]}/>
            </IonList>
        </IonAccordion>
    );
};

export default DeepLearning;