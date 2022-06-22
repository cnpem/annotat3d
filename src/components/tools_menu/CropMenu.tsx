import { IonItem, IonLabel, IonRange } from '@ionic/react';
import { isEqual } from 'lodash';
import { Fragment, useEffect, useRef } from 'react';
import { useStorageState } from 'react-storage-hooks';

import { dispatch } from '../../utils/eventbus';
import { sfetch } from '../../utils/simplerequest';
import ImageInfoInterface from '../main_menu/file/ImageInfoInterface';
import { CropAxisInterface, CropShapeInterface } from './CropInterface';
import { ImageShapeInterface } from './ImageShapeInterface';
import { ModuleCard } from './ModuleCard';

// import { dispatch, useEventBus } from '../../utils/eventbus';
// import { SliceInfoInterface } from "./SliceInfoInterface";
interface CropMenuProps {
    imageShape: ImageShapeInterface;
    disabled: boolean
}

/**
 * @param props
 * @constructor
 */
const CropMenu: React.FC<CropMenuProps> = (props: CropMenuProps) => {
    
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
        sfetch("POST", "/crop_image/image", JSON.stringify(cropShape), "json")
        .then((img_info:ImageInfoInterface) => {

            dispatch('ImageLoaded', img_info); 

            // setShowPopover({...showPopover, open: false});
            // showToast(`Loaded ${image["image_name"]}${image["image_ext"]}`, toastTime);

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
    };

    return (
        <Fragment>
            <ModuleCard disabled={props.disabled} name=""
                 onPreview={onPreview} onApply={onApply} onOther={onReset} OtherName="Reset">
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
                        <p className='ion-center'>
                            ({cropX.lower}:{cropX.upper}, {cropY.lower}:{cropY.upper}, {cropZ.lower}:{cropZ.upper})
                        </p>
                    </IonLabel>
                </IonItem>
            </ModuleCard>
        </Fragment>
    );
}

export default CropMenu;
