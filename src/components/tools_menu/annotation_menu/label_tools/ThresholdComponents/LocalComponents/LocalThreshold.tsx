import React, { useState } from 'react';
import { IonList, IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';

import NiblackThreshold from './NiblackThreshold';
import SauvolaThreshold from './SauvolaThreshold';
import LocalGaussianThreshold from './LocalGaussianThreshold';
import LocalMeanThreshold from './LocalMeanThreshold';

const LocalThreshold: React.FC<{ onSubOptionSelect: (option: number) => void }> = ({ onSubOptionSelect }) => {
    const [selectedSubOption, setSelectedSubOption] = useState<number | null>(null);

    const thresholdOptions = [
        { value: 1, label: 'Niblack' },
        { value: 2, label: 'Sauvola' },
        { value: 3, label: 'Local Gaussian' },
        { value: 4, label: 'Local Mean' },
    ];

    const handleSubOptionChange = (value: number) => {
        setSelectedSubOption(value);
        onSubOptionSelect(value);
    };

    const renderSubComponent = () => {
        switch (selectedSubOption) {
            case 1:
                return <NiblackThreshold />;
            case 2:
                return <SauvolaThreshold />;
            case 3:
                return <LocalGaussianThreshold />;
            case 4:
                return <LocalMeanThreshold />;
            default:
                return null;
        }
    };

    return (
        <IonList>
            <IonItem>
                <IonLabel>Local Threshold Method</IonLabel>
                <IonSelect
                    aria-label="Local Threshold Method"
                    interface="popover"
                    placeholder="Select Method"
                    value={selectedSubOption}
                    onIonChange={(e) => handleSubOptionChange(e.detail.value)}
                >
                    {thresholdOptions.map((option) => (
                        <IonSelectOption key={option.value} value={option.value}>
                            {option.label}
                        </IonSelectOption>
                    ))}
                </IonSelect>
            </IonItem>
            {renderSubComponent()}
        </IonList>
    );
};

export default LocalThreshold;
