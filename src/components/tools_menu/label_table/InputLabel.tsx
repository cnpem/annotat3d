import React, {useState} from "react";
import {IonAlert, IonButton, IonIcon} from "@ionic/react";
import { LabelInterface } from "./LabelInterface";
import {colorFromId} from '../../../utils/colormap';

/*Icons import*/
import {addOutline, trashOutline} from "ionicons/icons";

import './OptionsIcons.css';
import {sfetch} from "../../../utils/simplerequest";
import {dispatch} from "../../../utils/eventbus";

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
            });

        closeWarningWindow();
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
 * @param props a list that contains the toolbar components
 * @constructor
 * @return This function returns a window for the user add a label name and color a vector with this new label
 */
const InputLabel: React.FC<InputLabelProps> = (props: InputLabelProps) => {

    const [openWarningWindow, setOpenWarningWindow] = useState<boolean>(false);

    const handleShowWarningWindow = (flag: boolean) => {
        setOpenWarningWindow(flag);
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

    return(
        <div style={ {display: "flex", justifyContent: "flex-end"} }>
            <IonButton size="small" onClick={addNewLabel}>
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
        </div>
    );
};

export default InputLabel;
