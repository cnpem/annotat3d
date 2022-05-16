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

    const [imageCrop, setImageCrop] = useStorageState<CropInterface>(sessionStorage, 'crop',{
        x1: 0, 
        y1: 0, 
        z1: 0,
        x2: props.imageShape.x - 1, 
        y2: props.imageShape.y - 1, 
        z2: props.imageShape.z - 1
    })

    const maxValSlider: Record<'XY' | 'XZ' | 'YZ', number> = {
        'XY': props.imageShape.z - 1,
        'XZ': props.imageShape.y - 1,
        'YZ': props.imageShape.x - 1
    }

    const [rangeValueX, setRangeValueX] = useState<{
        lower: number;
        upper: number;
      }>({ lower: 0, upper: 0 });

    const [rangeValueY, setRangeValueY] = useState<{
        lower: number;
        upper: number;
    }>({ lower: 0, upper: 0 });

    const [rangeValueZ, setRangeValueZ] = useState<{
        lower: number;
        upper: number;
    }>({ lower: 0, upper: 0 });

    const handleCropX = (e: CustomEvent) => {
        setRangeValueX(e.detail.value as any);
        const newCrop: CropInterface = {
            x1: rangeValueX.lower, 
            y1: imageCrop.y1, 
            z1: imageCrop.z1,
            x2: rangeValueX.upper, 
            y2: imageCrop.y2, 
            z2: imageCrop.z2
        }
        setImageCrop(newCrop);
        console.log("teste",props.imageShape.x - 1);
        // const payload: SliceInfoInterface = {
        //     axis: sliceName,
        //     slice: +e.detail.value
        // };

        // dispatch('sliceChanged', payload);
    }

    const handleCropY = (e: CustomEvent) => {
        setRangeValueY(e.detail.value as any);
    }

    const handleCropZ = (e: CustomEvent) => {
        setRangeValueZ(e.detail.value as any);
    }

    const handleSliceValue = (e: CustomEvent) => {
        setSliceValue(+e.detail.value);
        const payload: SliceInfoInterface = {
            axis: sliceName,
            slice: +e.detail.value
        };

        dispatch('sliceChanged', payload);
    }

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
                <IonRange dualKnobs={true} min={0} max={props.imageShape.x - 1} step={1} snaps={false} onIonChange={handleCropX}>
                    <IonLabel slot="start">X</IonLabel>
                </IonRange>
            </IonItem>
            <IonItem>
                <IonRange dualKnobs={true} min={0} max={100} step={1} snaps={false} onIonChange={handleCropY}>
                <IonLabel slot="start">Y</IonLabel>
                </IonRange>
            </IonItem>
            <IonItem>
                <IonRange dualKnobs={true} min={0} max={100} step={1} snaps={false} onIonChange={handleCropZ}>
                <IonLabel slot="start">Z</IonLabel>
                </IonRange>
            </IonItem>
            <IonItem>
                <IonLabel>Selected Range: ({rangeValueX.lower}:{rangeValueX.upper}, {rangeValueY.lower}:{rangeValueY.upper}, {rangeValueZ.lower}:{rangeValueZ.upper}) </IonLabel>
            </IonItem>
        </Fragment>
    );

}

export default CropMenu;
