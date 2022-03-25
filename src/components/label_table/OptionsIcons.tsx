import React, {useState} from "react";
import {IonButton, IonButtons, IonContent, IonIcon,
        IonInput, IonItem, IonPopover} from "@ionic/react";

/*Icons import*/
import {closeOutline, pencilOutline} from "ionicons/icons";

import {LabelInterface} from './LabelInterface';

interface OptionsProps{
    label: LabelInterface;
    onChangeLabelList: (label: LabelInterface) => void;
    onChangeLabelName: (newLabelName: string, labelId: number) => void;

    id: number;
    onResetId: (id: number) => void;
}

/**
 * Component that creates the buttons in the table label
 * @todo i need to implement the edit name
 * @todo i need to implement a option to change the color
 * @constructor
 */
const OptionsIcons: React.FC<OptionsProps> = (props: OptionsProps) => {

    const labelName = props.label.labelName;
    const [showPopover, setShowPopover] = useState<boolean>(false);

    const handleClickButton = () => {
        setShowPopover(true)
    }

    const handleShowPopover = (showPop: boolean) => {
        setShowPopover(showPop);
    }

    const removeTheListElement = () => {
        props.onChangeLabelList(props.label);
    }

    if(props.id !== 0)
    {
        return(
            <IonButtons>
                <IonButton size="small" onClick={removeTheListElement}>
                    <IonIcon icon={closeOutline}/>
                </IonButton>

                <IonButton id={"edit-label-button-" + props.id} onClick={handleClickButton}>
                    <IonIcon icon={pencilOutline}/>
                </IonButton>
                <EditLabelNameComp
                    labelNameTrigger={"edit-label-button-" + props.id}
                    labelName={labelName}
                    id={props.id}
                    showPopover={showPopover}
                    onChangeLabelName={props.onChangeLabelName}
                    onShowPopover={handleShowPopover}/>

            </IonButtons>
        );

    }

    return(
        <></>
    );

};

export default OptionsIcons;

interface LabelEditProps{
    labelNameTrigger: string;
    labelName: string;
    id: number

    showPopover: boolean;
    onShowPopover: (showPop: boolean) => void;

    onChangeLabelName: (newLabelName: string, labelId: number) => void;
}

const EditLabelNameComp:React.FC<LabelEditProps> = (props: LabelEditProps) => {

    const [newLabelName, setNewLabelName] = useState<string>(props.labelName);

    const changeLabelName = (e: CustomEvent) => {
        setNewLabelName(e.detail.value!);
    }

    const exitPopup = () => {
        props.onShowPopover(false)
        setNewLabelName(props.labelName);
    }

    const handleChangeNewLabelName = () => {
        props.onChangeLabelName(newLabelName, props.id);
        props.onShowPopover(false)
    }

    return(
        <React.Fragment>
            <IonPopover
                trigger={props.labelNameTrigger}
                isOpen={props.showPopover}
                onDidDismiss={exitPopup}
                className={"label-editor-popover"}>
                <IonContent>
                    <IonItem>
                        <IonInput type={"text"} value={newLabelName} onIonChange={changeLabelName}/>
                    </IonItem>

                    <IonItem>
                        <IonButton onClick={exitPopup}>Cancel</IonButton>
                        <IonButton onClick={handleChangeNewLabelName}>Confirm</IonButton>
                    </IonItem>

                </IonContent>
            </IonPopover>
        </React.Fragment>
    );

}