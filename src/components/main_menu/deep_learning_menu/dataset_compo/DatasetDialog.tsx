import "./Dataset.css"
import React, {useState} from "react";
import {
    IonButton, IonIcon, IonItem, IonLabel,
    IonPopover, IonSegment, IonSegmentButton, SegmentChangeEventDetail
} from "@ionic/react";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import SamplingComp from "./SamplingComp";
import {useStorageState} from "react-storage-hooks";
import {AugmentationInterface, InitAugmentationOptions, InitIonRangeVec, IonRangeElement} from "./DatasetInterfaces";
import AugmentationComp from "./AugmentationComp";
import {checkbox, closeOutline} from "ionicons/icons";

const menuChoices = ["sampling", "augmentation"] as const;
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
    const [augmentationOpSelected, setAugmentationOpSelected] = useState<AugmentationInterface[]>(InitAugmentationOptions);
    const [ionRangeVec, setIonRangeVec] = useState<IonRangeElement[]>(InitIonRangeVec);

    const changeCheckedStatus = (index: number) => {
        const newCheckedVector = augmentationOpSelected.map(
            element => element.checkedId === index
                ? {...element, isChecked: !element.isChecked} : element
        );
        setAugmentationOpSelected(newCheckedVector);
    }

    const changeIonRangeVal = (newSliderNumber: { lower: number, upper: number }, index: number) => {
        const newIonRangeVec = ionRangeVec.map(
            element => element.ionRangeId === index
                ? {...element, actualRangeVal: newSliderNumber} : element
        );
        setIonRangeVec(newIonRangeVec);
    }

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

    const menus = [<SamplingComp/>, <AugmentationComp
        checkedVector={augmentationOpSelected}
        onCheckedVector={changeCheckedStatus}
        ionRangeVec={ionRangeVec}
        onIonRangeVec={changeIonRangeVal}/>];

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
        setAugmentationOpSelected(InitAugmentationOptions);
        setIonRangeVec(InitIonRangeVec);
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
                <IonButton
                    color={"tertiary"}
                    slot={"end"}
                    onClick={e => setShowPopover({open: false, event: e.nativeEvent})}>
                    OK
                    <IonIcon
                        icon={checkbox}
                        slot={"end"}/>
                </IonButton>
            </IonPopover>
            {/* Function effect to open the popup */}
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