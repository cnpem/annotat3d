import { IonButton, IonCard, IonCardContent, IonItem, IonLabel, IonRange, IonRow, useIonToast } from '@ionic/react';
import { isEqual } from 'lodash';
import { Fragment, useEffect, useRef } from 'react';
import { useStorageState } from 'react-storage-hooks';

import { dispatch } from '../../utils/eventbus';
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
    
    const [cropX, setCropX] = useStorageState<CropAxisInterface>(sessionStorage, 'cropX', {
        lower: 0,
        upper: props.imageShape.x
    });

    const [cropY, setCropY] = useStorageState<CropAxisInterface>(sessionStorage, 'cropY', {
        lower: 0,
        upper: props.imageShape.y
    });

    const [cropZ, setCropZ] = useStorageState<CropAxisInterface>(sessionStorage, 'cropZ', {
        lower: 0,
        upper: props.imageShape.z
    });

    // positional range references for sliders
    const rangeRefX = useRef<HTMLIonRangeElement | null>(null);
    const rangeRefY = useRef<HTMLIonRangeElement | null>(null);
    const rangeRefZ = useRef<HTMLIonRangeElement | null>(null);

    useEffect(() => {
        if (rangeRefX) {
            if (!isEqual(rangeRefX.current!.value, cropX)) {
                setTimeout(() => {
                    rangeRefX.current!.value = cropX;
                }, 20);
            }
        }
        if (rangeRefY) {
            if (!isEqual(rangeRefY.current!.value, cropY)) {
                setTimeout(() => {
                    rangeRefY.current!.value = cropY;
                }, 20);
            }
        }
        if (rangeRefZ) {
            if (!isEqual(rangeRefZ.current!.value, cropZ)) {
                setTimeout(() => {
                    rangeRefZ.current!.value = cropZ;
                }, 20);
            }
        }
    });

    function onPreview() {
        const cropShape:CropShapeInterface = {
            cropX: cropX,
            cropY: cropY,
            cropZ: cropZ
        }
        // send shape to event listener (canvas)
        dispatch('cropShape', cropShape); 
        // send change to outside event listeners 
        dispatch('cropPreviewMode', true); 
    };

    function onApply() {

        const cropShape:CropShapeInterface = {
            cropX: cropX,
            cropY: cropY,
            cropZ: cropZ
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
        setCropX({
            lower: 0,
            upper: props.imageShape.x
        });
        setCropY({
            lower: 0,
            upper: props.imageShape.y
        });
        setCropZ({
            lower: 0,
            upper: props.imageShape.z
        });
        const cropShape:CropShapeInterface = {
            cropX: cropX,
            cropY: cropY,
            cropZ: cropZ
        }
        dispatch('cropShape', cropShape);
        dispatch('cropPreviewMode', false); 
        showToast('Reset crop preview region done!', toastTime);
    };

    function onMerge() {
        // setCropX({
        //     lower: 0,
        //     upper: props.imageShape.x
        // });
        // setCropY({
        //     lower: 0,
        //     upper: props.imageShape.y
        // });
        // setCropZ({
        //     lower: 0,
        //     upper: props.imageShape.z
        // });
        // const cropShape:CropShapeInterface = {
        //     cropX: cropX,
        //     cropY: cropY,
        //     cropZ: cropZ
        // }
        // dispatch('cropShape', cropShape);
        // dispatch('cropPreviewMode', false); 
        sfetch("POST", "/crop_merge", '', "json")
        .then((img_info) => {
            console.log('CropMenu: onMerge then ');
            console.log('CropMenu: onMerge Success! ', img_info);

            dispatch('ImageLoaded', img_info); 
            // onReset();
            showToast('Crop Merged');

        })        
        showToast(`Merge |o/!`, toastTime);
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
                    <IonItem>
                        <IonRange name={'cropRangeX'} ref={rangeRefX} dualKnobs={true} min={0} max={props.imageShape.x} step={1} snaps={true} pin={true} ticks={false}
                            onIonKnobMoveEnd={(ex) => { setCropX(ex.detail.value as any) }}>                        
                            <IonLabel slot="start"><h2>X</h2></IonLabel>
                        </IonRange>
                    </IonItem>
                    <IonItem>
                        <IonRange name={'cropRangeY'} ref={rangeRefY} dualKnobs={true} min={0} max={props.imageShape.y} step={1} snaps={true} pin={true} ticks={false}
                            onIonKnobMoveEnd={(ey) => {setCropY(ey.detail.value as any) }}>
                            <IonLabel slot="start"><h2>Y</h2></IonLabel>
                        </IonRange>
                    </IonItem>
                    <IonItem>
                        <IonRange name={'cropRangeZ'} ref={rangeRefZ} dualKnobs={true} min={0} max={props.imageShape.z} step={1} snaps={true} pin={true} ticks={false}
                            onIonKnobMoveEnd={(ez) => {setCropZ(ez.detail.value as any) }}>
                            <IonLabel slot="start"><h2>Z</h2></IonLabel>
                        </IonRange>
                    </IonItem>                
                    <IonItem>
                        <IonLabel className='ion-text-wrap'>
                            Selected Range:
                            <p>
                                ({cropX.lower}:{cropX.upper}, {cropY.lower}:{cropY.upper}, {cropZ.lower}:{cropZ.upper})
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