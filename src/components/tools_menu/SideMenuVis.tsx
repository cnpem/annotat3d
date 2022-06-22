import React, {useEffect, useRef} from "react";
import {IonCard, IonCardContent, IonRange, IonIcon, IonLabel, IonToggle, IonItem} from "@ionic/react";
import {moon, sunny} from "ionicons/icons";
import {dispatch, useEventBus} from "../../utils/eventbus";
import { useStorageState } from 'react-storage-hooks';
import {isEqual} from "lodash";

//ignoring types for react-color, as it seems broken
//TODO: investigate if this is fixed, otherwise declare the types manually
// @ts-ignore
import { AlphaPicker, SliderPicker } from 'react-color';
import CropMenu from "./CropMenu";
import { ImageShapeInterface } from "./ImageShapeInterface";

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
            if (!isEqual(contrastRangeRef.current!.value, contrast)) {
                setTimeout(() => {
                    contrastRangeRef.current!.value = contrast;
                }, 20);
            }
        }

        //now I am just dispatch all events on mount
        //(however, I should change canvas container to store tis state properly)
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
                    <IonRange ref={contrastRangeRef} pin={true} debounce={300}
                        dualKnobs={true} onIonChange={ (e) => {
                            if (e.detail.value) {
                                const range = e.detail.value as any;
                                setContrast(range);
                                dispatch('contrastChanged', [range.lower/100, range.upper/100]);
                            }
                        }}>
                        <IonIcon slot='start' icon={sunny}></IonIcon>
                        <IonIcon slot='end' icon={moon}></IonIcon>
                    </IonRange>
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
                                console.log(e);
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
