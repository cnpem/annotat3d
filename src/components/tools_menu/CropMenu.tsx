import { IonButton, IonCard, IonCardContent, IonItem, IonLabel, IonRange, IonRow, useIonToast } from '@ionic/react';
import { isEqual } from 'lodash';
import { Fragment, useEffect, useRef } from 'react';
import { useStorageState } from 'react-storage-hooks';

import { dispatch, useEventBus } from '../../utils/eventbus';
import { sfetch } from '../../utils/simplerequest';
import ImageInfoInterface from '../main_menu/file/ImageInfoInterface';
import { CropAxisInterface, CropShapeInterface } from './CropInterface';
import { ImageShapeInterface } from './ImageShapeInterface';

interface CropMenuProps {
    imageShape: ImageShapeInterface;
    disabled: boolean
}

/**
 * @param props
 * @constructor
 */
const CropMenu: React.FC<CropMenuProps> = (props: CropMenuProps) => {

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

    // positional range references for sliders
    const rangeRefX = useRef<HTMLIonRangeElement | null>(null);
    const rangeRefY = useRef<HTMLIonRangeElement | null>(null);
    const rangeRefZ = useRef<HTMLIonRangeElement | null>(null);

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
    };

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
        // bruno: make this on backend
        sfetch("POST", "/crop_apply", JSON.stringify(cropShape), "json")
        .then((img_info:ImageInfoInterface) => {
            console.log('CropMenu: onApply Success! ', img_info);

            dispatch('ImageLoaded', img_info); 
            // dispatch('annotationChanged', null);
            onReset();
            const msg : string = 'Crop Applied cropShape: '+cropShape+' new imageShape:'+ img_info.imageShape;
            showToast(msg, toastTime);

        })
    };
    
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
        // const yLength : number = props.imageShape.y;
        // const cropShape:CropShapeInterface = {
        //     cropX: cropSliderX,
        //     cropY: {
        //         lower: yLength - cropSliderY.upper - 1,
        //         upper: yLength - cropSliderY.lower - 1
        //     },
        //     cropZ: cropSliderZ
        // }
        // dispatch('cropShape', cropShape);
        dispatch('cropPreviewMode', false); 
        dispatch('labelChanged','');
        // delete superpixel > superpixelChanged
        showToast('Reset crop preview region done!', toastTime);
    };

    function onMerge() {
        sfetch("POST", "/crop_merge", '', "json")
        .then((img_info) => {
            console.log('CropMenu: onMerge then ');
            console.log('CropMenu: onMerge Success! ', img_info);
            dispatch('ImageLoaded', img_info); 
            dispatch('labelChanged','');
            resetSuperpixel();
            onReset();
            showToast('Crop Merged');
            showToast(`Merge |o/!`, toastTime);
        })        
    };

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