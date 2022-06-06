import React, {useState} from "react";
import {
    IonAccordion, IonAccordionGroup, IonContent, IonIcon, IonItem, IonLabel, IonList,
    IonPopover, IonSegment, IonSegmentButton
} from "@ionic/react";
import ErrorWindowComp from "../file/ErrorWindowComp";
import {MenuItem} from "../MenuItems";
import {construct, layersOutline, layersSharp} from "ionicons/icons";

//TODO : Need to verify why the css is not working on pop-over

/**
 * Component that load or save a Workspace, Network or Batch Inference
 * @example <WorkspaceComp/>
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
        setShowErrorWindow(false);
        setErrorMsg("");
    };
    return (
        <>
            <IonPopover
                isOpen={showPopover.open}
                event={showPopover.event}
                onDidDismiss={() => cleanUp()}
                className={"file-popover-workspace"}>
                <IonSegment onIonChange={(e: CustomEvent) => {
                    console.log("Segment selected : ", e.detail.value)
                }}>
                    <IonSegmentButton value={"sampling"}>
                        <IonLabel>sampling</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value={"argumentation"}>
                        <IonLabel>argumentation</IonLabel>
                    </IonSegmentButton>
                </IonSegment>
                <IonAccordionGroup multiple={true}>
                    {/*Deep learning option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
                            <IonLabel><small>Deep learning</small></IonLabel>
                        </IonItem>
                    </IonAccordion>
                </IonAccordionGroup>
                {/* Function effect to close the popup */}
            </IonPopover>
            {/* Function effect to close the popup */}
            <IonItem button
                     onClick={e => setShowPopover({open: true, event: e.nativeEvent})}>
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