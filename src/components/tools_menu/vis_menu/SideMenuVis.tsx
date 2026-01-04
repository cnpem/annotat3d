import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IonCard, IonCardContent, IonRange, IonLabel, IonToggle, IonItem } from '@ionic/react';
import { dispatch, useEventBus } from '../../../utils/eventbus';
import { useStorageState } from 'react-storage-hooks';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import colormap from 'colormap';
// ignoring types for react-color, as it seems broken
import { AlphaPicker, SliderPicker } from 'react-color';
import CropMenu from './CropMenu';
import { ImageShapeInterface } from '../utils/ImageShapeInterface';
import { HistogramInfoPayload } from '../../main_menu/file/utils/HistogramInfoInterface';
import ColorPicker from './ColorPicker';

import './HistogramAlignment.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

function rgbToHex(r: number, g: number, b: number) {
    const bin = (r << 16) | (g << 8) | b;
    return bin;
}

// Define an interface for the input to ensure type safety
interface ColormapData {
    data: number[];
    colormapName: string;
    nshades: number;
    contrastLower: number;
    contrastUpper: number;
    contrastRangeMin: number;
    contrastRangeMax: number;
}

interface SideMenuVisProps {
    imageShape: ImageShapeInterface;
}

const SideMenuVis: React.FC<SideMenuVisProps> = (props: SideMenuVisProps) => {
    const [lockVisCards, setLockVisCards] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);

    useEventBus('LockComponents', (changeDisableVis) => {
        setLockVisCards(changeDisableVis);
    });

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

    const [selectedColor, setSelectedColor] = useStorageState<string>(sessionStorage, 'cmapname', 'greys');
    const selectedColorRef = useRef(selectedColor); // Had to add this useRef otherwise it will get old values of cmap when slice changes

    const [histogramData, setHistogramData] = useStorageState(sessionStorage, 'histogramData', baseHistogram);
    const [contrastRangeRefMaxValue, setContrastRangeRefMaxValue] = useStorageState<number | null>(
        sessionStorage,
        'contrastRangeRefMaxValue',
        null
    );
    const [contrastRangeRefMinValue, setContrastRangeRefMinValue] = useStorageState<number | null>(
        sessionStorage,
        'contrastRangeRefMinValue',
        null
    );

    // Contrast reference for rendering in canvas
    const [contrast, setContrast] = useStorageState<{
        lower: number | null;
        upper: number | null;
    }>(
        sessionStorage,
        'contrast',
        { lower: null, upper: null } // Initialize as null to check when it's valid
    );

    // This is the bin index number that the user can change, the storage state is for storing when selecting other components
    const [bin, setBin] = useStorageState<{
        lower: number;
        upper: number;
    }>(sessionStorage, 'binvizhistogram', { lower: 0, upper: 245 });

    // Instead of trying to store the function, store the necessary data to recreate it
    const [formatterConfig, setFormatterConfig] = useStorageState(sessionStorage, 'formatterConfig', {
        bins: [] as number[],
        dataType: '',
        isInitialized: false,
    });

    // Create the formatter function based on the stored config
    const pinFormatter = useCallback(
        (binNumber: number): number => {
            if (!formatterConfig.isInitialized) {
                return binNumber;
            }
            return formatterConfig.dataType.includes('int')
                ? Math.round(formatterConfig.bins[binNumber])
                : Math.round(formatterConfig.bins[binNumber] * 100) / 100;
        },
        [formatterConfig]
    );

    useEffect(() => {
        if (histogramData.labels.length > bin.upper) {
            console.log('bin value updated', bin);
            setContrast({ lower: histogramData.labels[bin.lower], upper: histogramData.labels[bin.upper] });
        }
    }, [bin]); // Dependencies

    // Function to generate background colors based on data and colormap settings
    function generateBackgroundColors({
        data,
        colormapName,
        nshades,
        contrastLower,
        contrastUpper,
        contrastRangeMin,
        contrastRangeMax,
    }: ColormapData): string[] | null {
        // Generate a colormap based on the given range and colormap name
        const cmap = colormap({
            colormap: colormapName,
            nshades,
            format: 'rgbaString', // Ensure the format is 'float' for RGB values between 0 and 1
        });
        if (
            contrastLower === null ||
            contrastUpper === null ||
            contrastRangeMax === null ||
            contrastRangeMin === null
        ) {
            console.log('Skipping contrast update, values not initialized.');
            return null;
        }
        const deltaIndexMax = Math.floor(
            (data.length / (contrastRangeMax - contrastRangeMin)) * (contrastRangeMax - contrastUpper)
        );
        const deltaIndexMin = Math.floor(
            (data.length / (contrastRangeMax - contrastRangeMin)) * (contrastLower - contrastRangeMin)
        );
        console.log('deltaIndexMin,deltaIndexMax', deltaIndexMin, deltaIndexMax);

        // Create a background color array based on the colormap
        const backgroundColors = data.map((_, index) => {
            if (index <= deltaIndexMin) {
                return cmap[0]; // All values below or equal to lower limit get the first color
            }
            if (index >= data.length - deltaIndexMax) {
                return cmap[nshades - 1]; // All values above or equal to upper limit get the last color
            }

            // Ensure the index is properly scaled to the range of available colors and contrast limits
            const color = cmap[index - deltaIndexMin - 1];
            return color;
        });

        return backgroundColors;
    }

    function updateBackgroundColors() {
        console.log('Selected color has changed to: ', selectedColor);
        setSelectedColor(selectedColor);
        selectedColorRef.current = selectedColor;
        if (
            contrast.lower === null ||
            contrast.upper === null ||
            contrastRangeRefMaxValue === null ||
            contrastRangeRefMinValue === null
        ) {
            console.log(
                'Skipping contrast update, values not initialized.',
                contrast,
                contrastRangeRefMaxValue,
                contrastRangeRefMinValue
            );
            return;
        }
        const nshades = Math.round(
            (histogramData.datasets[0].data.length / (contrastRangeRefMaxValue - contrastRangeRefMinValue)) *
                (contrast.upper - contrast.lower)
        );
        console.log('nshades', nshades);

        if (nshades < 11) {
            // do not execute for n shades lesser than 11, as the cmap will crash everything
            return;
        }

        // Create a constant instance of ColormapData
        const newBackgroundColors: ColormapData = {
            data: histogramData.datasets[0].data,
            colormapName: selectedColor,
            nshades,
            contrastLower: contrast.lower,
            contrastUpper: contrast.upper,
            contrastRangeMin: contrastRangeRefMinValue,
            contrastRangeMax: contrastRangeRefMaxValue,
        };
        const generatedColors = generateBackgroundColors(newBackgroundColors);
        // Update the backgroundColor for the single dataset
        if (generatedColors !== null) {
            const updatedDataset = [
                {
                    ...histogramData.datasets[0],
                    borderColor: generatedColors, // Apply the new borderColor array
                    backgroundColor: generatedColors, // Apply the new background colors array
                },
            ];

            // Update the state with the new dataset
            setHistogramData((prev) => ({
                ...prev,
                datasets: updatedDataset,
            }));

            dispatch('ColorMapChanged', selectedColor); // Change rendering in canvas
        }
    }

    useEventBus('ImageHistogramLoaded', (loadedHistogram: HistogramInfoPayload) => {
        // Update histogram data and labels (it is necessary to update a unique variable)

        const updateColormapData: ColormapData = {
            data: loadedHistogram.data,
            colormapName: selectedColorRef.current,
            nshades: loadedHistogram.data.length,
            contrastLower: loadedHistogram.minValue,
            contrastUpper: loadedHistogram.maxValue,
            contrastRangeMin: loadedHistogram.minValue,
            contrastRangeMax: loadedHistogram.maxValue,
        };
        console.log('Loaded histogram Color map updated', updateColormapData);

        // Update formatter configuration
        setFormatterConfig({
            bins: loadedHistogram.bins,
            dataType: loadedHistogram.dataType,
            isInitialized: true,
        });

        console.log('Histogram Loding color', selectedColor);

        const borderColor = generateBackgroundColors(updateColormapData);
        const backgroundColor = generateBackgroundColors(updateColormapData);

        if (borderColor !== null && backgroundColor !== null) {
            const updatedHistogram = {
                labels: loadedHistogram.bins,
                datasets: [
                    {
                        data: loadedHistogram.data,
                        borderColor,
                        backgroundColor,
                        normalized: true,
                    },
                ],
            };
            setHistogramData(updatedHistogram);
        }

        // Store histogram max and min values
        setContrastRangeRefMaxValue(loadedHistogram.maxValue);
        setContrastRangeRefMinValue(loadedHistogram.minValue);
        setContrast({ upper: loadedHistogram.maxValue, lower: loadedHistogram.minValue });

        // Reset bin range to full histogram when a new slice/histogram is loaded
        setBin({
            lower: 0,
            upper: loadedHistogram.bins.length - 1,
        });

        console.log('Reset bins to histogram min/max:', {
            lower: loadedHistogram.minValue,
            upper: loadedHistogram.maxValue,
        });

        console.log('I, the ImageHistogramLoaded event finished the execution');
    });

    useEffect(() => {
        if (contrast.lower === null || contrast.upper === null) {
            console.log('Skipping dispatch, contrast values not initialized.');
            return;
        }
        updateBackgroundColors();
        console.log('Dispatch contrastChanged', contrast);
        dispatch('contrastChanged', [contrast.lower, contrast.upper]);
    }, [selectedColor, contrast]);

    const [labelContour, setLabelContour] = useStorageState<boolean>(sessionStorage, 'labelContour', false);

    const [showSuperpixel, setShowSuperpixel] = useStorageState<boolean>(sessionStorage, 'showSuperpixel', true);
    const [superpixelColor, setSuperpixelColor] = useStorageState<number>(sessionStorage, 'superpixelColor', 0xf03030);
    const [showLabel, setShowLabel] = useStorageState<boolean>(sessionStorage, 'showLabel', true);
    const [labelAlpha, setLabelAlpha] = useStorageState<number>(sessionStorage, 'labelAlpha', 0.5);
    const [markerAlpha, setMarkerAlpha] = useStorageState<number>(sessionStorage, 'markerAlpha', 0.5);
    const [showAnnotations, setShowAnnotations] = useStorageState<boolean>(sessionStorage, 'showAnnotations', true);
    const [annotationAlpha, setAnnotationAlpha] = useStorageState<number>(sessionStorage, 'annotationAlpha', 0.75);
    //Need to update canvas to new react to use react hooks
    useEffect(() => {
        dispatch('superpixelColorChanged', superpixelColor);
        dispatch('superpixelVisibilityChanged', showSuperpixel);
        dispatch('labelAlphaChanged', labelAlpha);
        dispatch('labelVisibilityChanged', showLabel);
        dispatch('annotationVisibilityChanged', showAnnotations);
        dispatch('annotationAlphaChanged', annotationAlpha);
    }, [superpixelColor, showSuperpixel, labelAlpha, showLabel, showAnnotations, annotationAlpha]);

    return (
        <React.Fragment>
            <IonCard disabled={lockVisCards}>
                <IonCardContent>
                    <ColorPicker selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
                    <div className="alignment-container">
                        <Line options={histogramOptions} data={histogramData} />
                        <IonRange
                            className="custom-range"
                            max={histogramData.labels.length - 1}
                            min={0}
                            pin={true}
                            pinFormatter={pinFormatter}
                            value={{ lower: bin.lower, upper: bin.upper }}
                            dualKnobs={true}
                            onIonKnobMoveEnd={(e: CustomEvent) => {
                                if (e.detail.value) {
                                    setBin(e.detail.value);
                                }
                            }}
                        ></IonRange>
                    </div>
                </IonCardContent>
            </IonCard>
            <IonCard disabled={lockVisCards}>
                <IonCardContent>
                    <IonItem>
                        <IonLabel>Superpixel</IonLabel>
                        <IonToggle
                            checked={showSuperpixel}
                            onIonChange={(e) => {
                                dispatch('superpixelVisibilityChanged', e.detail.checked);
                                setShowSuperpixel(e.detail.checked);
                            }}
                        ></IonToggle>
                    </IonItem>
                    <div hidden={!showSuperpixel}>
                        <SliderPicker
                            color={'#' + superpixelColor.toString(16)}
                            onChange={(e: any) => {
                                console.log('Superpixel SliderPicker e: ', e);
                                const color = rgbToHex(e.rgb.r, e.rgb.g, e.rgb.b);
                                dispatch('superpixelColorChanged', color);
                                setSuperpixelColor(color);
                            }}
                        />
                    </div>
                </IonCardContent>
            </IonCard>

            <IonCard disabled={lockVisCards}>
                <IonCardContent>
                    <IonItem>
                        <IonLabel>Label</IonLabel>
                        <IonToggle
                            checked={showLabel}
                            onIonChange={(e) => {
                                dispatch('labelVisibilityChanged', e.detail.checked);
                                setShowLabel(e.detail.checked);
                            }}
                        ></IonToggle>
                    </IonItem>
                    <div hidden={!showLabel}>
                        <AlphaPicker
                            width="100%"
                            color={{ h: 0, s: 0, l: 0, a: labelAlpha }}
                            onChange={(e: any) => {
                                console.log(e);
                                dispatch('labelAlphaChanged', e.hsl.a);
                                setLabelAlpha(e.hsl.a!);
                            }}
                        ></AlphaPicker>
                        <IonItem>
                            <IonLabel>Contour only</IonLabel>
                            <IonToggle
                                checked={labelContour}
                                onIonChange={(e) => {
                                    dispatch('labelContourChanged', e.detail.checked);
                                    setLabelContour(e.detail.checked);
                                }}
                            />
                        </IonItem>
                    </div>
                </IonCardContent>
            </IonCard>

            <IonCard disabled={lockVisCards}>
                <IonCardContent>
                    <IonItem>
                        <IonLabel>Show Annotations</IonLabel>
                        <IonToggle
                            checked={showAnnotations}
                            onIonChange={(e) => {
                                dispatch('annotationVisibilityChanged', e.detail.checked);
                                setShowAnnotations(e.detail.checked);
                            }}
                        ></IonToggle>
                    </IonItem>
                    <div hidden={!showAnnotations}>
                        <AlphaPicker
                            width="100%"
                            color={{ h: 0, s: 0, l: 0, a: markerAlpha }}
                            onChange={(e: any) => {
                                dispatch('annotationAlphaChanged', e.hsl.a!);
                                setMarkerAlpha(e.hsl.a!);
                                setAnnotationAlpha(e.hsl.a!);
                            }}
                        ></AlphaPicker>
                    </div>
                </IonCardContent>
            </IonCard>
            <CropMenu imageShape={props.imageShape} disabled={lockVisCards} />
        </React.Fragment>
    );
};

export default SideMenuVis;
