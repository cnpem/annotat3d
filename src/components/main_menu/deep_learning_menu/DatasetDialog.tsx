import React, {useState} from "react";
import {
    IonAccordion,
    IonAccordionGroup,
    IonButton, IonContent, IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonPopover,
    IonSegment,
    IonSegmentButton,
    useIonToast
} from "@ionic/react";
import ErrorWindowComp from "../file/ErrorWindowComp";
import {sfetch} from "../../../utils/simplerequest";
import ErrorInterface from "../file/ErrorInterface";
import {MenuItem} from "../MenuItems";
import {layersOutline, layersSharp} from "ionicons/icons";

type segmentOption = 'sampling' | 'argumentation';

/**
 * Component that load or save a Workspace, Network or Batch Inference
 * @example <WorkspaceComp header={"Workspace"}/>
 */
const WorkspaceComp: React.FC = () => {

    // Init States
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });

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

    /*const [showToast,] = useIonToast();
    const toastTime = 2000;*/

    //const [path, setPath] = useState<string>("");
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        //setPath("");
        setShowErrorWindow(false);
        setErrorMsg("");
    };
    return (
        <>
            <IonPopover
                isOpen={showPopover.open}
                event={showPopover.event}
                onDidDismiss={() => cleanUp()}
                className={"file-popover"}>
                <IonSegment onIonChange={(e:CustomEvent) => {console.log("Segment selected : ", e.detail.value)}}>
                    <IonSegmentButton value={"sampling"}>
                        <IonLabel>sampling</IonLabel>
                    </IonSegmentButton>
                     <IonSegmentButton value={"argumentation"}>
                        <IonLabel>argumentation</IonLabel>
                    </IonSegmentButton>
                </IonSegment>
                <IonContent>
                    <IonAccordion>
                    <IonItem slot={"header"}>
                        <IonIcon slot={"start"} ios={items.iosIcon} md={items.mdIcon}/>
                        <IonLabel>{items.title}</IonLabel>
                    </IonItem>
                    <IonList slot={"content"}>
                        {/*Workspace menu*/}
                        <WorkspaceComp/>
                        {/*Network menu*/}
                        {/*Batch Inference menu*/}
                    </IonList>
                </IonAccordion>
                </IonContent>
                {/* Function effect to close the popup */}
            </IonPopover>
            {/* Function effect to close the popup */}
            <IonItem button
                onClick={e => setShowPopover({open: true, event: e.nativeEvent }) }>
                Dataset
            </IonItem>
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={"Error while loading the file"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
        </>
    );
}

export default WorkspaceComp;