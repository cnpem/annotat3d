import React, {useState} from "react";
import {
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonPopover,
    useIonToast
} from "@ionic/react";
import ErrorWindowComp from "../file/ErrorWindowComp";
import {sfetch} from "../../../utils/simplerequest";
import ErrorInterface from "../file/ErrorInterface";
import {construct} from "ionicons/icons";

//TODO : Need to verify why the css is not working on pop-over

/**
 * Component that load or save a Workspace
 * @example <WorkspaceComp/>
 */
const WorkspaceComp: React.FC = () => {

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
        const params = {
            workspace_path: path,
        }

        sfetch("POST", "/load_workspace", JSON.stringify(params), "json").then(
            (workspace_path: string) => {
                console.log("Loaded a Workspace in the path ", workspace_path);
                showToast(`loaded a Workspace in the path "${path}"`, toastTime);
                cleanUp();
            }
        ).catch((error: ErrorInterface) => {
            console.log("Error message while trying to load the Workspace", error.error_msg);
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
                console.log("Create a Workspace in the path ", workspace_path);
                showToast(`Create a Workspace in the path "${path}"`, toastTime);
                cleanUp();
            }
        ).catch((errorMsg: ErrorInterface) => {
            console.log("Error message while trying to open a new Workspace", errorMsg.error_msg);
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
                className={"file-popover-load"}>
                <IonList>
                    {/* Header Path Text Input */}
                    <IonItem slot={"header"}>
                        <IonIcon slot={"start"} icon={construct}/>
                        <IonLabel position="stacked">{"Workspace Path"}</IonLabel>
                        <IonInput
                            placeholder={"/path/to/Workspace"}
                            value={path}
                            onIonChange={(e: CustomEvent) => setPath(e.detail.value!)}/>
                    </IonItem>
                </IonList>
                {/* Create option */}
                <IonButton color={"tertiary"} slot={"end"} onClick={handleNewWorkspace}>
                    New Workspace!
                </IonButton>
                {/* Load option */}
                <IonButton color={"tertiary"} slot={"end"} onClick={handleLoadWorkspace}>
                    Load Workspace!
                </IonButton>
            </IonPopover>
            {/* Button that opens Workspace pop-up */}
            <IonItem button
                     onClick={e => setShowPopover({open: true, event: e.nativeEvent})}>
                Workspace
            </IonItem>
            {/* Error window */}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={"Error while loading the workspace"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
        </>
    );
}

export default WorkspaceComp;