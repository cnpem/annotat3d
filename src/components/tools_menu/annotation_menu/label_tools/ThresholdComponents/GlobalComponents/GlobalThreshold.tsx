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
        upper: 0,
    });

    const [selectedDimension, setSelectedDimension] = useState('2D');

    const handleValueChange = (newValues: { lower: number; upper: number }) => {
        setCurrentValue(newValues);
    };

    const [pinFormatter, setPinFormatter] = useState<(binNumber: number) => number>(
        () => (binNumber: number) => binNumber
    );

    // This is the bin index number that the user can change
    const [bin, setBin] = useState({
        lower: 0,
        upper: 254,
    });

    // Function to update bin and adjust contrast accordingly
    const updateBin = (newBin: { lower: number; upper: number }) => {
        setBin(newBin);

        // Example: Adjust contrast based on bin change (modify logic as needed)
        setCurrentValue((prevContrast) => ({
            lower: histogramData.labels[newBin.lower],
            upper: histogramData.labels[newBin.upper],
        }));
    };
    function getClosestIndex(arr: number[], target: number): number {
        return arr.reduce(
            (closestIndex, curr, index) =>
                Math.abs(curr - target) < Math.abs(arr[closestIndex] - target) ? index : closestIndex,
            0
        );
    }
    // Function to update contrast by enter
    const updateContrast = (newContrast: { lower: number; upper: number }) => {
        setCurrentValue(newContrast);
        // Example: Adjust contrast based on bin change (modify logic as needed)
        setBin((prevBin) => ({
            lower: getClosestIndex(histogramData.labels, newContrast.lower),
            upper: getClosestIndex(histogramData.labels, newContrast.upper),
        }));
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
            label: selectedLabel,
        };
        console.log('new 3D threshold', dataThreshold);

        dispatch('globalThresholdPreview', {
            lower: currentValue.lower,
            upper: currentValue.upper,
            action: 'delete', // delete preview render in frontend
        });
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
                .then((loadedHistogram: HistogramInfoPayload) => {
                    const binwithminmax = loadedHistogram.bins;
                    const datawithminmax = loadedHistogram.data;
                    binwithminmax.unshift(loadedHistogram.minValue);
                    binwithminmax.push(loadedHistogram.maxValue);
                    datawithminmax.unshift(1);
                    datawithminmax.push(1);

                    const updatedHistogram = {
                        labels: binwithminmax,
                        datasets: [
                            {
                                data: datawithminmax,
                                borderColor: ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.5)'],
                                backgroundColor: ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.5)'],
                                normalized: true,
                            },
                        ],
                    };
                    setHistogramData(updatedHistogram);
                    sethistogramMinMaxValue({ min: loadedHistogram.minValue, max: loadedHistogram.maxValue });
                    setOtsuValue(loadedHistogram.otsu); // Update the Otsu value here
                    setShowLoadingCompPS(false);

                    // Define pinFormatter based on data type
                    const newPinFormatter = (binNumber: number): number => {
                        console.log(
                            'Loaded histogram includes int?',
                            loadedHistogram.dataType.includes('int'),
                            loadedHistogram.dataType
                        );
                        return loadedHistogram.dataType.includes('int')
                            ? Math.round(loadedHistogram.bins[binNumber])
                            : Math.round(loadedHistogram.bins[binNumber] * 100) / 100;
                    };
                    setPinFormatter(() => newPinFormatter); // Update state with new function
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
                .then((loadedHistogram: HistogramInfoPayload) => {
                    // add upper and lower min to bin so user can move in the ionbar to these values
                    const binwithminmax = loadedHistogram.bins;
                    const datawithminmax = loadedHistogram.data;
                    binwithminmax.unshift(loadedHistogram.minValue);
                    binwithminmax.push(loadedHistogram.maxValue);
                    datawithminmax.unshift(1);
                    datawithminmax.push(1);
                    const updatedHistogram = {
                        labels: loadedHistogram.bins,
                        datasets: [
                            {
                                data: loadedHistogram.data,
                                borderColor: ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.5)'],
                                backgroundColor: ['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.5)'],
                                normalized: true,
                            },
                        ],
                    };
                    setHistogramData(updatedHistogram);
                    sethistogramMinMaxValue({ min: loadedHistogram.minValue, max: loadedHistogram.maxValue });
                    setOtsuValue(loadedHistogram.otsu); // Update the Otsu value here
                    setShowLoadingCompPS(false);
                    // Define pinFormatter based on data type
                    const newPinFormatter = (binNumber: number): number => {
                        console.log(
                            'Loaded histogram includes int?',
                            loadedHistogram.dataType.includes('int'),
                            loadedHistogram.dataType
                        );
                        return loadedHistogram.dataType.includes('int')
                            ? Math.round(loadedHistogram.bins[binNumber])
                            : Math.round(loadedHistogram.bins[binNumber] * 100) / 100;
                    };
                    setPinFormatter(() => newPinFormatter); // Update state with new function
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

    const apply2Dthrehsold = () => {
        const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10); // For numbers
        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10); // For numbers
        const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"'); // For strings with JSON-like quotes
        dispatch('globalThresholdPreview', {
            lower: currentValue.lower,
            upper: currentValue.upper,
            action: 'delete', // delete preview render in frontend
        });
        const dataThreshold = {
            upper_tresh: currentValue.upper,
            lower_tresh: currentValue.lower,
            current_slice: sliceValue,
            current_axis: sliceName,
            label: selectedLabel,
            new_click: true,
        };
        console.log('new click threshold?', dataThreshold);
        setLoadingMsg('Updating threshold annotation');
        setShowLoadingCompPS(true);
        void sfetch('POST', '/threshold/image', JSON.stringify(dataThreshold), 'json')
            .then((backendMarkerID) => {
                console.log('Threshold applied');
                console.log('backendMarkerID', backendMarkerID);
                dispatch('annotationChanged', null);
                setShowLoadingCompPS(false);
            })
            .catch((error) => {
                setShowLoadingCompPS(false);
                console.log('Error while applying hist', error);
            });
    };

    useEffect(() => {
        dispatch('globalThresholdPreview', {
            lower: currentValue.lower,
            upper: currentValue.upper,
            action: 'render', // Render or delete
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
                    max={histogramData.labels.length - 1}
                    min={0}
                    value={{ lower: bin.lower, upper: bin.upper }}
                    pinFormatter={pinFormatter}
                    pin={true}
                    dualKnobs={true}
                    onIonKnobMoveEnd={(e: CustomEvent) => {
                        if (e.detail.value) {
                            updateBin(e.detail.value);
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
                                                updateContrast({ upper: currentValue.upper, lower: inputValue });
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
                                                updateContrast({
                                                    upper: inputValue,
                                                    lower: currentValue.lower,
                                                });
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
                            <IonButton expand="block" onClick={() => handleApply3D()}>
                                Apply threshold as 3D Label
                            </IonButton>
                        )}
                        {selectedDimension === '2D' && (
                            <IonButton expand="block" onClick={() => apply2Dthrehsold()}>
                                Apply 2D annotation
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
