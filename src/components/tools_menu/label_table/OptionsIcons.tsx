import React, {useEffect, useState} from "react";
import {
    IonButton, IonButtons, IonContent, IonIcon,
    IonInput, IonItem, IonPopover
} from "@ionic/react";

/*Icons import*/
import {closeOutline, colorPalette, pencilOutline} from "ionicons/icons";

import {LabelInterface} from './LabelInterface';
// @ts-ignore
import {ChromePicker} from "react-color";
import {useStorageState} from "react-storage-hooks";
import {defaultColormap} from "../../../utils/colormap";
import {dispatch} from "../../../utils/eventbus";
import {sfetch} from "../../../utils/simplerequest";

interface OptionsProps{
    label: LabelInterface;
    onChangeLabelList: (label: LabelInterface) => void;
    onChangeLabel: (newLabelName: string, labelId: number, color: [number, number, number]) => void;
}

interface LabelEditProps{
    label: LabelInterface;
    labelNameTrigger: string;

    showPopover: boolean;
    onShowPopover: (showPop: boolean) => void;

    onChangeLabelName: (newLabelName: string, labelId: number) => void;
}

/**
 * Component of buttons that statys left size of label name that permits the user to change the name, color and delete a label
 * @param {LabelEditProps} props - Object that contains the
 * @interface {LabelEditProps} - LabelEditProps interface for props
 */
const EditLabelNameComp:React.FC<LabelEditProps> = (props: LabelEditProps) => {

    const [newLabelName, setNewLabelName] = useState<string>(props.label.labelName);

    const changeLabelName = (e: CustomEvent) => {
        setNewLabelName(e.detail.value!);
    }

    const exitPopup = () => {
        props.onShowPopover(false);
    }

    const handleChangeNewLabelName = () => {
        props.onChangeLabelName(newLabelName, props.label.id);
        props.onShowPopover(false);
    }

    return(
        <IonPopover
                trigger={props.labelNameTrigger}
                isOpen={props.showPopover}
                onDidDismiss={exitPopup}
                alignment={"end"}
                side={"left"}>

                <IonContent>
                    <IonItem>
                        <IonInput value={newLabelName} onIonChange={changeLabelName}/>
                    </IonItem>

                    <IonItem>
                        <IonButton onClick={exitPopup}>Cancel</IonButton>
                        <IonButton onClick={handleChangeNewLabelName}>Confirm</IonButton>
                    </IonItem>
                </IonContent>

        </IonPopover>
    );

}

/**
 * Component that creates the buttons in the table label
 */
const OptionsIcons: React.FC<OptionsProps> = (props: OptionsProps) => {

    const [userDeleteOp, setUserDeleteOp] = useState<boolean>(false);
    const [showDeletePopUp, setShowDeletePopUp] = useState<boolean>(false);
    const [showNamePopover, setShowNamePopover] = useState<boolean>(false);
    const [showColorPopover, setShowColorPopover] = useState<boolean>(false);

    useEffect(() => {
        if (userDeleteOp && props.label.id !== 0){
            props.onChangeLabelList(props.label);
        }
    }, [userDeleteOp, props]);

    const [color, setColor] = useStorageState<[number, number, number]>(
        sessionStorage, 'labelColor.'+props.label.id, defaultColormap[props.label.id]
    );

    const handleNameEditClickButton = () => {
        setShowNamePopover(true)
    }

    const handleNameEditShowPopover = (showPop: boolean) => {
        setShowNamePopover(showPop);
    }

    return(
        <IonButtons>
            <IonButton id={"delete-label-button-" + props.label.id} size="small" onClick={() => setShowDeletePopUp(true)}>
                <IonIcon icon={closeOutline}/>
            </IonButton>
            <IonButton id={"edit-label-button-" + props.label.id} onClick={handleNameEditClickButton}>
                <IonIcon icon={pencilOutline}/>
            </IonButton>

            <IonButton id={"edit-color-button-" + props.label.id} onClick={() => setShowColorPopover(true)}>
                <IonIcon icon={colorPalette}/>
            </IonButton>

            {/*Color popUp*/}
            <IonPopover
                trigger={"edit-color-button-" + props.label.id} isOpen={showColorPopover}>
                <ChromePicker color={`rgb(${color[0]},${color[1]},${color[2]})`}
                    onChange={ (color: any) => {
                        const colorTuple: [number, number, number] = [color.rgb.r, color.rgb.g, color.rgb.b];
                        props.onChangeLabel(props.label.labelName, props.label.id, colorTuple);
                        setColor(colorTuple);
                    }} disableAlpha/>
            </IonPopover>

            {/*Delete popUp*/}
            <IonPopover
                trigger={"delete-label-button-" + props.label.id}
                isOpen={showDeletePopUp}
                onDidDismiss={() => setShowDeletePopUp(false)}>

                <IonContent>
                    <IonItem>
                        Do you wish to delete {props.label.labelName} ?
                    </IonItem>

                    <IonItem>
                        <IonButton onClick={() => {
                            setShowDeletePopUp(false);
                            setUserDeleteOp(false);}}>Cancel</IonButton>

                        <IonButton onClick={() => {

                            const params = {
                                label_id: props.label.id,
                            };

                            sfetch("POST", "/delete_label_annot", JSON.stringify(params), "").then(
                                (info) => {
                                    dispatch("annotationChanged", null);
                                    console.log("printing info ", info)
                                }
                            ).catch((error) => {
                                    console.log(error);
                                }
                            );

                            setShowDeletePopUp(false);
                            setUserDeleteOp(true);}}>Confirm</IonButton>
                    </IonItem>
                </IonContent>
            </IonPopover>

            {/*Edit Label component*/}
            <EditLabelNameComp
                label={props.label}
                labelNameTrigger={"edit-label-button-" + props.label.id}
                showPopover={showNamePopover}
                onChangeLabelName={(name, id) => props.onChangeLabel(name, id, props.label.color)}
                onShowPopover={handleNameEditShowPopover}/>
        </IonButtons>
    );

};

export default OptionsIcons;