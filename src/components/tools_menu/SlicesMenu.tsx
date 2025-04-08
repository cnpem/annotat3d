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
import { albumsOutline, downloadOutline } from 'ionicons/icons';
import { dispatch, useEventBus } from '../../utils/eventbus';
import { SliceInfoInterface } from './utils/SliceInfoInterface';
import { useStorageState } from 'react-storage-hooks';
import { sfetch } from '../../utils/simplerequest';
import ErrorInterface from '../main_menu/file/utils/ErrorInterface';
import InfoPopover from './utils/InfoPopover';
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
        XY: props.imageShape.z - 1,
        XZ: props.imageShape.y - 1,
        YZ: props.imageShape.x - 1,
    };
    useEventBus('cropPreviewMode', (cropMode) => {
        setCropPreviewMode(cropMode);
    });

    const indexMapping = (index: number): number => {
        if (customSliderActive) {
            const mappedValues = annotHistory[sliceName].values;
            return mappedValues[index] !== undefined ? mappedValues[index] : index;
        }
        return index;
    };

    // Helper to update slice value based on the source
    const updateSlice = (rawValue: number, source: 'range' | 'input') => {
        if (isNaN(rawValue)) return;

        let newSliceValue = rawValue;

        if (source === 'range') {
            // From IonRange: rawValue is the slider index.
            setCurrentIndex(rawValue);
            newSliceValue = customSliderActive ? indexMapping(rawValue) : rawValue;
        } else if (source === 'input') {
            // From IonInput: rawValue is already the mapped value.
            if (customSliderActive) {
                // Find the matching slider index from the annotHistory values.
                const ionBarIndex = annotHistory[sliceName].values.indexOf(rawValue);
                setCurrentIndex(ionBarIndex);
            }
            // newSliceValue remains the raw input.
        }

        setSliceValue(newSliceValue);

        const payload: SliceInfoInterface = {
            axis: sliceName,
            slice: newSliceValue,
        };
        dispatch('sliceChanged', payload);
    };

    // The event handlers now simply call the helper with the proper source.
    const handleIonRangeValueChange = (e: CustomEvent) => {
        const rawValue = +e.detail.value;
        updateSlice(rawValue, 'range');
    };

    const handleIonInputValueChange = (e: CustomEvent) => {
        const rawValue = +e.detail.value!;
        updateSlice(rawValue, 'input');
    };
    const handleSliceName = (e: CustomEvent) => {
        const selectedSliceName = e.detail.value as 'XY' | 'YZ' | 'XZ';
        setSliceName(selectedSliceName);

        const currentAxisData = annotHistory[selectedSliceName];
        // Ensure the slice value doesn't exceed the current range
        const maxSliceValue = currentAxisData.length - 1;

        if (customSliderActive) {
            setSliceValue(annotHistory[selectedSliceName].length > 0 ? annotHistory[selectedSliceName].values[0] : 0);
        } else if (sliceValue > maxSliceValue) {
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
                setCustomSliderActive(false);
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

    const downloadAnnotHistory = () => {
        const filteredData = (Object.keys(annotHistory) as (keyof BackendData)[]).reduce((acc, key) => {
            acc[key] = annotHistory[key].values;
            return acc;
        }, {} as Record<keyof BackendData, number[]>);

        const fileData = JSON.stringify(filteredData, null, 2);
        const blob = new Blob([fileData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'annotHistory.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Fragment>
            <IonSegment value={sliceName} onIonChange={handleSliceName} disabled={lockMenu}>
                <IonSegmentButton value="XY">
                    <IonLabel>XY</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="XZ">
                    <IonLabel>XZ</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="YZ">
                    <IonLabel>YZ</IonLabel>
                </IonSegmentButton>
            </IonSegment>

            <IonItem>
                <IonRange
                    min={0}
                    max={customSliderActive ? annotHistory[sliceName].length - 1 : maxValSlider[sliceName]}
                    pin
                    ticks={customSliderActive}
                    snaps={customSliderActive}
                    value={currentIndex}
                    onIonKnobMoveEnd={handleIonRangeValueChange}
                    disabled={lockMenu}
                    pinFormatter={indexMapping}
                >
                    <IonIcon size="small" slot="start" icon={albumsOutline} />
                </IonRange>
            </IonItem>

            <IonItem>
                <IonButtons>
                    <IonButton disabled color="dark" size="default">
                        {buttonSliceName[sliceName]}
                    </IonButton>
                </IonButtons>
                <IonInput
                    type="number"
                    min={0}
                    max={maxValSlider[sliceName]}
                    value={sliceValue}
                    onIonChange={handleIonInputValueChange}
                    disabled={lockMenu}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <InfoPopover
                        triggerId="sliderinfo"
                        header="Annotated Slices"
                        content="Click toggle at right to allow slider with only annotated slices"
                        buttonSlot="end"
                    />
                    <IonToggle
                        slot="end"
                        checked={customSliderActive}
                        onIonChange={(e) => setCustomSliderActive(e.detail.checked)}
                        disabled={lockMenu}
                    />
                    {customSliderActive && (
                        <IonButton onClick={downloadAnnotHistory} size="small" fill="clear">
                            <IonIcon slot="end" icon={downloadOutline} />
                        </IonButton>
                    )}
                </div>
            </IonItem>
        </Fragment>
    );
};

export default SlicesMenu;
