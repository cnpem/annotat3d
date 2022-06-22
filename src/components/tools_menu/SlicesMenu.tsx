import {IonButton, IonButtons, IonIcon,
    IonInput, IonItem, IonLabel,
    IonRange, IonSegment, IonSegmentButton
} from "@ionic/react";
import {albumsOutline} from "ionicons/icons";

import {ImageShapeInterface} from './ImageShapeInterface';

import {dispatch, useEventBus} from '../../utils/eventbus';
import {SliceInfoInterface} from "./SliceInfoInterface";
import {useStorageState} from "react-storage-hooks";
import {Fragment, useEffect} from "react";

interface SlicesMenuProps{
    imageShape: ImageShapeInterface;
}

const buttonSliceName: Record<'XY'|'XZ'|'YZ', 'X'|'Y'|'Z'> = {
    'XY': 'Z',
    'XZ': 'Y',
    'YZ': 'X'
};

/**
 * @param props
 * @constructor
 */
const SlicesMenu: React.FC<SlicesMenuProps> = (props: SlicesMenuProps) => {

    const [sliceName, setSliceName] = useStorageState<'XY' | 'XZ' | 'YZ'>(sessionStorage, 'sliceName', "XY");
    const [sliceValue, setSliceValue] = useStorageState<number>(sessionStorage, 'sliceValue', 0);
    const [LockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);
    const [cropPreviewMode, setCropPreviewMode] = useStorageState<boolean>(sessionStorage, 'cropPreviewMode', false);

    const maxValSlider: Record<'XY'|'XZ'|'YZ', number> = {
        'XY': props.imageShape.z - 1,
        'XZ': props.imageShape.y - 1,
        'YZ': props.imageShape.x - 1
    }

    useEventBus('cropPreviewMode', (cropMode) => {
        setCropPreviewMode(cropMode);
    })

    const handleSliceValue = (e: CustomEvent) => {
        setSliceValue(+e.detail.value);
        const payload: SliceInfoInterface =  {
            axis: sliceName,
            slice: +e.detail.value
        };
        dispatch('sliceChanged', payload);
        dispatch('cropPreviewMode', cropPreviewMode); 
    }

    const handleIonInputSliceValue = (e: CustomEvent) => {
        setSliceValue(+e.detail.value);
    }

    const handleSliceName = (e: CustomEvent) => {
        const curSliceName = e.detail.value as 'XY'|'YZ'|'XZ';
        setSliceName(curSliceName);
        const maxSliceValue = maxValSlider[curSliceName];
        if (sliceValue > maxSliceValue) {
            setSliceValue(maxSliceValue);
        }

        const payload: SliceInfoInterface =  {
            axis: e.detail.value,
            slice: sliceValue
        };

        dispatch('sliceChanged', payload);
        dispatch('cropPreviewMode', cropPreviewMode); 
    }

    useEffect(() => {
        dispatch('sliceChanged', {
            axis: sliceName,
            slice: sliceValue
        });
    })

    useEventBus('LockComponents', (changeLockMenu) => {
        setLockMenu(changeLockMenu);
    })

    return(
        <Fragment>
            <IonSegment value={sliceName} onIonChange={handleSliceName} disabled={LockMenu}>
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

            <IonItem>
                <IonRange min={0} max={maxValSlider[sliceName]} pin={true} value={sliceValue} onIonChange={handleSliceValue} disabled={LockMenu}>
                    <IonIcon size={"small"} slot={"start"} icon={albumsOutline}/>
                </IonRange>
            </IonItem>
            <IonItem>
                <IonButtons>
                    <IonButton disabled={true} color={"dark"} size={"default"}>{buttonSliceName[sliceName]}</IonButton>
                </IonButtons>
                <IonInput
                    type={"number"}
                    min={0} max={maxValSlider[sliceName]}
                    clearInput value={sliceValue}
                    onIonChange={handleIonInputSliceValue}
                    disabled={LockMenu}/>
            </IonItem>
        </Fragment>
    );

}

export default SlicesMenu;
