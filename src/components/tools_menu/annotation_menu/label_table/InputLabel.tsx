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
    isSLActivated: boolean
}

/**
 * This component creates the option for add any label in the label section
 * @param {InputLabelProps} props a list that contains the toolbar components
 * @return This function returns a window for the user add a label name and color a vector with this new label
 */
const InputLabel: React.FC<InputLabelProps> = (props: InputLabelProps) => {

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
        const link = document.getElementById("add-label-button");
        link!.click();
        props.onSelectLabel(slPayload.id);
    });

    const handleErrorWindow = (flag: boolean) => {
        setShowError(flag);
    }

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
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

    return (
        <div style={{display: "flex", justifyContent: "flex-end"}}>
            <IonButton size="small" id={"add-label-button"} onClick={addNewLabel}
                       disabled={lockMenu || props.isSLActivated}>
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
