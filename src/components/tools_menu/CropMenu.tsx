import {
    IonItem, IonLabel,
    IonRange, IonToggle
} from "@ionic/react";

import { ImageShapeInterface } from './ImageShapeInterface';

import { dispatch } from '../../utils/eventbus';
// import { dispatch, useEventBus } from '../../utils/eventbus';
// import { SliceInfoInterface } from "./SliceInfoInterface";
import { useStorageState } from "react-storage-hooks";
import { Fragment, useEffect, useState } from "react";
import { CropInterface } from "./CropInterface";

interface SlicesMenuProps {
    imageShape: ImageShapeInterface;
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

    return (
        <Fragment>
            <IonItem>
                <IonLabel>Crop</IonLabel>
                <IonToggle checked={toggleCrop}
                    onIonChange={(e) => {
                        dispatch('toggleCropChanged', imageCrop);
                        setToggleCrop(e.detail.checked);
                    }}>
                </IonToggle>
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
        </Fragment>
    );
}

export default CropMenu;
