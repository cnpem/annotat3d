import React, { useState, useEffect } from 'react';
import { IonList, IonItem, IonLabel, IonInput, IonRange, IonGrid, IonRow, IonCol, IonButton } from '@ionic/react';
import '../../vis_menu/HistogramAlignment.css';
import { dispatch } from '../../../../utils/eventbus';
import { useStorageState } from 'react-storage-hooks';

interface ActiveContourCardProps {
    isVisible: boolean;
}

const ActiveContourCard: React.FC<ActiveContourCardProps> = ({ isVisible }) => {
    // Retrieve and store the parameters in sessionStorage
    const [iterations, setIterations] = useStorageState<number>(sessionStorage, 'ActiveContourIterations', 10);
    const [smoothing, setSmoothing] = useStorageState<number>(sessionStorage, 'ActiveContourSmoothing', 4);
    const [weight, setWeight] = useStorageState<number>(sessionStorage, 'ActiveContourWeight', 1.0);

    useEffect(() => {
        if (isVisible) {
            dispatch('ChangeStateBrush', 'active_contour');
        } else {
            dispatch('ChangeStateBrush', 'draw_brush');
        }
    }, [isVisible]);

    const handleValueChange = (key: string, value: string | number) => {
        const parsedValue = key === 'weight' ? parseFloat(value as string) : parseInt(value as string, 10);
        if (!isNaN(parsedValue)) {
            switch (key) {
                case 'iterations':
                    setIterations(parsedValue);
                    break;
                case 'smoothing':
                    setSmoothing(parsedValue);
                    break;
                case 'weight':
                    setWeight(parsedValue);
                    break;
            }
        }
    };

    return (
        <IonList>
            <IonItem>
                <IonLabel>Iterations</IonLabel>
                <IonInput
                    type="number"
                    inputMode="numeric"
                    value={iterations}
                    onIonChange={(e: CustomEvent) => handleValueChange('iterations', e.detail.value!)}
                    placeholder="Enter number of iterations"
                />
            </IonItem>
            <IonItem>
                <IonLabel>Smoothing</IonLabel>
                <IonRange
                    min={0}
                    max={4}
                    step={1}
                    pin={true}
                    snaps={true}
                    onIonKnobMoveEnd={(e: CustomEvent) => handleValueChange('smoothing', e.detail.value!)}
                />
            </IonItem>
            <IonItem>
                <IonLabel>Weight</IonLabel>
                <IonInput
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onIonChange={(e: CustomEvent) => handleValueChange('weight', e.detail.value!)}
                    placeholder="Enter weight value"
                />
            </IonItem>
            <IonItem>
                <IonButton
                    onClick={() => {
                        // Dispatch event with current parameters
                        const parameters = { iterations, smoothing, weight };
                        console.log('Active Contour Parameters:', parameters);
                        dispatch('ActiveContourParamsUpdated', parameters);
                    }}
                >
                    Apply
                </IonButton>
            </IonItem>
        </IonList>
    );
};

export default ActiveContourCard;
