import React, {useState} from "react";
import {IonButton, IonInput, IonItem, IonLabel, IonList, IonPopover, useIonToast} from "@ionic/react";
import ErrorWindowComp from "../file/ErrorWindowComp";
import {sfetch} from "../../../utils/simplerequest";
import ErrorInterface from "../file/ErrorInterface";

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
         const params = {
             workspace_path: path,
        }

        sfetch("POST", "/load_workspace", JSON.stringify(params), "json").then(
            () => {
                console.log("the workspace was loaded without problems !!");
                showToast(`loaded a ` + header + `in the path ` + `"` + path + `"`, toastTime);
            }
        ).catch((error: ErrorInterface) => {
            console.log("Error message while trying to load the " + header, error.error_msg);
            setErrorMsg(error.error_msg);
            setShowErrorWindow(true);
        })
    }

    const handleNewWorkspace = () => {
        const params = {
             workspace_path: path,
        }

        sfetch("POST", "/open_new_workspace", JSON.stringify(params), "json").then(
            (workspace_path: string) => {
                console.log("Create a " + header + " in the path", workspace_path);
                showToast(`Create a ` + header + `in the path ` + `"` + workspace_path + `"`, toastTime);
            }
        ).catch((errorMsg: ErrorInterface) => {
            console.log("Error message while trying to open a new " + header, errorMsg.error_msg);
            setErrorMsg(errorMsg.error_msg);
            setShowErrorWindow(true);
        });
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
            {/* Function effect to close the popup */}
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