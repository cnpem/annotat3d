import React, { useEffect, useState } from 'react';
import { IonList, IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';

import GlobalThreshold from './ThresholdComponents/GlobalComponents/GlobalThreshold';
import LocalThreshold from './ThresholdComponents/LocalComponents/LocalThreshold';
import { dispatch } from '../../../../utils/eventbus';

interface ThresholdCardVisible {
    isVisible: boolean;
}

const ThresholdCard: React.FC<ThresholdCardVisible> = ({ isVisible }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const thresholdOptions = [
        { value: 1, label: 'Global Threshold' },
        { value: 2, label: 'Local Threshold' },
    ];

    const renderComponent = () => {
        switch (selectedOption) {
            case 1:
                return <GlobalThreshold />;
            case 2:
                return <LocalThreshold onSubOptionSelect={(subOption) => console.log(subOption)} />;
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
