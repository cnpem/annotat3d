import React, { useState, useEffect } from 'react';
import {
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonToggle,
    IonRange,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonRadio,
    IonRadioGroup,
} from '@ionic/react';
import ThresholdHistogram from './ThresholdHistogram';
import OtsuThreshold from './OtsuThreshold';

import enter from '../../../../../public/icon-park-solid--enter-key.svg';
import '../../../vis_menu/HistogramAlignment.css';
const ManualThreshold: React.FC = () => {

    const baseHistogram = {
        labels: [0],
        datasets: [
            {
                data: [0, 0],
                borderColor: ['rgba(53, 162, 235, 0.5)', 'rgba(53, 162, 235, 0.5)'],
                backgroundColor: ['rgba(53, 162, 235, 0.5)', 'rgba(53, 162, 235, 0.5)'],
                normalized: true,
            },
        ],
    };
    const histogramOptions = {
        responsive: true,
        maintainAspectRatio: true, // Set this to true
        aspectRatio: 4, // Adjust this value to change the height. Higher values make it shorter.
        layout: {
            padding: {
                right: 0, // Adjust this value as needed
                bottom: 0,
            },
        },
        scales: {
            y: {
                display: true,
                border: {
                    display: false,
                },
                grid: {
                    display: true,
                },
                ticks: {
                    display: false,
                },
            },
            x: {
                display: true,
                border: {
                    display: false,
                },
                grid: {
                    display: true,
                },
                ticks: {
                    display: false,
                    maxTicksLimit: 5, // Adjust this number to control the number of gridlines
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: true,
            },
/*             hover: {
                mode: null, // Disable hover effects
            },
            events: [],
 */        },
    };

    const [histogramData, setHistogramData] = useState(baseHistogram);
    const [histogramMinMaxValue, sethistogramMinMaxValue] = useState({
        max: 0,
        min: 100,
    });

    const [currentValue, setCurrentValue] = useState({
        lower: 0,
        upper: 100,
    });

    const [selectedDimension, setSelectedDimension] = useState('2D');

    // This is a demon component, need to render the proper annotation for this
    useEffect(() => {
        console.log('Threshold value changed');
    }, [currentValue]);
    
    const handleValueChange = (newValues: { lower: number; upper: number }) => {
        setCurrentValue(newValues);
    };

    //Change this to sfetch to load histogram from backend
    const fetchHistogramData = () => {
        if (selectedDimension === '2D') {
            // Fetch or compute 2D histogram data
            const fetched2DData = {
                labels: [0, 1, 2, 3, 4],
                datasets: [
                    {
                        data: [10, 20, 30, 40, 50],
                        borderColor: ['rgba(53, 162, 235, 0.5)'],
                        backgroundColor: ['rgba(53, 162, 235, 0.5)'],
                        normalized: true,
                    },
                ],
            };
            setHistogramData(fetched2DData);
            sethistogramMinMaxValue({ min: 0, max: 4 });
        } else if (selectedDimension === '3D') {
            // Fetch or compute 3D histogram data
            const fetched3DData = {
                labels: [0, 1, 2, 3, 4],
                datasets: [
                    {
                        data: [15, 25, 35, 45, 55],
                        borderColor: ['rgba(53, 162, 235, 0.5)'],
                        backgroundColor: ['rgba(53, 162, 235, 0.5)'],
                        normalized: true,
                    },
                ],
            };
            setHistogramData(fetched3DData);
            sethistogramMinMaxValue({ min: 0, max: 4 });
        }
    };

    useEffect(() => {
        fetchHistogramData();
    }, [selectedDimension]); // Effect will run when selectedDimension changes

    return (
        <IonList>
        <IonItem>
        <IonRadioGroup 
            value={selectedDimension} 
            onIonChange={(e) => setSelectedDimension(e.detail.value)}
            style={{ width: '100%' }}
        >
            <IonGrid>
            <IonRow class="ion-justify-content-center ion-align-items-center">
                <IonCol size="auto">
                <IonItem lines="none">
                    <IonRadio slot="start" value="2D" />
                    <IonLabel>2D</IonLabel>
                </IonItem>
                </IonCol>
                <IonCol size="auto">
                <IonItem lines="none">
                    <IonRadio slot="start" value="3D" />
                    <IonLabel>3D</IonLabel>
                </IonItem>
                </IonCol>
            </IonRow>
            </IonGrid>
        </IonRadioGroup>
        </IonItem>

        <IonItem>
        <IonGrid>
                <IonRow>
                    <IonCol>
                        <IonItem>
                            <IonInput
                                inputMode="numeric"
                                max={histogramMinMaxValue.max}
                                min={histogramMinMaxValue.min}
                                placeholder={`${currentValue.lower}`}
                                onKeyUp={(e: React.KeyboardEvent) => {
                                    if (e.key === 'Enter') {
                                        const target = e.target as HTMLInputElement;
                                        const inputValue = parseFloat(target.value);
                                        if (target.value && inputValue > histogramMinMaxValue.min) {
                                            setCurrentValue({ lower: currentValue.lower, upper: inputValue });
                                        }
                                    }
                                }}
                            />
                            <IonIcon src={enter} slot="end" size="small"></IonIcon>
                        </IonItem>
                    </IonCol>
                    <IonCol>
                        <IonItem>
                            <IonInput
                                inputMode="numeric"
                                max={histogramMinMaxValue.max}
                                min={histogramMinMaxValue.min}
                                placeholder={`${currentValue.upper}`}
                                onKeyUp={(e: React.KeyboardEvent) => {
                                    if (e.key === 'Enter') {
                                        const target = e.target as HTMLInputElement;
                                        const inputValue = parseFloat(target.value);
                                        if (target.value && inputValue < histogramMinMaxValue.max) {
                                            setCurrentValue({ upper: currentValue.upper, lower: inputValue });
                                        }
                                    }
                                }}
                            />
                            <IonIcon src={enter} slot="end" size="small"></IonIcon>
                        </IonItem>
                    </IonCol>
                </IonRow>
            </IonGrid>
            </IonItem>

                <div className="alignment-container">
                    <ThresholdHistogram
                        histogramData={histogramData}
                        histogramOptions={histogramOptions}
                        verticalLine1Position={currentValue.lower}
                        verticalLine2Position={currentValue.upper}
                    />
                <IonRange
                    className="custom-range"
                    step={1}
                    max={histogramMinMaxValue.max}
                    min={histogramMinMaxValue.min}
                    value={{ lower: currentValue.lower, upper: currentValue.upper }}
                    pin={true}
                    dualKnobs={true}
                    onIonKnobMoveEnd={(e: CustomEvent) => {
                        if (e.detail.value) {
                            setCurrentValue(e.detail.value);
                        }
                    }}
                ></IonRange>
                </div>

            <IonItem>
                <OtsuThreshold
                    lower={currentValue.lower}
                    upper={currentValue.upper}
                    onChange={handleValueChange}
                />
            </IonItem>
        </IonList>
    );
};

export default ManualThreshold;
