import React, { useState, useRef, useEffect } from 'react';
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
} from '@ionic/react';
import '../../vis_menu/HistogramAlignment.css';
import MagicWandHistogram from './MagicWandHistogram';
import { dispatch, useEventBus } from '../../../../utils/eventbus';
import { useStorageState } from 'react-storage-hooks';
import { sfetch } from '../../../../utils/simplerequest';
import enter from '../../../../public/icon-park-solid--enter-key.svg';
import LoadingComponent from '../../utils/LoadingComponent';
import { HistogramInfoPayload } from '../../../main_menu/file/utils/HistogramInfoInterface';

interface MagicWandCardProps {
    isVisible: boolean;
}

const MagicWandCard: React.FC<MagicWandCardProps> = ({ isVisible }) => {
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
                enabled: false,
            },
            hover: {
                mode: null, // Disable hover effects
            },
            events: [],
        },
    };
    const skipEffectRef = useRef(false);
    const [smoothingEnabled, setSmoothingEnabled] = useState(false);
    const smoothingRef = useRef<HTMLDivElement>(null);

    const [verticalLinePosition, setVerticaline] = useStorageState(sessionStorage, 'verticalLinePosition', 0);
    //get saved state from the same key, 'histogramData' in vis_menu and contrast min and max
    const [histogramData, setHistogramData] = useState(baseHistogram);

    // This is the bin index number that the user can change
    const [bin, setBin] = useState({
        lower: 0,
        upper: 254,
    });

    const [pinFormatter, setPinFormatter] = useState<(binNumber: number) => number>(
        () => (binNumber: number) => binNumber
    );

    const [contrast, setContrast] = useState({
        lower: 0,
        upper: 100,
    });
    const [histogramMinMaxValue, sethistogramMinMaxValue] = useState({
        max: 0,
        min: 100,
    });

    // Function to update bin and adjust contrast accordingly
    const updateBin = (newBin: { lower: number; upper: number }) => {
        setBin(newBin);

        // Example: Adjust contrast based on bin change (modify logic as needed)
        setContrast((prevContrast) => ({
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
        setContrast(newContrast);
        // Example: Adjust contrast based on bin change (modify logic as needed)
        setBin((prevBin) => ({
            lower: getClosestIndex(histogramData.labels, newContrast.lower),
            upper: getClosestIndex(histogramData.labels, newContrast.upper),
        }));
    };
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    //Change this to sfetch to load histogram from backend
    const fetchHistogramData = () => {
        const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10); // For numbers
        const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"'); // For strings with JSON-like quotes
        // Fetch or compute 2D histogram data
        const params = {
            axis: sliceName,
            slice: sliceValue,
        };
        setLoadingMsg('Loading 2D histogram');
        setShowLoadingComp(true);
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

                setHistogramData(updatedHistogram);
                sethistogramMinMaxValue({ min: loadedHistogram.minValue, max: loadedHistogram.maxValue });
                setShowLoadingComp(false);
            })
            .catch((error) => {
                console.log('Error while acquiring histogram');
                console.log(error.error_msg);
                setShowLoadingComp(false);
            });
    };

    const [bluRadius, setBlur] = useState(0);
    //I'm using event bus to get update this, but it should use useStorageState when canvas is updated to new react logic (with react hooks)
    const [dataWand, setdataWand] = useState({
        slice: 0,
        axis: 'XY',
        label: 0,
        x_coord: 0,
        y_coord: 0,
    });

    const fetchDataWand = (newClick: boolean) => {
        const updatedDataWand = {
            ...dataWand,
            upper_max: contrast.upper,
            upper_min: contrast.lower,
            blur_radius: bluRadius,
            new_click: newClick,
            max_contrast: histogramMinMaxValue.max,
            min_contrast: histogramMinMaxValue.min,
        };
        console.log('Applying MagicWand');
        setLoadingMsg('Applying wand and updating annotation');
        setShowLoadingComp(true);
        void sfetch('POST', '/magic_wand/image', JSON.stringify(updatedDataWand), 'json')
            .then((StartValue: number) => {
                console.log('Magic wand applied!', 'Center pixel:', StartValue);
                setVerticaline(StartValue);
                dispatch('annotationChanged', null);
                setShowLoadingComp(false);
                //change bars for when is a new click
                if (newClick) {
                    skipEffectRef.current = true;
                    // Tolerance is set to 8% of the width in histogram
                    const Tolerance = (8 * (histogramMinMaxValue.max - histogramMinMaxValue.min)) / 100;
                    updateContrast({ lower: StartValue - Tolerance, upper: StartValue + Tolerance });
                }
            })
            .catch((error) => {
                setShowLoadingComp(false);
                console.log('Error while applying hist', error);
            });
    };

    useEffect(() => {
        //only execute if the button is pressed
        if (isVisible) {
            dispatch('ChangeStateBrush', 'magic_wand');
            fetchHistogramData();
        } else {
            dispatch('ChangeStateBrush', 'draw_brush');
        }
    }, [isVisible]);

    // Updates the datawand, and use a hooke to update the state
    useEventBus('magicwand', (data) => {
        setdataWand(data);
    });

    // Reload when slice is changed
    useEventBus('sliceChanged', (payload) => {
        if (isVisible) {
            fetchHistogramData();
        }
    });
    // Its not possible to use eventbus, as it doesn't rerender, so, we need to use a new react hook for updates in isVisible
    useEffect(() => {
        //only execute if the button is pressed
        if (isVisible) {
            console.log('fetchDataWand(true)');
            fetchDataWand(true);
        }
    }, [dataWand]);

    // This is execute when new configuration changes
    useEffect(() => {
        // ignore contrast change for the first click
        if (skipEffectRef.current) {
            skipEffectRef.current = false;
            return;
        }

        //only execute if the button is pressed
        if (isVisible) {
            console.log('fetchDataWand(false)');
            fetchDataWand(false);
        }
    }, [contrast, bluRadius]);

    // enable smotthing and set to 0 if its not enabled
    useEffect(() => {
        if (smoothingEnabled && smoothingRef.current) {
            smoothingRef.current.scrollIntoView({ block: 'start' });
        } else if (!smoothingEnabled) {
            setBlur(0);
        }
    }, [smoothingEnabled]);

    return (
        <IonList>
            <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={loadingMsg} />

            <IonItem>
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <IonItem>
                                <IonInput
                                    inputMode="numeric"
                                    max={histogramMinMaxValue.max}
                                    min={histogramMinMaxValue.min}
                                    placeholder="Lower"
                                    onKeyUp={(e: React.KeyboardEvent) => {
                                        if (e.key === 'Enter') {
                                            const target = e.target as HTMLInputElement;
                                            const inputValue = parseFloat(target.value);
                                            if (target.value && inputValue < verticalLinePosition) {
                                                updateContrast({ upper: contrast.upper, lower: inputValue });
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
                                    placeholder="Upper"
                                    onKeyUp={(e: React.KeyboardEvent) => {
                                        if (e.key === 'Enter') {
                                            const target = e.target as HTMLInputElement;
                                            const inputValue = parseFloat(target.value);
                                            if (target.value && inputValue > verticalLinePosition) {
                                                updateContrast({ lower: contrast.lower, upper: inputValue });
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
                <MagicWandHistogram
                    histogramData={histogramData}
                    histogramOptions={histogramOptions}
                    verticalLinePosition={verticalLinePosition}
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
                <IonLabel>Smoothing</IonLabel>
                <IonToggle checked={smoothingEnabled} onIonChange={(e) => setSmoothingEnabled(e.detail.checked)} />
            </IonItem>
            {smoothingEnabled && (
                <div ref={smoothingRef}>
                    <IonItem>
                        <IonRange
                            min={0}
                            max={30}
                            step={1}
                            pin={true}
                            snaps={true}
                            onIonKnobMoveEnd={(e: CustomEvent) => {
                                if (e.detail.value) {
                                    setBlur(e.detail.value);
                                }
                            }}
                        />
                    </IonItem>
                </div>
            )}
        </IonList>
    );
};

export default MagicWandCard;
