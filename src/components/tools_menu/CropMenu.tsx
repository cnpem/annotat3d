import { IonItem, IonLabel, IonRange } from '@ionic/react';
import { Fragment, useEffect, useState } from 'react';
import { useStorageState } from 'react-storage-hooks';

import { dispatch } from '../../utils/eventbus';
import { sfetch } from '../../utils/simplerequest';
import ErrorInterface from '../main_menu/file/ErrorInterface';
import ImageInfoInterface from '../main_menu/file/ImageInfoInterface';
import { CropInterface } from './CropInterface';
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
    
    const [cropX, setCropX] = useStorageState<CropInterface>(sessionStorage, 'cropX', {
        lower: 0,
        upper: props.imageShape.x
    })

    const [cropY, setCropY] = useStorageState<CropInterface>(sessionStorage, 'cropY', {
        lower: 0,
        upper: props.imageShape.y
    })

    const [cropZ, setCropZ] = useStorageState<CropInterface>(sessionStorage, 'cropZ', {
        lower: 0,
        upper: props.imageShape.z
    })


    const handleCropX = (e: CustomEvent) => {
        setCropX(e.detail.value as any);
    }

    const handleCropY = (e: CustomEvent) => {
        setCropY(e.detail.value as any);
    }

    const handleCropZ = (e: CustomEvent) => {
        setCropZ(e.detail.value as any);
    }

    function onPreview() {
        console.log("bruno: yay! Preview!");
    };

    function onApply() {

        const params = {
            cropX: cropX,
            cropY: cropY,
            cropZ: cropZ
        };


        sfetch("POST", "/crop_image/image", JSON.stringify(params), "json")
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
    }
    
    function onMerge() {
        console.log("bruno: yay! Merge!");
    };

    return (
        <Fragment>
            <ModuleCard disabled={props.disabled} name=""
            onPreview={onPreview} onApply={onApply} onOther={onMerge} OtherName="Merge">
                <IonItem>
                    <IonLabel>Crop Image</IonLabel>
                </IonItem>
                <IonItem>
                    <IonRange dualKnobs={true} value={cropX} min={0} max={props.imageShape.x} step={1} snaps={true} pin={true} debounce={200} onIonChange={handleCropX}>
                        <IonLabel slot="start">X</IonLabel>
                    </IonRange>
                </IonItem>
                <IonItem>
                    <IonRange dualKnobs={true} value={cropY} min={0} max={props.imageShape.y} step={1} snaps={false} pin={false} debounce={200} onIonChange={handleCropY}>
                    <IonLabel slot="start">Y</IonLabel>
                    </IonRange>
                </IonItem>
                <IonItem>
                    <IonRange dualKnobs={true} value={cropZ} min={0} max={props.imageShape.z} step={1} snaps={true} pin={true} debounce={200} onIonChange={handleCropZ}>
                    <IonLabel slot="start">Z</IonLabel>
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
