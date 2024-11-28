import React, { Fragment, useEffect, useState } from 'react';
import {
    IonButton,
    IonButtons,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonRange,
    IonSegment,
    IonSegmentButton,
    IonToggle,
} from '@ionic/react';
import { albumsOutline } from 'ionicons/icons';
import { dispatch, useEventBus } from '../../utils/eventbus';
import { SliceInfoInterface } from './utils/SliceInfoInterface';
import { useStorageState } from 'react-storage-hooks';
import { sfetch } from '../../utils/simplerequest';
import ErrorInterface from '../main_menu/file/utils/ErrorInterface';

// Backend-provided data structure for each axis
interface AxisData {
    index: number[]; // Sequential indices
    values: number[]; // Mapped values
    length: number; // Total length of the slider values
}

interface BackendData {
    XY: AxisData;
    XZ: AxisData;
    YZ: AxisData;
}

interface SlicesMenuProps {
    imageShape: { x: number; y: number; z: number }; // Represents the dimensions of the image
}

const buttonSliceName = {
    XY: 'Z',
    XZ: 'Y',
    YZ: 'X',
};

/**
 * @param props
 * @constructor
 */
const SlicesMenu: React.FC<SlicesMenuProps> = (props: SlicesMenuProps) => {
    const [sliceName, setSliceName] = useStorageState<'XY' | 'XZ' | 'YZ'>(sessionStorage, 'sliceName', 'XY');
    const [sliceValue, setSliceValue] = useStorageState<number>(sessionStorage, 'sliceValue', 0);
    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);
    const [customSliderActive, setCustomSliderActive] = useState<boolean>(false);
    const [cropPreviewMode, setCropPreviewMode] = useStorageState<boolean>(sessionStorage, 'cropPreviewMode', false);
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const [annotHistory, setAnnotHistory] = useState<BackendData>({
        XY: { index: [0], values: [0], length: props.imageShape.z },
        XZ: { index: [0], values: [0], length: props.imageShape.y },
        YZ: { index: [0], values: [0], length: props.imageShape.x },
    });

    const maxValSlider: Record<'XY' | 'XZ' | 'YZ', number> = {
        XY: props.imageShape.z,
        XZ: props.imageShape.y,
        YZ: props.imageShape.x,
    };
    useEventBus('cropPreviewMode', (cropMode) => {
        setCropPreviewMode(cropMode);
    });
    const resetAnnotHistory = () => {
        const resetData = Object.keys(maxValSlider).reduce((acc, key) => {
            const typedKey = key as keyof BackendData;
            acc[typedKey] = {
                index: [0],
                values: [0],
                length: maxValSlider[typedKey],
            };
            return acc;
        }, {} as BackendData);

        setAnnotHistory(resetData);
    };

    const pinFormatter = (index: number): number => {
        if (customSliderActive) {
            const mappedValues = annotHistory[sliceName].values;
            setCurrentIndex(index);
            return mappedValues[index] !== undefined ? mappedValues[index] : index;
        }
        setCurrentIndex(index);
        return index;
    };

    const handleSliceValue = (e: CustomEvent) => {
        const value = pinFormatter(+e.detail.value);
        setSliceValue(value);

        const payload: SliceInfoInterface = {
            axis: sliceName,
            slice: value,
        };
        dispatch('sliceChanged', payload);
    };

    const handleSliceName = (e: CustomEvent) => {
        const selectedSliceName = e.detail.value as 'XY' | 'YZ' | 'XZ';
        setSliceName(selectedSliceName);

        const currentAxisData = annotHistory[selectedSliceName];
        // Ensure the slice value doesn't exceed the current range
        const maxSliceValue = currentAxisData.length - 1;

        if (sliceValue > maxSliceValue) {
            setSliceValue(maxSliceValue);
        }

        const payload: SliceInfoInterface = {
            axis: e.detail.value,
            slice: sliceValue,
        };

        dispatch('sliceChanged', payload);
        dispatch('cropPreviewMode', cropPreviewMode);
    };

    const fetchSliceData = async () => {
        if (!customSliderActive) {
            console.log('Custom slider is not active. Skipping fetch.');
            resetAnnotHistory();
            return;
        }

        try {
            let msgReturned = '';
            let isError = false;

            await sfetch('POST', '/get_annotation_history', '', 'json')
                .then((data: BackendData) => {
                    console.log('Fetched slice data:', data);
                    setAnnotHistory(data);
                })
                .catch((error: ErrorInterface) => {
                    msgReturned = error.error_msg;
                    isError = true;
                    console.error('Error fetching slice data:', error);
                });

            if (isError) {
                dispatch('ShowToast', { message: 'Error fetching slice data', type: 'error' });
            }
        } catch (error) {
            console.error('Unexpected error fetching slice data:', error);
        }
    };
    useEffect(() => {
        dispatch('sliceChanged', {
            axis: sliceName,
            slice: sliceValue,
        });
    });

    useEffect(() => {
        void fetchSliceData();
    }, [customSliderActive]);

    useEventBus('annotationChanged', () => {
        void fetchSliceData();
    });
    useEventBus('LockComponents', (changeLockMenu) => {
        setLockMenu(changeLockMenu);
    });

    return (
        <Fragment>
            <IonSegment value={sliceName} onIonChange={handleSliceName} disabled={lockMenu}>
                <IonSegmentButton value={'XY'}>
                    <IonLabel>{'XY'}</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value={'XZ'}>
                    <IonLabel>{'XZ'}</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value={'YZ'}>
                    <IonLabel>{'YZ'}</IonLabel>
                </IonSegmentButton>
            </IonSegment>

            <IonItem>
                <IonRange
                    min={0}
                    max={annotHistory[sliceName].length - 1}
                    pin={true}
                    ticks={customSliderActive}
                    snaps={customSliderActive}
                    value={currentIndex}
                    onIonKnobMoveEnd={handleSliceValue}
                    disabled={lockMenu}
                    pinFormatter={pinFormatter}
                >
                    <IonIcon size={'small'} slot={'start'} icon={albumsOutline} />
                </IonRange>
            </IonItem>

            <IonItem>
                <IonToggle
                    slot="start"
                    checked={customSliderActive}
                    onIonChange={(e) => setCustomSliderActive(e.detail.checked)}
                    disabled={lockMenu}
                >
                    Custom Slider
                </IonToggle>
                <IonButtons>
                    <IonButton disabled={true} color={'dark'} size={'default'}>
                        {buttonSliceName[sliceName]}
                    </IonButton>
                </IonButtons>
                <IonInput
                    type={'number'}
                    min={0}
                    max={annotHistory[sliceName].length - 1}
                    value={sliceValue}
                    onIonChange={(e: CustomEvent) => setSliceValue(+e.detail.value)}
                    disabled={lockMenu}
                />
            </IonItem>
        </Fragment>
    );
};

export default SlicesMenu;
