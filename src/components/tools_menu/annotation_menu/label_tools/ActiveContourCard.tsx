import React, { useEffect, useState } from 'react';
import {
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonRange,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonToggle,
    IonSelect,
    IonSelectOption,
} from '@ionic/react';
import '../../vis_menu/HistogramAlignment.css';
import { dispatch } from '../../../../utils/eventbus';
import { useStorageState } from 'react-storage-hooks';

interface ActiveContourCardProps {
    isVisible: boolean;
}

const ActiveContourCard: React.FC<ActiveContourCardProps> = ({ isVisible }) => {
    const [method, setMethod] = useStorageState<string>(sessionStorage, 'ActiveContourMethod', 'chan-vese');

    // Parameters for Chan-Vese Active Contour
    const [iterations, setIterations] = useStorageState<number>(sessionStorage, 'ActiveContourIterations', 10);
    const [smoothing, setSmoothing] = useStorageState<number>(sessionStorage, 'ActiveContourSmoothing', 4);
    const [weight, setWeight] = useStorageState<number>(sessionStorage, 'ActiveContourWeight', 1.0);

    // Parameters for Geodesic Active Contour
    const [threshold, setThreshold] = useStorageState<number>(sessionStorage, 'GeodesicThreshold', 0.5);
    const [balloonForce, setBalloonForce] = useStorageState<boolean>(sessionStorage, 'BalloonForce', true);
    const [sigma, setSigma] = useStorageState<number>(sessionStorage, 'GeodesicSigma', 1.0);

    useEffect(() => {
        if (isVisible) {
            dispatch('ChangeStateBrush', 'snakes');
        } else {
            dispatch('ChangeStateBrush', 'draw_brush');
        }
    }, [isVisible]);

    const handleValueChange = (key: string, value: string | number | boolean) => {
        const parsedValue =
            key === 'weight' || key === 'threshold'
                ? parseFloat(value as string)
                : key === 'balloonForce'
                ? (value as boolean)
                : parseInt(value as string, 10);

        if (!isNaN(parsedValue as number) || typeof parsedValue === 'boolean') {
            switch (key) {
                case 'iterations':
                    setIterations(parsedValue as number);
                    break;
                case 'smoothing':
                    setSmoothing(parsedValue as number);
                    break;
                case 'weight':
                    setWeight(parsedValue as number);
                    break;
                case 'sigma':
                    setSigma(parsedValue as number);
                    break;
                case 'threshold':
                    setThreshold(parsedValue as number);
                    break;
                case 'balloonForce':
                    setBalloonForce(parsedValue as boolean);
                    break;
            }
        }
    };

    return (
        <IonGrid>
            <IonRow>
                <IonCol size="12">
                    <IonList>
                        {/* Title */}
                        <IonItem>
                            <IonLabel className="ion-text-center">
                                <h2>Morphological Snakes Settings</h2>
                            </IonLabel>
                        </IonItem>

                        {/* Method Selector */}
                        <IonItem>
                            <IonLabel position="stacked">Method</IonLabel>
                            <IonSelect
                                value={method}
                                onIonChange={(e) => setMethod(e.detail.value)}
                                interface="popover"
                            >
                                <IonSelectOption value="chan-vese">Chan-Vese</IonSelectOption>
                                <IonSelectOption value="geodesic">Geodesic</IonSelectOption>
                            </IonSelect>
                        </IonItem>

                        {/* Chan-Vese Parameters */}
                        {method === 'chan-vese' && (
                            <>
                                <IonItem>
                                    <IonLabel position="stacked">Iterations</IonLabel>
                                    <IonInput
                                        type="number"
                                        inputMode="numeric"
                                        value={iterations}
                                        onIonChange={(e: CustomEvent) =>
                                            handleValueChange('iterations', e.detail.value!)
                                        }
                                        placeholder="Enter number of iterations"
                                    />
                                </IonItem>

                                <IonItem>
                                    <IonLabel position="stacked">Smoothing</IonLabel>
                                    <IonRange
                                        min={0}
                                        max={4}
                                        step={1}
                                        pin={true}
                                        snaps={true}
                                        value={smoothing}
                                        onIonKnobMoveEnd={(e: CustomEvent) =>
                                            handleValueChange('smoothing', e.detail.value!)
                                        }
                                    />
                                </IonItem>

                                <IonItem>
                                    <IonLabel position="stacked">Weight</IonLabel>
                                    <IonInput
                                        type="number"
                                        inputMode="decimal"
                                        value={weight}
                                        onIonChange={(e: CustomEvent) => handleValueChange('weight', e.detail.value!)}
                                        placeholder="Enter weight value"
                                    />
                                </IonItem>
                            </>
                        )}

                        {/* Geodesic Parameters */}
                        {method === 'geodesic' && (
                            <>
                                <IonItem>
                                    <IonLabel position="stacked">Iterations</IonLabel>
                                    <IonInput
                                        type="number"
                                        inputMode="numeric"
                                        value={iterations}
                                        onIonChange={(e: CustomEvent) =>
                                            handleValueChange('iterations', e.detail.value!)
                                        }
                                        placeholder="Enter number of iterations"
                                    />
                                </IonItem>

                                <IonItem>
                                    <IonLabel position="stacked">Sigma</IonLabel>
                                    <IonInput
                                        type="number"
                                        inputMode="decimal"
                                        value={sigma}
                                        onIonChange={(e: CustomEvent) => handleValueChange('sigma', e.detail.value!)}
                                        placeholder="Enter sigma"
                                    />
                                </IonItem>

                                <IonItem>
                                    <IonLabel position="stacked">Threshold</IonLabel>
                                    <IonInput
                                        type="number"
                                        inputMode="decimal"
                                        value={threshold}
                                        onIonChange={(e: CustomEvent) =>
                                            handleValueChange('threshold', e.detail.value!)
                                        }
                                        placeholder="Enter threshold value"
                                    />
                                </IonItem>

                                <IonItem>
                                    <IonLabel position="stacked">Balloon Force</IonLabel>
                                    <IonToggle
                                        checked={balloonForce}
                                        onIonChange={(e: CustomEvent) =>
                                            handleValueChange('balloonForce', e.detail.checked)
                                        }
                                    />
                                </IonItem>

                                <IonItem>
                                    <IonLabel position="stacked">Smoothing</IonLabel>
                                    <IonRange
                                        min={0}
                                        max={4}
                                        step={1}
                                        pin={true}
                                        snaps={true}
                                        value={smoothing}
                                        onIonKnobMoveEnd={(e: CustomEvent) =>
                                            handleValueChange('smoothing', e.detail.value!)
                                        }
                                    />
                                </IonItem>
                            </>
                        )}
                    </IonList>
                </IonCol>
            </IonRow>
        </IonGrid>
    );
};

export default ActiveContourCard;
