import React, {useState} from "react";
import {IonButton, IonInput, IonItem, IonLabel, IonList, IonPopover, useIonToast} from "@ionic/react";
import ErrorWindowComp from "../file/ErrorWindowComp";
import {sfetch} from "../../../utils/simplerequest";

/**
 * Component that load or save a Workspace, Network or Batch Inference
 * @param {string} header - a string variable used to show f
 * @example <FileLoadDeepDialog header={"Workspace"}/>
 */
const FileLoadDeepDialog: React.FC<{header: string}> = ({header}) => {

    // Init States
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });

    const [showToast,] = useIonToast();
    const toastTime = 2000;

    const [path, setPath] = useState<string>("");
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    const handleLoadWorkspace = () => {
        console.log("Load on", header);
    }

    const handleNewWorkspace = () => {
        console.log("new", path);

        const params = {
             workspace_path: path,
        }

        sfetch("POST", "/open_new_workspace", JSON.stringify(params), "");

    }

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setPath("");
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
                <IonList>
                    {/* Header Path Text Input*/}
                    <IonItem>
                        <IonLabel position="stacked">{header + " Path"}</IonLabel>
                        <IonInput
                            placeholder={"/path/to/"+header}
                            value={path}
                            onIonChange={(e:CustomEvent) => setPath(e.detail.value!)} />
                    </IonItem>
                </IonList>
                {/* Create option */}
                <IonButton color={"tertiary"} slot={"end"} onClick={handleNewWorkspace}>
                    New {header}!
                </IonButton>
                {/* Load option */}
                <IonButton color={"tertiary"} slot={"end"} onClick={handleLoadWorkspace}>
                    Load {header}!
                </IonButton>
            </IonPopover>
            {/* Load Button */}
            <IonItem button
                onClick={e => setShowPopover({open: true, event: e.nativeEvent }) }>
                {header}
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

export default FileLoadDeepDialog;