import "./Network.css"
import React, {Fragment, useState} from "react";
import {IonButton, IonIcon, IonItem, IonLabel, IonPopover, IonSegment, IonSegmentButton, SegmentChangeEventDetail} from "@ionic/react";
import { useStorageState } from "react-storage-hooks";
import { checkbox } from "ionicons/icons";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import NetworkComp from "./NetworkComp";
import DatasetComp from "./DatasetComp";
import BoardComp from "./BoardComp";
import SettingsComp from "./SettingsComp";
import LogComp from "./LogComp";

const menuChoices = ["network", "dataset", "settings", "board", "log"] as const;
type InputMenuChoicesType = typeof menuChoices[number];

/**
 * This component is just a test to see if I can create a nested popover
 * TODO : Need to change this component later
 * @constructor
 */
const NetworkModuleComp: React.FC = () => {

    const [menuOp, setMenuOp] = useStorageState<InputMenuChoicesType>(sessionStorage, "DatasetMenu", "network");
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");


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
        <NetworkComp/>,
        <DatasetComp/>,
        <SettingsComp/>,
        <BoardComp/>,
        <LogComp/>
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
                </IonButton>
            </IonPopover>
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={"Error while loading the file"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
        </Fragment>
    );
}

export default NetworkModuleComp

// ---
// Example using ErrorInterface with sfetch if needed
// ---
// sfetch().catch((error: ErrorInterface) => 
//    {console.log("Error in create_dataset");
//     console.log(error.error_msg);
//     setErrorMsg(error.error_msg);
//     setShowErrorWindow(true);
//     });