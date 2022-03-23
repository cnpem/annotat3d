import React from "react";
import {IonButton, IonButtons, IonIcon} from "@ionic/react";

/*Icons import*/
import {closeOutline} from "ionicons/icons";

import {LabelInterface} from './TypeScriptFiles/Interfaces/LabelsInterface';

interface OptionsProps{
    labelList: LabelInterface[];
    onRemoveLabel: (labelElement: LabelInterface[]) => void;
    
    onNewLabelId: (id: number) => void;
    removeId: number;
}

/**
 * Component that creates the buttons in the table label
 * @todo i need to implement the edit name
 * @todo i need to implement a option to change the color
 * @constructor
 */
const OptionsIcons: React.FC<OptionsProps> = (props: OptionsProps) => {

    const removeTheListElement = () => {
        const removeLabel = props.labelList.filter(label => props.removeId !== label.id);
        props.onRemoveLabel(removeLabel);

        if(removeLabel.length === 1)
        {
            props.onNewLabelId(0);
        }

    }

    if(props.removeId !== 0)
    {

        return(
            <IonButtons>
                <IonButton onClick={removeTheListElement}>
                    <IonIcon icon={closeOutline}/>
                </IonButton>
            </IonButtons>
        );

    }

    return(
        <></>
    )

};

export default OptionsIcons;
