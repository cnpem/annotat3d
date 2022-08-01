import "./Network.css"
import React, {Fragment, useState} from "react";
import {IonAccordion, IonAccordionGroup, IonButton, IonContent, IonInput, IonItem, IonItemDivider, IonLabel, IonList, IonPopover, IonSegment, IonSegmentButton, IonToggle, SegmentChangeEventDetail} from "@ionic/react";
import { useStorageState } from "react-storage-hooks";
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
    const [hostMode, setHostMode] = useState<boolean>(true);



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

    const handlerOnTrainButton = (e: CustomEvent) => {
        console.log(e.detail.value);
    };

    const renderMenu = (choice: InputMenuChoicesType, idx: number) => {
        return (
            <div hidden={menuOp !== choice}>{menus[idx]}</div>
        );
    }

    return (
        <Fragment>
            {/* Function effect to open the popup */}
            <IonItem button
                     id={"open-menu-network"}>
                Network
            </IonItem>
            <IonPopover
                trigger={"open-menu-network"}
                className={"file-popover-network"}>
                <IonContent>
                <IonSegment value={menuOp} onIonChange={selectMenuOp}>
                    {menuChoices.map(renderSegmentButton)}
                </IonSegment>
                {menuChoices.map(renderMenu)}
                <IonItem class='item-permanent-buttons-alignment-right'>
                    <IonItem>
                        <IonLabel>Host Mode</IonLabel>
                        <IonToggle checked={hostMode} onIonChange={e => setHostMode(e.detail.checked)} />
                    </IonItem>
                    <IonButton
                        id={"train"}
                        color={"secondary"}
                        size={'default'}
                    >
                        Train
                    </IonButton>
                    <IonButton
                        id={"finetune"}
                        color={"secondary"}
                        size={'default'}
                    >
                        finetune
                    </IonButton>
                    <IonButton
                        id={"export-network"}
                        color={"tertiary"}
                        size={'default'}
                    >
                        Export Network
                    </IonButton>
                    <IonPopover
                        trigger={'export-network'}
                        side={'bottom'}
                        alignment={'end'}>
                        {/* className={"create-h5-popover"}> */}

                        <IonLabel>Hello!</IonLabel>
                    </IonPopover>
                    <IonButton
                        id={"export-inference"}
                        color={"tertiary"}
                        size={'default'}
                        
                    >
                        Export Inference
                    </IonButton>
                    <IonPopover
                        trigger={'export-inference'}
                        side={'bottom'}
                        alignment={'end'}>
                        {/* className={"create-h5-popover"}> */}

                        <IonLabel>Hello2!</IonLabel>
                    </IonPopover>
                </IonItem>
                </IonContent>
            </IonPopover>
            {/*insert Error window here*/}
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