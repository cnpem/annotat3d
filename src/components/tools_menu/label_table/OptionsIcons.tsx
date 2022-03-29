import React from "react";
import {IonButton, IonButtons, IonIcon} from "@ionic/react";

/*Icons import*/
import {closeOutline} from "ionicons/icons";

import {LabelInterface} from './LabelInterface';

interface OptionsProps{
    labelList: LabelInterface[];
    onRemoveLabel: (labelElement: LabelInterface[]) => void;
    
    id: number;
}

/**
 * Component that creates the buttons in the table label
 * @todo i need to implement the edit name
 * @todo i need to implement a option to change the color
 * @constructor
 */
const OptionsIcons: React.FC<OptionsProps> = (props: OptionsProps) => {

    const removeTheListElement = () => {
        const labelsFiltered = props.labelList.filter(label => props.id !== label.id);
        props.onRemoveLabel(labelsFiltered);
    }

    if(props.id !== 0)
    {
        return(
            <IonButtons>
                <IonButton size="small" onClick={removeTheListElement}>
                    <IonIcon icon={closeOutline}/>
                </IonButton>
            </IonButtons>
        );

    }

    return(
        <></>
    );

};

export default OptionsIcons;
