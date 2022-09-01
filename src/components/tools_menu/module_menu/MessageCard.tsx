import {IonItem, IonList} from '@ionic/react';
import {ModuleCard, ModuleCardItem} from './ModuleCard';
import {useEventBus} from '../../../utils/eventbus';
import React, {useState} from "react";

const MessageCard: React.FC = () => {

    const [featureNamesList, setFeatureNamesList] = useState <string[]> ([]);

    useEventBus('selectedFeaturesNames', (feature_names_list: string[]) => {
        setFeatureNamesList(feature_names_list);
    });

    return (
        <ModuleCard name="Messages">
            <ModuleCardItem name="Selected Features">
                <IonList>
                    {featureNamesList.map((feature_name_id: string) => (
                        <IonItem>{feature_name_id}</IonItem>
                    ))}
                </IonList>
            </ModuleCardItem>
        </ModuleCard>

    );
};

export default MessageCard;
