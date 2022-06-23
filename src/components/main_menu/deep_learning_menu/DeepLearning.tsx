import React from "react";
import {MenuItem} from "../MenuItems";
import {layersOutline, layersSharp} from "ionicons/icons";
import {IonAccordion, IonIcon, IonItem, IonLabel, IonList} from "@ionic/react";
import WorkspaceComp from "./workspace_comp/WorkspaceComp";
import DatasetDialog from "./dataset_compo/DatasetDialog";
import NetworkComp from "./network_comp/NetworkComp";

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
                <WorkspaceComp/>

                {/*Dataset menu*/}
                <DatasetDialog/>

                {/*Network menu*/}
                <NetworkComp/>
                {/*Batch Inference menu*/}
            </IonList>
        </IonAccordion>
    );
};

export default DeepLearning;