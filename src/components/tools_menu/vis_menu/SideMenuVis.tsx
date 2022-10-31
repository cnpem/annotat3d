import React, {useState, useEffect, useRef} from "react";
import {IonCard, IonCardContent, IonRange, IonIcon, IonLabel, IonToggle, IonItem} from "@ionic/react";
import {moon, sunny} from "ionicons/icons";
import {dispatch, useEventBus} from "../../../utils/eventbus";
import {useStorageState} from 'react-storage-hooks';
import {isEqual} from "lodash";
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
import {Line} from "react-chartjs-2"

//ignoring types for react-color, as it seems broken
//TODO: investigate if this is fixed, otherwise declare the types manually
// @ts-ignoreTooltip
import { AlphaPicker, SliderPicker } from 'react-color';
import CropMenu from "./CropMenu";
import { ImageShapeInterface } from "../utils/ImageShapeInterface";
import { HistogramInfoPayload } from "../../main_menu/file/utils/HistogramInfoInterface";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
  );

function rgbToHex(r: number, g: number, b: number) {
    const bin = (r << 16) | (g << 8) | b;
    return bin;
}

interface SideMenuVisProps {
    imageShape: ImageShapeInterface;
}

const SideMenuVis: React.FC<SideMenuVisProps> = (props:SideMenuVisProps) => {

    const [lockVisCards, setLockVisCards] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);

    const [contrast, setContrast] = useStorageState(sessionStorage, 'contrast', {
        lower: 10,
        upper: 90
    });

    useEventBus('LockComponents', (changeDisableVis) => {
        setLockVisCards(changeDisableVis);
    })

    let baseHistogram = {
        labels: [0],
        datasets: [
          {
            data: [0],
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            normalized: true
          },
        ],
    }

    const histogramOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            tooltip:{
                enabled: false
            }
        },
    };

    const [histogramData, setHistogramData] = useStorageState(sessionStorage, 'histogramData', baseHistogram);
    const [contrastRangeRefMaxValue, setContrastRangeRefMaxValue] = useStorageState(sessionStorage, 'contrastRangeRefMaxValue', 100)
    const [contrastRangeRefMinValue, setContrastRangeRefMinValue] = useStorageState(sessionStorage, 'contrastRangeRefMinValue', 0)

    function updateContrastRangeLimitValues(){
        contrastRangeRef.current!.max = contrastRangeRefMaxValue
        contrastRangeRef.current!.min = contrastRangeRefMinValue
    }

    useEventBus('ImageHistogramLoaded', (loadedHistogram: HistogramInfoPayload) => {

        // Update histogram data and labels
        baseHistogram.datasets[0].data = loadedHistogram.data
        baseHistogram.labels = Array.from(Array(baseHistogram.datasets[0].data.length).keys())

        // Plot histogram
        setHistogramData(baseHistogram)

        // Store histogram max and min values
        setContrastRangeRefMaxValue(loadedHistogram.maxValue)
        setContrastRangeRefMinValue(loadedHistogram.minValue)

        // Update range component
        updateContrastRangeLimitValues()

    })

    const [labelContour, setLabelContour] = useStorageState<boolean>(sessionStorage, 'labelContour', false);

    const [showSuperpixel, setShowSuperpixel] = useStorageState<boolean>(sessionStorage, 'showSuperpixel', true);
    const [superpixelColor, setSuperpixelColor] = useStorageState<number>(sessionStorage, 'superpixelColor', 0xf03030);
    const [showLabel, setShowLabel] = useStorageState<boolean>(sessionStorage, 'showLabel', true);
    const [labelAlpha, setLabelAlpha] = useStorageState<number>(sessionStorage, 'labelAlpha', 0.5);
    const [markerAlpha, setMarkerAlpha] = useStorageState<number>(sessionStorage, 'markerAlpha', 0.5);
    const [showAnnotations, setShowAnnotations] = useStorageState<boolean>(sessionStorage, 'showAnnotations', true);
    const [annotationAlpha, setAnnotationAlpha] = useStorageState<number>(sessionStorage, 'annotationAlpha', 0.75);

    const contrastRangeRef = useRef<HTMLIonRangeElement | null>(null);

    //for some weird reason, IonRange is ignoring value when using the value property,
    //so I am manually setting it.
    useEffect(() => {
        if (contrastRangeRef) {

            updateContrastRangeLimitValues()

            if (!isEqual(contrastRangeRef.current!.value, contrast)) {
                // this is used to reposition the slider markers to the last values set on contrast
                setTimeout(() => {
                    contrastRangeRef.current!.value = contrast;
                }, 20);
            }

        }
        //now I am just dispatch all events on mount
        //(however, I should change canvas container to store this state properly)
        //to use the useStorageState I should migrate canvas container to new format (react hooks)
        //If I did not have time to undo, and you are reading this, Peixinho says "I am sorry"

        dispatch('superpixelColorChanged', superpixelColor);
        dispatch('superpixelVisibilityChanged', showSuperpixel);
        dispatch('labelAlphaChanged', labelAlpha);
        dispatch('labelVisibilityChanged', showLabel);
        dispatch('annotationVisibilityChanged', showAnnotations);
        dispatch('annotationAlphaChanged', annotationAlpha);
    });

    return(
        <React.Fragment>
            <IonCard disabled={lockVisCards}>
                <IonCardContent>
                    <IonRange ref={contrastRangeRef} pin={true}
                        dualKnobs={true}
                        onIonKnobMoveEnd={ (e:CustomEvent) => {
                            if (e.detail.value) {
                                const range = e.detail.value as any;
                                setContrast(range);
                                dispatch('contrastChanged', [range.lower/100, range.upper/100]);
                            }
                        }}
                        >
                        <IonIcon slot='start' icon={sunny}></IonIcon>
                        <IonIcon slot='end' icon={moon}></IonIcon>
                    </IonRange>
                    <Line options={histogramOptions} data={histogramData}/>
                </IonCardContent>
            </IonCard>
            <IonCard disabled={lockVisCards}>
                <IonCardContent>
                    <IonItem>
                        <IonLabel>Superpixel</IonLabel>
                        <IonToggle checked={showSuperpixel}
                            onIonChange={(e) => {
                                dispatch('superpixelVisibilityChanged', e.detail.checked);
                                setShowSuperpixel(e.detail.checked)
                            }}>
                        </IonToggle>
                    </IonItem>
                    <div hidden={!showSuperpixel}>
                        <SliderPicker color={'#'+superpixelColor.toString(16)}
                            onChange={ (e: any) => {
                                console.log('Superpixel SliderPicker e: ',e);
                                const color = rgbToHex(e.rgb.r, e.rgb.g, e.rgb.b);
                                dispatch('superpixelColorChanged', color);
                                setSuperpixelColor(color);
                            } }/>
                    </div>
                </IonCardContent>
            </IonCard>

            <IonCard disabled={lockVisCards}>
                <IonCardContent>
                    <IonItem>
                        <IonLabel>Label</IonLabel>
                        <IonToggle checked={showLabel}
                            onIonChange={(e)=> {
                                dispatch('labelVisibilityChanged', e.detail.checked);
                                setShowLabel(e.detail.checked)
                            }}>
                        </IonToggle>
                    </IonItem>
                    <div hidden={!showLabel}>
                        <AlphaPicker width="100%" color={ {h: 0, s: 0, l: 0, a: labelAlpha} }
                            onChange={(e: any) => {
                                console.log(e);
                                dispatch('labelAlphaChanged', e.hsl.a);
                                setLabelAlpha(e.hsl.a!!);
                            }}>
                        </AlphaPicker>
                        <IonItem>
                            <IonLabel>Contour only</IonLabel>
                            <IonToggle checked={labelContour}
                                onIonChange={(e) => {
                                    dispatch('labelContourChanged', e.detail.checked);
                                    setLabelContour(e.detail.checked);
                            }}/>
                        </IonItem>
                    </div>
                </IonCardContent>
            </IonCard>

            <IonCard disabled={lockVisCards}>
                <IonCardContent>
                    <IonItem>
                        <IonLabel>Show Annotations</IonLabel>
                        <IonToggle checked={showAnnotations}
                            onIonChange={(e) => {
                                dispatch('annotationVisibilityChanged', e.detail.checked);
                                setShowAnnotations(e.detail.checked);
                            }}>
                        </IonToggle>
                    </IonItem>
                    <div hidden={!showAnnotations}>
                        <AlphaPicker width="100%" color={ {h: 0, s: 0, l: 0, a: markerAlpha} }
                            onChange={(e: any) => {
                                dispatch('annotationAlphaChanged', e.hsl.a!!)
                                setMarkerAlpha(e.hsl.a!!);
                                setAnnotationAlpha(e.hsl.a!!);
                            }}>
                        </AlphaPicker>
                    </div>
                </IonCardContent>
            </IonCard>
            <CropMenu imageShape={props.imageShape} disabled={lockVisCards} />
        </React.Fragment>
    );
}

export default SideMenuVis;