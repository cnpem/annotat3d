import React, { useState, useEffect } from 'react';
import {
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonRange,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonRadio,
    IonRadioGroup,
    IonTitle,
} from '@ionic/react';
import ThresholdHistogram from './ThresholdHistogram';
import { HistogramInfoPayload } from '../../../../../../components/main_menu/file/utils/HistogramInfoInterface';
import { sfetch } from '../../../../../../utils/simplerequest';
import { dispatch } from '../../../../../../utils/eventbus';

import LoadingComponent from '../../../../utils/LoadingComponent';

//Vs-code is complaining about the svg file, so I disbaled the warning
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import enter from '../../../../../../public/icon-park-solid--enter-key.svg';
import '../../../../vis_menu/HistogramAlignment.css';

const GlobalThreshold: React.FC = () => {
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingCompPS, setShowLoadingCompPS] = useState<boolean>(false);
    const [markerID, setMarkerId] = useState<number>(-1);

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
 */
        },
    };

    const [histogramData, setHistogramData] = useState(baseHistogram);
    const [histogramMinMaxValue, sethistogramMinMaxValue] = useState({
        max: 0,
        min: 100,
    });

    const [otsuValue, setOtsuValue] = useState<number>(0);
    const [currentValue, setCurrentValue] = useState({
        lower: 0,
        upper: 100,
    });

    const [selectedDimension, setSelectedDimension] = useState('2D');

    const handleValueChange = (newValues: { lower: number; upper: number }) => {
        setCurrentValue(newValues);
    };

    const handleApply3D = () => {
        // This function will be called when the Apply button is clicked
        setLoadingMsg('Applying 3D threshold');
        setShowLoadingCompPS(true);
        console.log('Applying 3D threshold with values:', currentValue);
        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10); // For numbers
        const dataThreshold = {
            upper_thresh: currentValue.upper,
            lower_thresh: currentValue.lower,
            curret_thresh_marker: markerID,
            label: selectedLabel,
        };
        console.log('new 3D threshold', dataThreshold);
        void sfetch('POST', '/threshold_apply3D/image/label', JSON.stringify(dataThreshold), 'json')
            .then((backendMarkerID) => {
                console.log('3D Threshold applied in label');
                dispatch('labelChanged', '');
                setShowLoadingCompPS(false);
            })
            .catch((error) => {
                setShowLoadingCompPS(false);
                console.log('Error while applying hist', error);
            });
    };
    //Change this to sfetch to load histogram from backend
    const fetchHistogramData = () => {
        if (selectedDimension === '2D') {
            const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10); // For numbers
            const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"'); // For strings with JSON-like quotes
            // Fetch or compute 2D histogram data
            const params = {
                axis: sliceName,
                slice: sliceValue,
            };
            setLoadingMsg('Loading 2D histogram');
            setShowLoadingCompPS(true);
            sfetch('POST', '/get_image_histogram/image', JSON.stringify(params), 'json')
                .then((histogram: HistogramInfoPayload) => {
                    const updatedHistogram = {
                        labels: histogram.bins,
                        datasets: [
                            {
                                data: histogram.data,
                                borderColor: ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.5)'],
                                backgroundColor: ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.5)'],
                                normalized: true,
                            },
                        ],
                    };
                    setHistogramData(updatedHistogram);
                    sethistogramMinMaxValue({ min: histogram.minValue, max: histogram.maxValue });
                    setOtsuValue(histogram.otsu); // Update the Otsu value here
                    setShowLoadingCompPS(false);
                })
                .catch((error) => {
                    console.log('Error while acquiring histogram');
                    console.log(error.error_msg);
                    setShowLoadingCompPS(false);
                });
        } else if (selectedDimension === '3D') {
            // Fetch or compute 3D histogram data
            const params = {
                axis: 'XY',
                slice: -1,
            };
            setLoadingMsg('Loading 3D histogram \n (calculated for the whole image)');
            setShowLoadingCompPS(true);
            sfetch('POST', '/get_image_histogram/image', JSON.stringify(params), 'json')
                .then((histogram: HistogramInfoPayload) => {
                    const updatedHistogram = {
                        labels: histogram.bins,
                        datasets: [
                            {
                                data: histogram.data,
                                borderColor: ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.5)'],
                                backgroundColor: ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.5)'],
                                normalized: true,
                            },
                        ],
                    };
                    setHistogramData(updatedHistogram);
                    sethistogramMinMaxValue({ min: histogram.minValue, max: histogram.maxValue });
                    setOtsuValue(histogram.otsu); // Update the Otsu value here
                    setShowLoadingCompPS(false);
                })
                .catch((error) => {
                    console.log('Error while acquiring histogram');
                    console.log(error.error_msg);
                    setShowLoadingCompPS(false);
                });
        }
    };

    useEffect(() => {
        fetchHistogramData();
    }, [selectedDimension]); // Effect will run when selectedDimension changes[

    useEffect(() => {
        const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10); // For numbers
        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10); // For numbers
        const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"'); // For strings with JSON-like quotes

        const dataThreshold = {
            upper_tresh: currentValue.upper,
            lower_tresh: currentValue.lower,
            current_slice: sliceValue,
            current_axis: sliceName,
            label: selectedLabel,
            curret_thresh_marker: markerID,
        };
        console.log('new click threshold?', dataThreshold);
        void sfetch('POST', '/threshold/image', JSON.stringify(dataThreshold), 'json')
            .then((backendMarkerID) => {
                console.log('Threshold applied');
                setMarkerId(backendMarkerID);
                console.log('backendMarkerID', backendMarkerID);
                dispatch('annotationChanged', null);
            })
            .catch((error) => {
                console.log('Error while applying hist', error);
            });
    }, [currentValue]);

    return (
        <IonList>
            <IonItem>
                <IonRadioGroup
                    value={selectedDimension}
                    onIonChange={(e) => setSelectedDimension(e.detail.value)} // Use new handler
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
                    <IonRow class="ion-justify-content-center">
                        {selectedDimension === '3D' && (
                            <IonButton expand="block" onClick={handleApply3D}>
                                Apply 3D Threshold as Label
                            </IonButton>
                        )}
                    </IonRow>
                </IonGrid>
                <LoadingComponent openLoadingWindow={showLoadingCompPS} loadingText={loadingMsg} />
            </IonItem>

            <IonItem>
                <IonLabel>Otsu Value: {otsuValue}</IonLabel>
            </IonItem>
        </IonList>
    );
};

export default GlobalThreshold;
