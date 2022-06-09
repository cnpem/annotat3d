import { IonItem, IonLabel, IonRange, IonToggle } from '@ionic/react';
import { Fragment } from 'react';
import { useStorageState } from 'react-storage-hooks';

import { dispatch } from '../../utils/eventbus';
import { sfetch } from '../../utils/simplerequest';
import ErrorInterface from '../main_menu/file/ErrorInterface';
import ImageInfoInterface from '../main_menu/file/ImageInfoInterface';
import { CropAxisInterface, CropShapeInterface } from './CropInterface';
import { ImageShapeInterface } from './ImageShapeInterface';
import { ModuleCard } from './ModuleCard';

// import { dispatch, useEventBus } from '../../utils/eventbus';
// import { SliceInfoInterface } from "./SliceInfoInterface";
interface SlicesMenuProps {
    imageShape: ImageShapeInterface;
    disabled: boolean
}

/**
 * @param props
 * @constructor
 */
const CropMenu: React.FC<SlicesMenuProps> = (props: SlicesMenuProps) => {
    
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

    const [onCropPreviewMode, setOnCropPreviewMode] = useStorageState<boolean>(sessionStorage, 'onCropPreviewMode', false);

    function onPreview() {
        
        const cropShape:CropShapeInterface = {
            cropX: cropX,
            cropY: cropY,
            cropZ: cropZ
        }
        console.log("bruno: yay! Preview!", "shape:", cropShape);
        dispatch('cropShape', cropShape); 
    };

    function onApply() {

        const cropShape:CropShapeInterface = {
            cropX: cropX,
            cropY: cropY,
            cropZ: cropZ
        }

        sfetch("POST", "/crop_image/image", JSON.stringify(cropShape), "json")
        .then((img_info) => {

            const info: ImageInfoInterface = {
                imageShape: img_info["image_shape"],
                imageDtype: img_info["image_dtype"],
                imageName: img_info["image_name"],
                imageExt: img_info["image_ext"],
            }
            // setShowErrorWindow(false);
            dispatch('ImageLoaded', info); 
            

            // setShowPopover({...showPopover, open: false});
            // showToast(`Loaded ${image["image_name"]}${image["image_ext"]}`, toastTime);

        }).catch((error: ErrorInterface) => {
            // setShowErrorWindow(true);
            // setErrorMsg(error["error_msg"]);
        })
    };
    
    function onMerge() {
        console.log("bruno: yay! Merge!");
    };

    return (
        <Fragment>
            <ModuleCard disabled={props.disabled} name=""
            onPreview={onPreview} onApply={onApply} onOther={onMerge} OtherName="Merge">
                <IonItem>
                    <IonLabel>Crop Image</IonLabel>
                    <IonToggle checked={onCropPreviewMode}
                        onIonChange={(e) => {
                            dispatch('onCropPreviewMode', e.detail.checked);
                            setOnCropPreviewMode(e.detail.checked);
                            // copied from preview
                            const cropShape:CropShapeInterface = {
                                cropX: cropX,
                                cropY: cropY,
                                cropZ: cropZ
                            }
                            console.log("bruno: yay! preview toggle!", "shape:", cropShape);
                            dispatch('cropShape', cropShape); 
                        }}>
                    </IonToggle>
                </IonItem>
                <IonItem>
                    <IonRange name={'cropRangeX'} dualKnobs={true} value={cropX} min={0} max={props.imageShape.x} step={1} snaps={true} pin={true} ticks={false}
                        onIonKnobMoveEnd={(ex) => { setCropX(ex.detail.value as any)}}>                        
                        <IonLabel slot="start"><h2>X</h2></IonLabel>
                    </IonRange>
                </IonItem>
                <IonItem>
                    <IonRange name={'cropRangeY'} dualKnobs={true} value={cropY} min={0} max={props.imageShape.y} step={1} snaps={true} pin={true} ticks={false}
                        onIonKnobMoveEnd={(ey) => {setCropY(ey.detail.value as any)}}>
                        <IonLabel slot="start"><h2>Y</h2></IonLabel>
                    </IonRange>
                </IonItem>
                <IonItem>
                    <IonRange name={'cropRangeZ'} dualKnobs={true} value={cropZ} min={0} max={props.imageShape.z} step={1} snaps={true} pin={true} ticks={false}
                        onIonKnobMoveEnd={(ez) => {setCropZ(ez.detail.value as any)}}>
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
            </ModuleCard>
        </Fragment>
    );
}

export default CropMenu;
