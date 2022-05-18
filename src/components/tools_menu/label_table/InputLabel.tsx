import React, {useState} from "react";
import {
    IonAlert,
    IonButton, IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonPopover,
    IonSelect,
    IonSelectOption,
    useIonToast
} from "@ionic/react";
import { LabelInterface } from "./LabelInterface";
import {colorFromId} from '../../../utils/colormap';

/*Icons import*/
import {addOutline, trashOutline} from "ionicons/icons";

import './OptionsIcons.css';
import {sfetch} from "../../../utils/simplerequest";
import {dispatch} from "../../../utils/eventbus";
import {useEventBus} from "../../../utils/eventbus";
import {useStorageState} from "react-storage-hooks";
import ErrorWindowComp from "../../main_menu/file/ErrorWindowComp";
import ErrorInterface from "../../main_menu/file/ErrorInterface";

interface InputLabelProps {
    colors: [number, number, number][];
    onLabelList: (labels: LabelInterface[]) => void;
    labelList: LabelInterface[];
    newLabelId: number;
    onNewLabelId: (id: number) => void;
}

interface WarningWindowInterface {
    openWarningWindow: boolean
    onOpenWarningWindow: (flag: boolean) => void;

    labelList: LabelInterface[];
    onLabelList: (labels: LabelInterface[]) => void;
    onNewLabelId: (id: number) => void;
}

const compareWith = (label1: LabelInterface, label2: LabelInterface) => {
  return label1 && label2 ? label1.id === label2.id : label1 === label2;
}

/**
 * Component that shows a warning window when the user delete a label
 * @param {boolean} openWarningWindow - Variable that opens the Warning window
 * @param {(flag: boolean) => void} onOpenWarningWindow - Setter for openWarningWindow
 * @param {LabelInterface[]} labelList - A vector of objects that contains each element contains the label name, label id and label color
 * @param {(labels: LabelInterface[]) => void} onLabelList - Setter for labelList
 * @param {(id: number) => void} onNewLabelId - Setter of new label id
 */
const WarningWindow: React.FC<WarningWindowInterface> = ({openWarningWindow,
                                                             onOpenWarningWindow,
                                                             labelList,
                                                             onLabelList,
                                                             onNewLabelId}) => {

    const closeWarningWindow = () => {
        onOpenWarningWindow(false);
    }

    const removeAllLabels = () => {
        const newVec = labelList.filter(lab => lab.id === 0);
        onLabelList(newVec);
        onNewLabelId(0); // This value resets the id generator

        sfetch("POST", "/close_annot", "").then(
            () => {
                dispatch('annotationChanged', null);
            }).catch((error) => {
                //TODO : need to implement an error component here
                console.log("error to delete all labels\n");
                console.log(error);
        }).finally(() => {
            closeWarningWindow();
        });
    }

    return(
        <IonAlert
            isOpen={openWarningWindow}
            onDidDismiss={closeWarningWindow}
            header={"Deleting all labels"}
            message={"Do you wish to delete all labels ?"}
            buttons={[
                {
                    text: "No",
                    id: "no-button",
                    handler: () => {
                        closeWarningWindow();
                    }
                },
                {
                    text: "Yes",
                    id: "yes-button",
                    handler: () => {
                        removeAllLabels();
                    }
                }
            ]}/>
    )
}

/**
 * This component creates the option for add any label in the label section
 * @param {InputLabelProps} props a list that contains the toolbar components
 * @return This function returns a window for the user add a label name and color a vector with this new label
 */
const InputLabel: React.FC<InputLabelProps> = (props: InputLabelProps) => {

    const [selectedLabels, setSelectedLabels] = useState<LabelInterface[]>([]);
    const [openWarningWindow, setOpenWarningWindow] = useState<boolean>(false);
    const [showMergeMenu, setShowMergeMenu] = useState<boolean>(false);
    const [showError, setShowError] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [activateMenu, setActivateMenu] = useStorageState<boolean>(sessionStorage, "ActivateComponents", true);
    const [ionToastActivateExtendOp, ] = useIonToast();
    const timeToast = 2000;

    useEventBus("ActivateComponents", (activateAddLabelButton) => {
        setActivateMenu(activateAddLabelButton);
    })

    const handleShowWarningWindow = (flag: boolean) => {
        setOpenWarningWindow(flag);
    }

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowError(flag);
    }

    const addNewLabel = () => {
        const newColor = colorFromId(props.colors, props.newLabelId); 
        const newLabel = {
            labelName: "Label " + props.newLabelId,
            color: newColor,
            id: props.newLabelId
        };
        props.onLabelList([...props.labelList, newLabel]);
        props.onNewLabelId(props.newLabelId);
    }

    const extendLabel = () => {
        console.log("Doing dispatch for ExtendLabel");
        dispatch("ExtendLabel", true);
        ionToastActivateExtendOp(`Extend label operation activated !`, timeToast);
    }

    const mergeLabel = () => {
        console.log("Doing dispatch for mergeLabel");
        setShowMergeMenu(true);
        dispatch("mergeLabel", true);
    }

    const deleteLabelsToMerge = (labelsToDelete: Array<number>) => {
        let newLabelList = props.labelList.filter(label => !labelsToDelete.includes(label.id));
        console.log("newLabelList : ", newLabelList);
        props.onLabelList(newLabelList);
    }

    return(
        <div style={ {display: "flex", justifyContent: "flex-end"} }>
            <IonButton size={"small"} onClick={extendLabel} disabled={activateMenu}>
                Extend
            </IonButton>

             <IonButton id={"merge-label"} size={"small"} onClick={mergeLabel} disabled={activateMenu}>
                 Merge
            </IonButton>

            {/*Merge Pop-up*/}
            <IonPopover
                trigger={"merge-label"}
                isOpen={showMergeMenu}
                onDidDismiss={() => {
                    setShowMergeMenu(false);
                    setSelectedLabels([]);
                    setErrorMsg("");
                }}
                className={"ion-popover-merge"}>

                <IonContent>
                    <IonItem>
                        <IonLabel>Labels to merge</IonLabel>
                         <IonSelect
                             compareWith={compareWith}
                             value={selectedLabels}
                             multiple
                             onIonChange={(e: CustomEvent) => {setSelectedLabels(e.detail.value)}}>
                             {props.labelList.map((label: LabelInterface) => (
                                <IonSelectOption key={label.id} value={label}>
                                    {label.labelName}
                                </IonSelectOption>
                              ))}
                        </IonSelect>
                    </IonItem>

                    {/*Merge Buttons*/}
                    <IonItem>
                        <IonButton onClick={() => {
                            setShowMergeMenu(false);
                        }}>Cancel</IonButton>

                        <IonButton onClick={() => {
                            const params = {
                                "selected_labels": selectedLabels.map(label => label.id),
                            }

                            sfetch("POST", "/merge_labels", JSON.stringify(params), "json").then(
                                (labelsToDelete: Array<number>) => {
                                    console.log("Labels to delete");
                                    console.log(labelsToDelete);
                                    setErrorMsg("");
                                    deleteLabelsToMerge(labelsToDelete);
                                    console.log("annotationChanged dispatch on merge");
                                    dispatch("annotationChanged", null);
                                    setShowMergeMenu(false);
                                    setSelectedLabels([]);
                                }
                            ).catch((error: ErrorInterface) => {
                                console.log("error msg : ", error["error_msg"]);
                                setShowError(true);
                                setErrorMsg(error["error_msg"]);
                            })

                        }}>Confirm</IonButton>
                    </IonItem>
                </IonContent>
            </IonPopover>
            <IonButton size="small" onClick={addNewLabel} disabled={activateMenu}>
                <IonIcon icon={addOutline} slot={"end"}/>
                Add
            </IonButton>

            <IonButton color="danger" size="small" slot={"end"}
                       disabled={props.labelList.length <= 1}
                       onClick={() => setOpenWarningWindow(true)}>
                <IonIcon icon={trashOutline} slot={"end"}/>
                Delete all
            </IonButton>
            {(openWarningWindow) ?
                <WarningWindow
                    openWarningWindow={openWarningWindow}
                    onOpenWarningWindow={handleShowWarningWindow}
                    labelList={props.labelList}
                    onLabelList={props.onLabelList}
                    onNewLabelId={props.onNewLabelId}/> :
                <></>
            }

            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={"Error trying to merge a label"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showError}
                onErrorFlag={handleErrorWindow}/>
        </div>
    );
};

export default InputLabel;
