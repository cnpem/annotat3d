import React, {useState} from "react";
import {IonButton, IonButtons, IonContent, IonIcon,
        IonInput, IonItem, IonPopover} from "@ionic/react";

/*Icons import*/
import {closeOutline, pencilOutline} from "ionicons/icons";

import {LabelInterface} from './LabelInterface';

interface OptionsProps{
    labelList: LabelInterface[];
    onChangeLabelList: (labelElement: LabelInterface[]) => void;

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

    const [labelName, setLabelName] = useState<string>(props.labelList.filter(label => props.id === label.id)[0].labelName);
    const [showPopover, setShowPopover] = useState<boolean>(false);

    const handleClickButton = () => {

        setLabelName(props.labelList.filter(label => props.id === label.id)[0].labelName);
        setShowPopover(true)
        console.log(labelName);

    }

    const handleShowPopover = (showPop: boolean) => {
        setShowPopover(showPop);
    }

    const removeTheListElement = () => {
        const labelsFiltered = props.labelList.filter(label => props.id !== label.id);
        setLabelName(props.labelList.filter(label => props.id === label.id)[0].labelName);
        props.onChangeLabelList(labelsFiltered);

        if(labelsFiltered.length === 1)
        {

            props.onResetId(0);

        }

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
                    labelList={props.labelList}
                    onChangeLabelName={props.onChangeLabelList}
                    id={props.id}
                    showPopover={showPopover}
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

    labelList: LabelInterface[];
    onChangeLabelName: (labelElement: LabelInterface[]) => void;
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
        props.onChangeLabelName(
            props.labelList.map((label) =>
                label.id === props.id
                    ? {...label, labelName: newLabelName}
                    : {...label})
        );

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