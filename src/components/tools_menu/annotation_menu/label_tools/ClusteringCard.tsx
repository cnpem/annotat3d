import React, { useEffect, useState } from 'react';
import { IonList, IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';

import FgcCard from './FgcCard';
import NMFCard from './NMFCard';
import { dispatch } from '../../../../utils/eventbus';

interface ClusteringCardVisible {
    isVisible: boolean;
}

const ClusteringCard: React.FC<ClusteringCardVisible> = ({ isVisible }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const clusteringOptions = [
        { value: 1, label: 'Fast Graph Clustering' },
        { value: 2, label: 'Graph Regularized NMF' },
    ];

    const renderComponent = () => {
        switch (selectedOption) {
            case 1:
                return <FgcCard isVisible={true} />;
            case 2:
                return <NMFCard isVisible={true} />;
            default:
                return null;
        }
    };

    useEffect(() => {
        //only execute if the button is pressed to be deactivated
        if (!isVisible) {
            dispatch('globalThresholdPreview', {
                lower: 0,
                upper: 0,
                action: 'delete', // delete preview render in frontend
            });
        }
    }, [isVisible]);

    return (
        <IonList>
            <IonItem>
                <IonLabel>Clustering</IonLabel>
                <IonSelect
                    aria-label="Automatic Method"
                    interface="popover"
                    placeholder="Select Automatic Method"
                    value={selectedOption}
                    onIonChange={(e) => setSelectedOption(e.detail.value)}
                >
                    {clusteringOptions.map((option) => (
                        <IonSelectOption key={option.value} value={option.value}>
                            {option.label}
                        </IonSelectOption>
                    ))}
                </IonSelect>
            </IonItem>
            {renderComponent()}
        </IonList>
    );
};

export default ClusteringCard;
