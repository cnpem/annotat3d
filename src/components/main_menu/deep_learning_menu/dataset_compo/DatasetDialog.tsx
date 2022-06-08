import React, {useState} from "react";
import {
    IonAccordion, IonAccordionGroup, IonButton, IonIcon, IonItem, IonLabel,
    IonPopover, IonSegment, IonSegmentButton
} from "@ionic/react";
import {construct} from "ionicons/icons";
import ErrorWindowComp from "../../file/ErrorWindowComp";

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
                className={"file-popover-dataset"}>
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
                {/*Dataset Sampling options*/}
                <IonAccordionGroup multiple={true}>
                    {/*Data menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
                            <IonLabel><small>Data</small></IonLabel>
                        </IonItem>
                    </IonAccordion>
                    {/*Label menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
                            <IonLabel><small>Label</small></IonLabel>
                        </IonItem>
                    </IonAccordion>
                    {/*Weight menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
                            <IonLabel><small>Weight</small></IonLabel>
                        </IonItem>
                    </IonAccordion>
                    {/*Sampling menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
                            <IonLabel><small>Sampling</small></IonLabel>
                        </IonItem>
                    </IonAccordion>
                </IonAccordionGroup>
                {/* Function effect to close the popup */}
                <IonButton onClick={e => setShowPopover({open: false, event: e.nativeEvent})}>
                    OK
                </IonButton>
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