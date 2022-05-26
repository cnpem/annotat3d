import {
    IonItem, IonLabel,
    IonRange, IonToggle
} from "@ionic/react";

import { ImageShapeInterface } from './ImageShapeInterface';

import { dispatch, useEventBus } from '../../utils/eventbus';
// import { dispatch, useEventBus } from '../../utils/eventbus';
// import { SliceInfoInterface } from "./SliceInfoInterface";
import { useStorageState } from "react-storage-hooks";
import { Fragment, useEffect, useState } from "react";
import { CropInterface } from "./CropInterface";
import { ModuleCard } from "./ModuleCard";
import { sfetch } from "../../utils/simplerequest";
import ImageInfoInterface from "../main_menu/file/ImageInfoInterface";
import ErrorInterface from "../main_menu/file/ErrorInterface";

interface SlicesMenuProps {
    imageShape: ImageShapeInterface;
    disabled: boolean
}

/**
 * @param props
 * @constructor
 */
const CropMenu: React.FC<SlicesMenuProps> = (props: SlicesMenuProps) => {

    const [toggleCrop, setToggleCrop] = useStorageState<boolean>(sessionStorage, 'toggleCrop', false);
    
    const [imageCrop, setImageCrop] = useStorageState<CropInterface>(sessionStorage, 'cropIndexes',{
        xLower: 0, 
        yLower: 0, 
        zLower: 0,
        xUpper: props.imageShape.x, 
        yUpper: props.imageShape.y, 
        zUpper: props.imageShape.z
    })

    const [cropValX, setCropValX] = useState<{
        lower: number;
        upper: number;
      }>({ lower: 0, upper: 0 });

    const [cropValY, setCropValY] = useState<{
        lower: number;
        upper: number;
    }>({ lower: 0, upper: 0 });

    const [cropValZ, setCropValZ] = useState<{
        lower: number;
        upper: number;
    }>({ lower: 0, upper: 0 });

    const updateCrop = () => {
        const newCrop: CropInterface = {
            xLower: cropValX.lower, 
            yLower: cropValY.lower, 
            zLower: cropValZ.lower,
            xUpper: cropValX.upper, 
            yUpper: cropValY.upper, 
            zUpper: cropValZ.upper
        }
        setImageCrop(newCrop);
    };

    const handleCropX = (e: CustomEvent) => {
        setCropValX(e.detail.value as any);
        updateCrop();
    }

    const handleCropY = (e: CustomEvent) => {
        setCropValY(e.detail.value as any);
        updateCrop();
    }

    const handleCropZ = (e: CustomEvent) => {
        setCropValZ(e.detail.value as any);
        updateCrop();
    }

    useEffect(() => {
        dispatch('toggleCropChanged', {
            crop: imageCrop
        });
    })

    const [imageInfo, setImageInfo] = useStorageState<ImageInfoInterface>(sessionStorage, 'imageInfo');
    useEventBus('ImageLoaded', (imgInfo) => {
        setImageInfo(imgInfo);
    })

    function onPreview() {
        console.log("bruno: yay! Preview!");
    };

    function onApply() {

        const params = {
            cropIndexes: imageCrop,
        };



        // setDisabled(true);
        // setShowLoadingComp(true);
        // setLoadingMsg("Applying");

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
                    <IonRange dualKnobs={true} min={0} max={props.imageShape.x} step={1} snaps={false} onIonChange={handleCropX}>
                        <IonLabel slot="start">X</IonLabel>
                    </IonRange>
                </IonItem>
                <IonItem>
                    <IonRange dualKnobs={true} min={0} max={props.imageShape.y} step={1} snaps={false} onIonChange={handleCropY}>
                    <IonLabel slot="start">Y</IonLabel>
                    </IonRange>
                </IonItem>
                <IonItem>
                    <IonRange dualKnobs={true} min={0} max={props.imageShape.z} step={1} snaps={false} onIonChange={handleCropZ}>
                    <IonLabel slot="start">Z</IonLabel>
                    </IonRange>
                </IonItem>
                <IonItem>
                    <IonLabel>Selected Range: ({imageCrop.xLower}:{imageCrop.xUpper}, {imageCrop.yLower}:{imageCrop.yUpper}, {imageCrop.zLower}:{imageCrop.zUpper}) </IonLabel>
                </IonItem>
            </ModuleCard>
        </Fragment>
    );
}

export default CropMenu;
