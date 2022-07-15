import "./Network.css"
import React, {Fragment, useState} from "react";
import {IonButton, IonContent, IonIcon, IonItem, IonLabel, IonList, IonPopover, IonSegment, IonSegmentButton, SegmentChangeEventDetail} from "@ionic/react";
import { useStorageState } from "react-storage-hooks";
import { checkbox } from "ionicons/icons";

const menuChoices = ["network", "dataset", "settings", "board", "log"] as const;
type InputMenuChoicesType = typeof menuChoices[number];

/**
 * This component is just a test to see if I can create a nested popover
 * TODO : Need to change this component later
 * @constructor
 */
const NetworkComp: React.FC = () => {

    const [menuOp, setMenuOp] = useStorageState<InputMenuChoicesType>(sessionStorage, "DatasetMenu", "network");
    const [workspaceName, setWorkspaceName] = useStorageState<string>(sessionStorage, "workspaceName", "");
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    // const [augmentationOpSelected, setAugmentationOpSelected] = useState<AugmentationInterface[]>(InitAugmentationOptions);

    // const [sampleElement, setSampleElement] = useStorageState<SamplingInterface>(sessionStorage, "sampleElement", {
    //     nClasses: 2,
    //     sampleSize: 100,
    //     patchSize: [256, 256, 1],
    // });

    const handleWorkspaceName = (workspace: string) => {
        setWorkspaceName(workspace);
    }

    // const handleSampleElement = (sample: SamplingInterface) => {
    //     setSampleElement(sample);
    // }

    // const changeCheckedStatus = (index: number) => {
    //     const newCheckedVector = augmentationOpSelected.map(
    //         element => element.checkedId === index
    //             ? {...element, isChecked: !element.isChecked} : element
    //     );
    //     setAugmentationOpSelected(newCheckedVector);
    // }

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

    const menus = [
        <div></div>,
        <div></div>
        // <SamplingComp
        //     sampleElement={sampleElement}
        //     onSampling={handleSampleElement}
        //     workspacePath={workspaceName}
        //     onWorkspacePath={handleWorkspaceName}/>, 
        // <AugmentationComp
        //     checkedVector={augmentationOpSelected}
        //     onCheckedVector={changeCheckedStatus}
        //     ionRangeVec={ionRangeVec}
        //     onIonRangeVec={changeIonRangeVal}/>
        ];

    const renderMenu = (choice: InputMenuChoicesType, idx: number) => {
        return (
            <div hidden={menuOp !== choice}>{menus[idx]}</div>
        );
    }

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowErrorWindow(false);
        setErrorMsg("");
        // setAugmentationOpSelected(InitAugmentationOptions);
        // setIonRangeVec(InitIonRangeVec);
    };
    return (
        <Fragment>
            {/* Function effect to open the popup */}
            <IonItem button
                     id={"open-menu-network"}>
                Network
            </IonItem>
            <IonPopover
                trigger={"open-menu-network"}
                onDidDismiss={() => cleanUp()}
                className={"file-popover-network"}>
                <IonSegment value={menuOp} onIonChange={selectMenuOp}>
                    {menuChoices.map(renderSegmentButton)}
                </IonSegment>
                {menuChoices.map(renderMenu)}
                <IonButton
                    id={"open-h5-input"}
                    color={"tertiary"}
                    slot={"end"}>
                    OK
                    <IonIcon
                        icon={checkbox}
                        slot={"end"}/>
                    {/* <CreateDatasetH5
                        augmentation={augmentationOpSelected}
                        ionRangeVec={ionRangeVec}
                        sample={sampleElement}
                        trigger={"open-h5-input"}
                        workspacePath={workspaceName}
                        onWorkspacePath={handleWorkspaceName}/> */}
                </IonButton>
            </IonPopover>
            {/*Error window*/}
            {/* <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={"Error while loading the file"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/> */}
        </Fragment>
    );
}

export default NetworkComp