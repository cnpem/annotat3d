import React, {useState} from "react";
import {IonButton, IonIcon, useIonToast} from "@ionic/react";
import {LabelInterface} from "./LabelInterface";
import {colorFromId} from '../../../../utils/colormap';

/*Icons import*/
import {addOutline, eyedrop} from "ionicons/icons";

import './OptionsIcons.css';
import {dispatch} from "../../../../utils/eventbus";
import {useEventBus} from "../../../../utils/eventbus";
import {useStorageState} from "react-storage-hooks";
import ErrorWindowComp from "../../../main_menu/file/utils/ErrorWindowComp";

interface InputLabelProps {
    colors: [number, number, number][];
    onLabelList: (labels: LabelInterface[]) => void;
    labelList: LabelInterface[];
    newLabelId: number;
    onNewLabelId: (id: number) => void;
    onSelectLabel: (id: number) => void;
}

interface LabelMergeListInterface {
    label: string,
    value: number,
}

/**
 * This component creates the option for add any label in the label section
 * @param {InputLabelProps} props a list that contains the toolbar components
 * @return This function returns a window for the user add a label name and color a vector with this new label
 */
const InputLabel: React.FC<InputLabelProps> = (props: InputLabelProps) => {

    const [selectedLabels, setSelectedLabels] = useState<LabelMergeListInterface[]>([]);
    const [showMergeMenu, setShowMergeMenu] = useState<boolean>(false);
    const [showError, setShowError] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);
    const [ionToastActivateExtendOp,] = useIonToast();
    const timeToast = 2000;

    useEventBus('LockComponents', (activateAddLabelButton: boolean) => {
        setLockMenu(activateAddLabelButton);
    });

    // This function simulates a click user to add a new label.
    useEventBus("sequentialLabelUpdate", (slPayload: { id: number, tableLen: number }) => {
        if (slPayload.id >= slPayload.tableLen) {
            const link = document.getElementById("add-label-button");
            link!.click();
        }
        props.onSelectLabel(slPayload.id);
    });

    const handleErrorWindow = (flag: boolean) => {
        setShowError(flag);
    }

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    // const initSelectedLabels = () => {
    //     let initSelectedVec = [{
    //             type: 'checkbox',
    //             label: props.labelList[0].labelName,
    //             value: props.labelList[0].id}];
    //
    //     for (let i = 1; i < props.labelList.length; i++)
    //     {
    //         /**
    //          * type: string,
    //          * label: string,
    //          * value: string,
    //          * id: string,
    //          * checked: boolean,
    //          */
    //         initSelectedVec = [...initSelectedVec, {
    //             type: "checkbox",
    //             label: props.labelList[i].labelName,
    //             value: props.labelList[i].id}];
    //
    //     }
    //
    //     console.log("init val : ", initSelectedVec);
    //     setSelectedLabels(initSelectedVec);
    //     setShowMergeMenu(true);
    // }

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
        if (newLabelList.length === 1) {
            props.onNewLabelId(0);
        }
    }

    return (
        <div style={{display: "flex", justifyContent: "flex-end"}}>
            <IonButton size={"small"} onClick={extendLabel} disabled={lockMenu}>
                <IonIcon icon={eyedrop} slot={"end"}/>
                Find Label
            </IonButton>

            {/*<IonButton size={"small"} onClick={initSelectedLabels} disabled={lockMenu}>*/}
            {/*    Merge*/}
            {/*</IonButton>*/}

            {/*/!*Merge Menu*!/*/}
            {/*<IonAlert*/}
            {/*    isOpen={showMergeMenu}*/}
            {/*    onDidDismiss={() => setShowMergeMenu(false)}*/}
            {/*    header={"Select your labels to merge"}*/}
            {/*    inputs={selectedLabels}*/}
            {/*    buttons={[*/}
            {/*        {*/}
            {/*            text: 'Cancel',*/}
            {/*            role: 'cancel',*/}
            {/*            cssClass: 'secondary',*/}
            {/*            id: 'cancel-button',*/}
            {/*        },*/}
            {/*        {*/}
            {/*            text: 'Okay',*/}
            {/*            id: 'confirm-button',*/}
            {/*            handler: (selectedLabelsId: Array<number>) => {*/}
            {/*                console.log("Selected Labels Id : ", selectedLabelsId);*/}
            {/*                 const params = {*/}
            {/*                    "selected_labels": selectedLabelsId,*/}
            {/*                }*/}
            {/*                console.log("params : ", params);*/}
            {/*                 sfetch("POST", "/merge_labels", JSON.stringify(params), "json").then(*/}
            {/*                    (labelsToDelete: Array<number>) => {*/}
            {/*                        console.log("Labels to delete");*/}
            {/*                        console.log(labelsToDelete);*/}
            {/*                        setErrorMsg("");*/}
            {/*                        deleteLabelsToMerge(labelsToDelete);*/}
            {/*                        console.log("annotationChanged dispatch on merge");*/}
            {/*                        dispatch("annotationChanged", null);*/}
            {/*                        dispatch('labelChanged', '');*/}
            {/*                        setShowMergeMenu(false);*/}
            {/*                        setSelectedLabels([]);*/}
            {/*                        ionToastActivateExtendOp(`Labels merged successfully !`, timeToast);*/}
            {/*                    }*/}
            {/*                ).catch((error: ErrorInterface) => {*/}
            {/*                    console.log("error msg : ", error["error_msg"]);*/}
            {/*                    setShowError(true);*/}
            {/*                    setErrorMsg(error["error_msg"]);*/}
            {/*                })*/}

            {/*                console.log('Confirm Okay');*/}
            {/*            }*/}
            {/*        }*/}
            {/*    ]}/>*/}

            <IonButton size="small" id={"add-label-button"} onClick={addNewLabel} disabled={lockMenu}>
                <IonIcon icon={addOutline} slot={"end"}/>
                Add
            </IonButton>

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
