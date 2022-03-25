import React, {useState} from "react";
import {
    IonButton, IonButtons, IonContent, IonIcon,
    IonInput, IonItem, IonPopover
} from "@ionic/react";

/*Icons import*/
import {closeOutline, pencilOutline} from "ionicons/icons";

import {LabelInterface} from './LabelInterface';

interface OptionsProps{
    label: LabelInterface;
    onChangeLabelList: (label: LabelInterface) => void;
    onChangeLabelName: (newLabelName: string, labelId: number) => void;
}

/**
 * Component that creates the buttons in the table label
 * @todo need to implement a option to change the color
 * @constructor
 */
const OptionsIcons: React.FC<OptionsProps> = (props: OptionsProps) => {

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

    if(props.label.id !== 0)
    {
        return(
            <IonButtons>
                <IonButton size="small" onClick={removeTheListElement}>
                    <IonIcon icon={closeOutline}/>
                </IonButton>

                <IonButton id={"edit-label-button-" + props.label.id} onClick={handleClickButton}>
                    <IonIcon icon={pencilOutline}/>
                </IonButton>
                <EditLabelNameComp
                    label={props.label}
                    labelNameTrigger={"edit-label-button-" + props.label.id}
                    showPopover={showPopover}
                    onChangeLabelName={props.onChangeLabelName}
                    onShowPopover={handleShowPopover}/>

            </IonButtons>
        );

    }

    return(
        <IonButtons>
            <IonButton id={"edit-label-button-" + props.label.id} onClick={handleClickButton}>
                <IonIcon icon={pencilOutline}/>
            </IonButton>
            <EditLabelNameComp
                label={props.label}
                labelNameTrigger={"edit-label-button-" + props.label.id}
                showPopover={showPopover}
                onChangeLabelName={props.onChangeLabelName}
                onShowPopover={handleShowPopover}/>

        </IonButtons>
    );

};

export default OptionsIcons;

interface LabelEditProps{
    label: LabelInterface;
    labelNameTrigger: string;

    showPopover: boolean;
    onShowPopover: (showPop: boolean) => void;

    onChangeLabelName: (newLabelName: string, labelId: number) => void;
}

/**
 * @todo the problem here is that newLabelName variable is not updating after any label is deleted
 * @param props
 * @constructor
 */
const EditLabelNameComp:React.FC<LabelEditProps> = (props: LabelEditProps) => {

    const [newLabelName, setNewLabelName] = useState<string>(props.label.labelName);

    const changeLabelName = (e: CustomEvent) => {
        setNewLabelName(e.detail.value!);
    }

    const exitPopup = () => {
        props.onShowPopover(false)
    }

    const handleChangeNewLabelName = () => {
        props.onChangeLabelName(newLabelName, props.label.id);
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
                        <IonInput value={newLabelName} onIonChange={changeLabelName}/>
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