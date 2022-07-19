import React, {useState} from "react";
import {
    IonAccordion,
    IonAccordionGroup,
    IonButton,
    IonIcon,
    IonInput,
    IonItem, IonItemDivider,
    IonLabel,
    IonList,
    IonPopover,
    useIonToast
} from "@ionic/react";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import {sfetch} from "../../../../utils/simplerequest";
import ErrorInterface from "../../file/ErrorInterface";
import {construct, folder} from "ionicons/icons";
import "./Workspace.css";
import {dispatch} from "../../../../utils/eventbus";

interface WorkspaceInterface {
    workspacePath: string,
    folderName: string,
}

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

    const [userInput, setUserInput] = useState<WorkspaceInterface>({workspacePath: "", folderName: "workspace/"});
    const [showToast,] = useIonToast();
    const toastTime = 2000;
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
            workspace_path: userInput.workspacePath + userInput.folderName,
        }

        sfetch("POST", "/load_workspace", JSON.stringify(params), "json").then(
            (workspace_path: string) => {
                console.log("Loaded a Workspace in the path ", workspace_path);
                showToast(`loaded a Workspace in the path "${params.workspace_path}"`, toastTime);
                dispatch("workspaceLoaded", false);
                cleanUp();
            }
        ).catch((error: ErrorInterface) => {
            console.log("Error message while trying to load the Workspace", error.error_msg);
            setErrorMsg(error.error_msg);
            setShowErrorWindow(true);
        })
    }

    const handleNewWorkspace = () => {
        if (userInput.workspacePath !== "") {
            const params = {
                workspace_path: userInput.workspacePath + userInput.folderName,
            }

            sfetch("POST", "/open_new_workspace", JSON.stringify(params), "json").then(
                (workspace_path: string) => {
                    console.log("Create a Workspace in the path ", workspace_path);
                    showToast(`Create a Workspace in the path "${params.workspace_path}"`, toastTime);
                    dispatch("workspaceLoaded", false);
                    cleanUp();
                }
            ).catch((errorMsg: ErrorInterface) => {
                console.log("Error message while trying to open a new Workspace", errorMsg.error_msg);
                setErrorMsg(errorMsg.error_msg);
                setShowErrorWindow(true);
            });
        } 
        else {
            const error_msg = "Please specify a path for the new Workspace.";
            console.log("Error message while trying to open a new Workspace", error_msg);
            setErrorMsg(error_msg);
            setShowErrorWindow(true);

        }
    }

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setUserInput({workspacePath: "", folderName: "workspace/"});
        setShowErrorWindow(false);
        setErrorMsg("");
    };
    return (
        <>
            <IonPopover
                isOpen={showPopover.open}
                event={showPopover.event}
                onDidDismiss={() => cleanUp()}
                alignment={"center"}
                className={"ion-workspace"}>
                <IonAccordionGroup multiple={true}>
                    <IonAccordion>
                        {/* Header Path for workspace Input */}
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
                            <IonLabel><small>Workspace Path</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <IonInput
                                placeholder={"/path/to/Workspace"}
                                value={userInput.workspacePath}
                                onIonChange={(e: CustomEvent) => setUserInput({
                                    workspacePath: e.detail.value!,
                                    folderName: userInput.folderName
                                })}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    <IonAccordion>
                        {/* Header Path for folder name */}
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={folder}/>
                            <IonLabel><small>Folder Name</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <IonInput
                                placeholder={"Folder Name"}
                                value={userInput.folderName}
                                onIonChange={(e: CustomEvent) => setUserInput({
                                    workspacePath: userInput.workspacePath,
                                    folderName: e.detail.value!
                                })}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                </IonAccordionGroup>
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