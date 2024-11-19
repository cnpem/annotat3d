import React, { useState } from 'react';
import { IonList, IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';

import NiblackThreshold from './NiblackThreshold';
import SauvolaThreshold from './SauvolaThreshold';
import LocalGaussianThreshold from './LocalGaussianThreshold';
import LocalMeanThreshold from './LocalMeanThreshold';

const LocalThreshold: React.FC<{ onSubOptionSelect: (option: number) => void }> = ({ onSubOptionSelect }) => {
    const [selectedSubOption, setSelectedSubOption] = useState<number | null>(null);

    // Example default values for props
    const [kernelSize, setKernelSize] = useState(3);
    const [Sigma, setSigma] = useState(3);
    const [Range, setRange] = useState(1);
    const [Weight, setWeight] = useState(0);
    const [Threshold, setThreshold] = useState(0); // Add state for Threshold
    const showToast = (message: string, duration: number) => {
        console.log(`${message} (shown for ${duration}ms)`);
    };
    const timeToast = 3000;

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
                return (
                    <NiblackThreshold
                        Kernel={kernelSize}
                        setKernelSize={setKernelSize}
                        showToast={showToast}
                        timeToast={timeToast}
                        Weight={Weight} // Pass the Threshold state
                        setWeight={setWeight} // Pass the setThreshold function
                    />
                );
            case 2:
                return (
                    <SauvolaThreshold
                        Kernel={kernelSize}
                        setKernelSize={setKernelSize}
                        showToast={showToast}
                        timeToast={timeToast}
                        Weight={Weight} // Pass the Threshold state
                        setWeight={setWeight} // Pass the setThreshold function
                        Range={Range}
                        setRange={setRange}
                    />
                );
            case 3:
                return (
                    <LocalGaussianThreshold
                        Sigma={Sigma}
                        setSigma={setSigma}
                        showToast={showToast}
                        timeToast={timeToast}
                        Threshold={Threshold} // Pass the Threshold state
                        setThreshold={setThreshold} // Pass the setThreshold function
                    />
                );
            case 4:
                return (
                    <LocalMeanThreshold
                        Kernel={kernelSize}
                        setKernelSize={setKernelSize}
                        showToast={showToast}
                        timeToast={timeToast}
                        Threshold={Threshold} // Pass the Threshold state
                        setThreshold={setThreshold} // Pass the setThreshold function
                    />
                );
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
