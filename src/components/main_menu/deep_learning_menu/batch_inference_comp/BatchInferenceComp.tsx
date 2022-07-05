import {
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonPopover,
    IonSegment,
    IonSegmentButton,
    SegmentChangeEventDetail
} from "@ionic/react";
import React, {Fragment, useState} from "react";
import {useEventBus} from "../../../../utils/eventbus";
import {checkbox} from "ionicons/icons";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import {useStorageState} from "react-storage-hooks";
import InferenceComp from "./InferenceComp";

const menuChoices = ["Inference", "Settings"] as const;
type InputMenuChoicesType = typeof menuChoices[number];

const BatchInferenceComp: React.FC = () => {

    const [menuOp, setMenuOp] = useStorageState<InputMenuChoicesType>(sessionStorage, "DatasetMenu", "Inference");
    const [disableComp, setDisableComp] = useStorageState<boolean>(sessionStorage, "workspaceLoaded", true);
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    useEventBus("workspaceLoaded", (isDisabled: boolean) => {
        setDisableComp(isDisabled);
    });

    const menus = [<InferenceComp/>];

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowErrorWindow(false);
        setErrorMsg("");
    };

    const selectMenuOp = (e: CustomEvent<SegmentChangeEventDetail>) => {
        setMenuOp(e.detail.value as InputMenuChoicesType);
    };

    const renderMenu = (choice: InputMenuChoicesType, idx: number) => {
        return (
            <div hidden={menuOp !== choice}>{menus[idx]}</div>
        );
    }

    const renderSegmentButton = (choice: InputMenuChoicesType) => {
        return (
            <IonSegmentButton value={choice}>
                <IonLabel>{choice}</IonLabel>
            </IonSegmentButton>
        );
    }

    return (
        <Fragment>
            {/*Button to open the Batch Inference menu*/}
            <IonItem button
                     disabled={disableComp}
                     id={"open-batch-inference"}>
                Batch Inference
            </IonItem>
            <IonPopover
                trigger={"open-batch-inference"}
                onDidDismiss={() => cleanUp()}
                className={"file-popover-dataset"}>
                <IonSegment value={menuOp} onIonChange={selectMenuOp}>
                    {menuChoices.map(renderSegmentButton)}
                </IonSegment>
                {menuChoices.map(renderMenu)}
                <IonButton
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

};

export default BatchInferenceComp