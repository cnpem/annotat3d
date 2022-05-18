import {
    IonButton, IonButtons, IonIcon,
    IonInput, IonItem, IonLabel,
    IonNote,
    IonRange, IonSegment, IonSegmentButton, IonToggle
} from "@ionic/react";
import { albumsOutline } from "ionicons/icons";

import { ImageShapeInterface } from './ImageShapeInterface';

import { dispatch, useEventBus } from '../../utils/eventbus';
import { SliceInfoInterface } from "./SliceInfoInterface";
import { useStorageState } from "react-storage-hooks";
import { Fragment, useEffect, useState } from "react";
import { CropInterface, CropAxis } from "./CropInterface";
import { sfetch } from "../../utils/simplerequest";

interface SlicesMenuProps {
    imageShape: ImageShapeInterface;
}

const buttonSliceName: Record<'XY' | 'XZ' | 'YZ', 'X' | 'Y' | 'Z'> = {
    'XY': 'Z',
    'XZ': 'Y',
    'YZ': 'X'
};

/**
 * @param props
 * @constructor
 */
const CropMenu: React.FC<SlicesMenuProps> = (props: SlicesMenuProps) => {

    const [sliceName, setSliceName] = useStorageState<'XY' | 'XZ' | 'YZ'>(sessionStorage, 'sliceName', "XY");
    const [sliceValue, setSliceValue] = useStorageState<number>(sessionStorage, 'sliceValue', 0);
    const [activateMenu, setActivateMenu] = useStorageState<boolean>(sessionStorage, "ActivateComponents", true);
    const [toggleCrop, setToggleCrop] = useStorageState<boolean>(sessionStorage, 'showAnnotations', true);
    
    const [imageShape, setImageShape] = useState<ImageShapeInterface>({
        x: 0, y: 0, z: 0
    });

    useEffect(() => {
        sfetch('POST', '/get_image_info/image', '', 'json')
        .then((imgInfo) => {
            console.log('image info: ', imgInfo);
            setImageShape({
                x: imgInfo.shape[2],
                y: imgInfo.shape[1],
                z: imgInfo.shape[0]
            });
        });
    }, [setImageShape]);

    useEventBus('ImageLoaded', (imgInfo) => {
        setImageShape({
            x: imgInfo.imageShape[2],
            y: imgInfo.imageShape[1],
            z: imgInfo.imageShape[0]
        });
    })

    const [imageCrop, setImageCrop] = useStorageState<CropInterface>(sessionStorage, 'crop',{
        xLower: 0, 
        yLower: 0, 
        zLower: 0,
        xUpper: imageShape.x, 
        yUpper: imageShape.y, 
        zUpper: imageShape.z
    })

    const maxValSlider: Record<'XY' | 'XZ' | 'YZ', number> = {
        'XY': imageShape.z - 1,
        'XZ': imageShape.y - 1,
        'YZ': imageShape.x - 1
    }

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
        console.log("bruno update");
        const newCrop: CropInterface = {
            xLower: cropValX.lower, 
            yLower: cropValY.lower, 
            zLower: cropValZ.lower,
            xUpper: cropValX.upper, 
            yUpper: cropValY.upper, 
            zUpper: cropValZ.upper
        }
        setImageCrop(newCrop);
        console.log("bruno: newcrop", newCrop);
    };


    const handleCropX = (e: CustomEvent) => {
        setCropValX(e.detail.value as any);
        updateCrop();
        // const payload: SliceInfoInterface = {
        //     axis: sliceName,
        //     slice: +e.detail.value
        // };

        // dispatch('sliceChanged', payload);
    }

    const handleCropY = (e: CustomEvent) => {
        setCropValY(e.detail.value as any);
        updateCrop();
    }

    const handleCropZ = (e: CustomEvent) => {
        setCropValZ(e.detail.value as any);
        updateCrop();
    }

    // const handleSliceValue = (e: CustomEvent) => {
    //     setSliceValue(+e.detail.value);
    //     const payload: SliceInfoInterface = {
    //         axis: sliceName,
    //         slice: +e.detail.value
    //     };

    //     dispatch('sliceChanged', payload);
    // }

    const handleSliceName = (e: CustomEvent) => {
        const curSliceName = e.detail.value as 'XY' | 'YZ' | 'XZ';
        setSliceName(curSliceName);
        const maxSliceValue = maxValSlider[curSliceName];
        if (sliceValue > maxSliceValue) {
            setSliceValue(maxSliceValue);
        }

        const payload: SliceInfoInterface = {
            axis: e.detail.value,
            slice: sliceValue
        };

        dispatch('sliceChanged', payload);
    }

    useEffect(() => {
        dispatch('sliceChanged', {
            axis: sliceName,
            slice: sliceValue
        });
    })

    useEventBus("ActivateComponents", (activateSliceMenu) => {
        setActivateMenu(activateSliceMenu);
    })

    return (
        <Fragment>
            <IonItem>
                <IonLabel>Crop</IonLabel>
                <IonToggle checked={toggleCrop}
                    onIonChange={(e) => {
                        dispatch('toggleCropChanged', e.detail.checked);
                        setToggleCrop(e.detail.checked);
                    }}>
                </IonToggle>
            </IonItem>
            <IonItem>
                <IonSegment value={sliceName} onIonChange={handleSliceName} disabled={activateMenu}>
                    <IonSegmentButton value={"XY"}>
                        <IonLabel>{"XY"}</IonLabel>
                    </IonSegmentButton>

                    <IonSegmentButton value={"XZ"}>
                        <IonLabel>{"XZ"}</IonLabel>
                    </IonSegmentButton>

                    <IonSegmentButton value={"YZ"}>
                        <IonLabel>{"YZ"}</IonLabel>
                    </IonSegmentButton>
                </IonSegment>
            </IonItem>
            <IonItem>
                <IonRange dualKnobs={true} min={0} max={imageShape.x} step={1} snaps={false} onIonChange={handleCropX}>
                    <IonLabel slot="start">X</IonLabel>
                </IonRange>
            </IonItem>
            <IonItem>
                <IonRange dualKnobs={true} min={0} max={imageShape.y} step={1} snaps={false} onIonChange={handleCropY}>
                <IonLabel slot="start">Y</IonLabel>
                </IonRange>
            </IonItem>
            <IonItem>
                <IonRange dualKnobs={true} min={0} max={imageShape.z} step={1} snaps={false} onIonChange={handleCropZ}>
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
