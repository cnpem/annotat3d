import React, { useState } from 'react';
import {
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
} from '@ionic/react';

import ManualThreshold from './ThresholdComponents/ManualThreshold';
import NiblackThreshold from './ThresholdComponents/NiblackThreshold';
import SauvolaThreshold from './ThresholdComponents/SauvolaThreshold';
import LocalMeanThreshold from './ThresholdComponents/LocalMeanThreshold';
import LocalGaussianThreshold from './ThresholdComponents/LocalGaussianThreshold';

interface ThresholdCardVisible {
    isVisible: boolean;
}

const ThresholdCard: React.FC<ThresholdCardVisible> = ({ isVisible }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const thresholdOptions = [
        { value: 1, label: 'Manual' },
        { value: 2, label: 'Niblack' },
        { value: 3, label: 'Sauvola' },
        { value: 4, label: 'Local Mean' },
        { value: 5, label: 'Local Gaussian' },
    ];

    const renderComponent = () => {
        switch (selectedOption) {
            case 1:
                return <ManualThreshold />;
            case 2:
                return <NiblackThreshold />;
            case 3:
                return <SauvolaThreshold />;
            case 4:
                return <LocalMeanThreshold />;
            case 5:
                return <LocalGaussianThreshold />;
            default:
                return null;
        }
    };

    return (
        <IonList>
            <IonItem>
                <IonLabel>Threshold</IonLabel>
                <IonSelect
                    aria-label="Automatic Method"
                    interface="popover"
                    placeholder="Select Automatic Method"
                    value={selectedOption}
                    onIonChange={(e) => setSelectedOption(e.detail.value)}
                >
                    {thresholdOptions.map((option) => (
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

export default ThresholdCard;