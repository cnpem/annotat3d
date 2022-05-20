import React, {useState} from "react";
import {IonAlert, IonButton, IonIcon, useIonToast} from "@ionic/react";
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

interface LabelMergeListInterface {
    label: string,
    value: number,
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

    const [selectedLabels, setSelectedLabels] = useState<LabelMergeListInterface[]>([]);
    const [openWarningWindow, setOpenWarningWindow] = useState<boolean>(false);
    const [showMergeMenu, setShowMergeMenu] = useState<boolean>(false);
    const [showError, setShowError] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [activateMenu, setActivateMenu] = useStorageState<boolean>(sessionStorage, "DisableVis", true);
    const [ionToastActivateExtendOp, ] = useIonToast();
    const timeToast = 2000;

    useEventBus("DisableVis", (activateAddLabelButton) => {
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

    const initSelectedLabels = () => {
        let initSelectedVec = [{
                type: 'checkbox',
                label: props.labelList[0].labelName,
                value: props.labelList[0].id}];

        for (let i = 1; i < props.labelList.length; i++)
        {
            /**
             * type: string,
             * label: string,
             * value: string,
             * id: string,
             * checked: boolean,
             */
            initSelectedVec = [...initSelectedVec, {
                type: "checkbox",
                label: props.labelList[i].labelName,
                value: props.labelList[i].id}];

        }

        console.log("init val : ", initSelectedVec);
        setSelectedLabels(initSelectedVec);
        setShowMergeMenu(true);
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

    const deleteLabelsToMerge = (labelsToDelete: Array<number>) => {
        let newLabelList = props.labelList.filter(label => !labelsToDelete.includes(label.id));
        console.log("newLabelList : ", newLabelList);
        props.onLabelList(newLabelList);
        if(newLabelList.length === 1) {
            props.onNewLabelId(0);
        }
    }

    return(
        <div style={ {display: "flex", justifyContent: "flex-end"} }>
            <IonButton size={"small"} onClick={extendLabel} disabled={activateMenu}>
                Extend
            </IonButton>

            <IonButton size={"small"} onClick={initSelectedLabels} disabled={activateMenu}>
                Merge
            </IonButton>

            {/*Merge Menu*/}
            <IonAlert
                isOpen={showMergeMenu}
                onDidDismiss={() => setShowMergeMenu(false)}
                header={"Select your labels to merge"}
                inputs={selectedLabels}
                buttons={[
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        cssClass: 'secondary',
                        id: 'cancel-button',
                    },
                    {
                        text: 'Okay',
                        id: 'confirm-button',
                        handler: (selectedLabelsId: Array<number>) => {
                            console.log("Selected Labels Id : ", selectedLabelsId);
                             const params = {
                                "selected_labels": selectedLabelsId,
                            }
                            console.log("params : ", params);
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
                                    ionToastActivateExtendOp(`Labels merged successfully !`, timeToast);
                                }
                            ).catch((error: ErrorInterface) => {
                                console.log("error msg : ", error["error_msg"]);
                                setShowError(true);
                                setErrorMsg(error["error_msg"]);
                            })

                            console.log('Confirm Okay');
                        }
                    }
                ]}/>

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
