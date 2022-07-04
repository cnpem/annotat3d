import { IonButton, IonCard, IonCardContent, IonItem, IonLabel, IonRange, IonRow, useIonToast } from '@ionic/react';
import { isEqual } from 'lodash';
import { Fragment, useEffect, useRef } from 'react';
import { useStorageState } from 'react-storage-hooks';
//ignoring types for react-color, as it seems broken
//TODO: investigate if this is fixed, otherwise declare the types manually
// same problem in SideMenuVis.tsx
// @ts-ignore
import { SliderPicker } from 'react-color';

import { dispatch, useEventBus } from '../../utils/eventbus';
import { sfetch } from '../../utils/simplerequest';
import ImageInfoInterface from '../main_menu/file/ImageInfoInterface';
import { CropAxisInterface, CropShapeInterface } from './CropInterface';
import { ImageShapeInterface } from './ImageShapeInterface';

interface CropMenuProps {
    imageShape: ImageShapeInterface;
    disabled: boolean
}

function rgbToHex(r: number, g: number, b: number) {
    const bin = (r << 16) | (g << 8) | b;
    console.log('on CropMenu: rebToHex color = ', bin);
    return bin;
} 


/**
 * Enables the user to select the limits of a region of interest in the image trough three sliders (one for each axis).
 * 
 * Actions:
 * - Preview:
 *      Allows the user to preview the selected region with a highlight mask over the rejected portions of the image.
 * - Reset:
 *      Deactivates the preview mode and reset the limits of the sliders.
 * - Apply:
 *      Replaces the original image with the cropped image and saves its position on the original image.
 * - Merge:
 *      Opens again the original image and update the positions of labels and annotations in relation to their positions on the original image. 
 * With the 
 * 
 * @param props CropMenuProps 
 * @interface CropMenuProps { imageShape: ImageShapeInterface; disabled: boolean }
 * @constructor
 */
const CropMenu: React.FC<CropMenuProps> = (props: CropMenuProps) => {

    const [cropPreviewColor, setCropPreviewColor] = useStorageState<number>(sessionStorage, 'cropPreviewColor', 0xBF4040);

    const [showToast] = useIonToast();
    const toastTime = 2000;
    
    const [cropSliderX, setCropSliderX] = useStorageState<CropAxisInterface>(sessionStorage, 'cropSliderX', {
        lower: 0,
        upper: props.imageShape.x
    });

    const [cropSliderY, setCropSliderY] = useStorageState<CropAxisInterface>(sessionStorage, 'cropSliderY', {
        lower: 0,
        upper: props.imageShape.y
    });

    const [cropSliderZ, setCropSliderZ] = useStorageState<CropAxisInterface>(sessionStorage, 'cropSliderZ', {
        lower: 0,
        upper: props.imageShape.z
    });

    const [superpixelMode, setSuperpixelMode] = useStorageState<boolean>(sessionStorage, 'superpixelMode', false);

    /**
     * Listener to the 'superpixelChanged' event so it can register in a session variable if the superpixel was calculated previously.
     */
    useEventBus('superpixelChanged', () => {
        setSuperpixelMode(true);
    })

    /**
     * Dispatch event to recalculate the superpixel for the new (bigger) image after merge 
     * if the superpixel was calculated previously.
     */
    function resetSuperpixel(): void {
        if (superpixelMode) {
            dispatch('recalcSuperpixel', true);
        }
    }

    // positional range references for sliders
    const rangeRefX = useRef<HTMLIonRangeElement | null>(null);
    const rangeRefY = useRef<HTMLIonRangeElement | null>(null);
    const rangeRefZ = useRef<HTMLIonRangeElement | null>(null);

    // updating positional range references with the new values from the sliders
    useEffect(() => {
        if (rangeRefX) {
            if (!isEqual(rangeRefX.current!.value, cropSliderX)) {
                setTimeout(() => {
                    rangeRefX.current!.value = cropSliderX;
                }, 20);
            }
        }
        if (rangeRefY) {
            if (!isEqual(rangeRefY.current!.value, cropSliderY)) {
                setTimeout(() => {
                    rangeRefY.current!.value = cropSliderY;
                }, 20);
            }
        }
        if (rangeRefZ) {
            if (!isEqual(rangeRefZ.current!.value, cropSliderZ)) {
                setTimeout(() => {
                    rangeRefZ.current!.value = cropSliderZ;
                }, 20);
            }
        }
    });

    /**
     * Activate functions on CanvasContainer.Canvas that creates a mask layer 
     * over the image for the current slice and every update when the 
     * cropPreviewMode event is true.
     * cropY is calculated so that the user view the y axis position as upright.
     */
    function onPreview() {
        const yLength : number = props.imageShape.y;
        const cropShape:CropShapeInterface = {
            cropX: cropSliderX,
            cropY: {
                lower: yLength - cropSliderY.upper - 1,
                upper: yLength - cropSliderY.lower - 1
            },
            cropZ: cropSliderZ
        }
        console.log('CropMenu: onPreview', cropShape);
        // send shape to event listener (canvas)
        dispatch('cropShape', cropShape); 
        // send change to outside event listeners 
        dispatch('cropPreviewMode', true); 
        showToast('On Crop Preview Mode! Click Reset to deactivate.', toastTime);
    };

    /**
     * Deactivates the preview mode and reset the limits of the sliders.
     */
    function onReset() {
        setCropSliderX({
            lower: 0,
            upper: props.imageShape.x
        });
        setCropSliderY({
            lower: 0,
            upper: props.imageShape.y
        });
        setCropSliderZ({
            lower: 0,
            upper: props.imageShape.z
        });
        dispatch('cropPreviewMode', false); 
        dispatch('labelChanged','');
        showToast('Reset crop preview region done!', toastTime);
    };

    /**
     * Calls a function on the backend that replaces the working image 
     * with a smaller image based on the indexes given by cropShape
     */
    function onApply() {
        const yLength : number = props.imageShape.y;
        const cropShape:CropShapeInterface = {
            cropX: cropSliderX,
            cropY: {
                lower: yLength - cropSliderY.upper - 1,
                upper: yLength - cropSliderY.lower - 1
            },
            cropZ: cropSliderZ
        }
        sfetch("POST", "/crop_apply", JSON.stringify(cropShape), "json")
        .then((img_info:ImageInfoInterface) => {
            console.log('CropMenu: onApply Success! ', img_info);
            // loads crop image
            dispatch('ImageLoaded', img_info); 
            // recalcullates superpixel if it was previously calcullated
            resetSuperpixel();
            // show superpixel
            // dispatch('superpixelVisibilityChanged', true);
            // resets crop mode (sliders positions and hides crop preview)
            onReset();
            const msg : string = 'Crop Applied cropShape: '+cropShape+' new imageShape:'+ img_info.imageShape;
            showToast(msg, toastTime);

        })
    };
    /**
     * Calls a function on the backend that replaces the working cropped 
     * image with the original image opening it again and placing the labels 
     * and annotations on their new positions relative to the original image.
     */
    function onMerge() {
        sfetch("POST", "/crop_merge", '', "json")
        .then((img_info:ImageInfoInterface) => {
            console.log('CropMenu: onMerge then ');
            console.log('CropMenu: onMerge Success! ', img_info);
            // loads big image
            dispatch('ImageLoaded', img_info); 
            // recalcullates superpixel if it was previously calcullated
            resetSuperpixel();
            // replace label image updated in the backend
            dispatch('labelChanged','');
            // resets crop mode (sliders positions and hides crop preview)
            onReset();
            showToast('Crop Merged', toastTime);
        })    
    };
    
    return (
        <Fragment>
            <IonCard disabled={props.disabled}>
                {/* <IonCardHeader>
                    <div style={ { fontWeight: 600, fontSize: 18 } }>
                        { "card name here" }
                    </div>
                </IonCardHeader> */}
                <IonCardContent>
                    <IonItem>
                        <IonLabel>Crop Image</IonLabel>
                    </IonItem>
                    <SliderPicker color={'#'+cropPreviewColor.toString(16)}
                            onChange={ (e: any) => {
                                const color = rgbToHex(e.rgb.r, e.rgb.g, e.rgb.b);
                                dispatch('cropPreviewColorchanged', color);
                                setCropPreviewColor(color);
                            } }/>
                    <IonItem>
                        <IonRange name={'cropRangeX'} ref={rangeRefX} dualKnobs={true} min={0} max={props.imageShape.x} step={1} snaps={true} pin={true} ticks={false}
                            onIonKnobMoveEnd={(ex) => { setCropSliderX(ex.detail.value as any) }}>                        
                            <IonLabel slot="start"><h2>X</h2></IonLabel>
                        </IonRange>
                    </IonItem>
                    <IonItem>
                        <IonRange name={'cropRangeY'} ref={rangeRefY} dualKnobs={true} min={0} max={props.imageShape.y} step={1} snaps={true} pin={true} ticks={false}
                            onIonKnobMoveEnd={(ey) => {setCropSliderY(ey.detail.value as any) }}>
                            <IonLabel slot="start"><h2>Y</h2></IonLabel>
                        </IonRange>
                    </IonItem>
                    <IonItem>
                        <IonRange name={'cropRangeZ'} ref={rangeRefZ} dualKnobs={true} min={0} max={props.imageShape.z} step={1} snaps={true} pin={true} ticks={false}
                            onIonKnobMoveEnd={(ez) => {setCropSliderZ(ez.detail.value as any) }}>
                            <IonLabel slot="start"><h2>Z</h2></IonLabel>
                        </IonRange>
                    </IonItem>                
                    <IonItem>
                        <IonLabel className='ion-text-wrap'>
                            Selected Range:
                            <p>
                                ({cropSliderX.lower}:{cropSliderX.upper}, {cropSliderY.lower}:{cropSliderY.upper}, {cropSliderZ.lower}:{cropSliderZ.upper})
                            </p>
                        </IonLabel>
                    </IonItem>
                    <IonRow class="ion-justify-content-center">
                        <IonButton color="primary"
                            size="small"
                            onClick={onPreview}>
                            Preview
                        </IonButton>
                        <IonButton color="primary"
                            size="small"
                            onClick={onReset}>
                            Reset
                        </IonButton>
                        <IonButton color="primary"
                            size="small"
                            onClick={onApply}>
                            Apply
                        </IonButton>
                        <IonButton color="primary"
                            size="small"
                            onClick={onMerge}>
                            Merge
                        </IonButton>
                    </IonRow>
                </IonCardContent>
                
            </IonCard>
            
        </Fragment>
    );
}

export default CropMenu;