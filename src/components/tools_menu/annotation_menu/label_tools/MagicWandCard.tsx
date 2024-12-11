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
    const [histogramData, setHistogramData] = useStorageState(sessionStorage, 'histogramData', baseHistogram);
    const [contrastRangeRefMaxValue, setContrastRangeRefMaxValue] = useStorageState(
        sessionStorage,
        'contrastRangeRefMaxValue',
        100
    );
    const [contrastRangeRefMinValue, setContrastRangeRefMinValue] = useStorageState(
        sessionStorage,
        'contrastRangeRefMinValue',
        0
    );
    const [contrast, setContrast] = useState({
        lower: contrastRangeRefMinValue,
        upper: contrastRangeRefMaxValue,
    });
    const [bluRadius, setBlur] = useState(0);
    //I'm using event bus to get update this, but it should use useStorageState when canvas is updated to new react logic (with react hooks)
    const [dataWand, setdataWand] = useState({
        slice: 0,
        axis: 'XY',
        label: 0,
        x_coord: 0,
        y_coord: 0,
    });
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);

    const fetchDataWand = (newClick: boolean) => {
        const updatedDataWand = {
            ...dataWand,
            upper_max: contrast.upper,
            upper_min: contrast.lower,
            blur_radius: bluRadius,
            new_click: newClick,
            max_contrast: contrastRangeRefMaxValue,
            min_contrast: contrastRangeRefMinValue,
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
                    const Tolerance = (8 * (contrastRangeRefMaxValue - contrastRangeRefMinValue)) / 100;
                    setContrast({ lower: StartValue - Tolerance, upper: StartValue + Tolerance });
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
        } else {
            dispatch('ChangeStateBrush', 'draw_brush');
        }
    }, [isVisible]);

    // Updates the datawand, and use a hooke to update the state
    useEventBus('magicwand', (data) => {
        setdataWand(data);
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
                                    max={contrastRangeRefMaxValue}
                                    min={contrastRangeRefMinValue}
                                    placeholder="Lower"
                                    onKeyUp={(e: React.KeyboardEvent) => {
                                        if (e.key === 'Enter') {
                                            const target = e.target as HTMLInputElement;
                                            const inputValue = parseFloat(target.value);
                                            if (target.value && inputValue < verticalLinePosition) {
                                                setContrast({ upper: contrast.upper, lower: inputValue });
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
                                    max={contrastRangeRefMaxValue}
                                    min={contrastRangeRefMinValue}
                                    placeholder="Upper"
                                    onKeyUp={(e: React.KeyboardEvent) => {
                                        if (e.key === 'Enter') {
                                            const target = e.target as HTMLInputElement;
                                            const inputValue = parseFloat(target.value);
                                            if (target.value && inputValue > verticalLinePosition) {
                                                setContrast({ lower: contrast.lower, upper: inputValue });
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
                    max={contrastRangeRefMaxValue}
                    min={contrastRangeRefMinValue}
                    value={{ lower: contrast.lower, upper: contrast.upper }}
                    pin={true}
                    dualKnobs={true}
                    onIonKnobMoveEnd={(e: CustomEvent) => {
                        if (e.detail.value) {
                            setContrast(e.detail.value);
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
