import React, {useState} from "react";
import {
    IonButton, IonItem, IonLabel,
    IonPopover, IonSegment, IonSegmentButton, SegmentChangeEventDetail
} from "@ionic/react";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import SamplingComp from "./SamplingComp";
import {useStorageState} from "react-storage-hooks";
import ArgumentationComp from "./AugmentationComp";
import {AugmentationInterface, InitAugmentationOptions} from "./DatasetInterfaces";

//TODO : Need to verify why the css is not working on pop-over
const menuChoices = ["sampling", "argumentation"] as const;
type InputMenuChoicesType = typeof menuChoices[number];

/**
 * Component that load or save a Workspace, Network or Batch Inference
 * @example <WorkspaceComp/>
 */
const WorkspaceComp: React.FC = () => {

    const [menuOp, setMenuOp] = useStorageState<InputMenuChoicesType>(sessionStorage, "DatasetMenu", "sampling");

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

    const selectMenuOp = (e: CustomEvent<SegmentChangeEventDetail>) => {
        setMenuOp(e.detail.value as InputMenuChoicesType);
    };

    const renderSegmentButton = (choice: InputMenuChoicesType) => {
        return (
            <IonSegmentButton value={choice}>
                <IonLabel>{choice}</IonLabel>
            </IonSegmentButton>
        );
    }

    const renderMenu = (choice: InputMenuChoicesType, idx: number) => {
        return (
            <div hidden={menuOp !== choice}>{menus[idx]}</div>
        );
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
                <IonSegment value={menuOp} onIonChange={selectMenuOp}>
                    {menuChoices.map(renderSegmentButton)}
                </IonSegment>
                {menuChoices.map(renderMenu)}
                <IonButton color={"tertiary"} slot={"end"} onClick={e => setShowPopover({open: false, event: e.nativeEvent})}>
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