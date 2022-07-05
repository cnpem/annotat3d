import {IonButton, IonIcon, IonItem, IonLabel, IonPopover} from "@ionic/react";
import React, {Fragment, useState} from "react";
import {useEventBus} from "../../../../utils/eventbus";
import {checkbox} from "ionicons/icons";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import {useStorageState} from "react-storage-hooks";

const BatchInferenceComp: React.FC = () => {

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
        console.log("bla");
        setDisableComp(isDisabled);
    });

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowErrorWindow(false);
        setErrorMsg("");
    };

    return (
        <Fragment>
            <IonItem button
                     disabled={disableComp}
                     id={"open-batch-inference"}>
                Batch Inference
            </IonItem>
            <IonPopover
                trigger={"open-batch-inference"}
                onDidDismiss={() => cleanUp()}
                className={"file-popover-dataset"}>
                <IonLabel>Opa, bão ?</IonLabel>
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