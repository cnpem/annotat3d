import {
    IonButton,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonRange,
    IonRow,
    IonToggle,
    useIonToast,
} from '@ionic/react';
import { isEqual } from 'lodash';
import { Fragment, useEffect, useRef } from 'react';
import { useStorageState } from 'react-storage-hooks';
//ignoring types for react-color, as it seems broken
//TODO: investigate if this is fixed, otherwise declare the types manually
// same problem in SideMenuVis.tsx
// @ts-ignore
import { SliderPicker } from 'react-color';

import { dispatch } from '../../../utils/eventbus';
import { sfetch } from '../../../utils/simplerequest';
import { ImageInfoInterface } from '../../main_menu/file/utils/ImageInfoInterface';
import { CropAxisInterface, CropShapeInterface } from '../utils/CropInterface';
import { ImageShapeInterface } from '../utils/ImageShapeInterface';

interface CropMenuProps {
    imageShape: ImageShapeInterface;
    disabled: boolean;
}

function rgbToHex(r: number, g: number, b: number) {
    const bin = (r << 16) | (g << 8) | b;
    console.log('on CropMenu: rebToHex color = ', bin);
    return bin;
}

/**
 * Enables the user to select the limits of a region of interest in the image trough three sliders (one for each axis).
 *
 * Actions:
 * - toggleCropMode:
 *      Allows the user to preview the selected region with a highlight mask over the rejected portions of the image
 * which are updated when the limits on the sliders for each axis are changed.
 * - Apply:
 *      Replaces the original image with the cropped image and saves its position on the original image.
 * - Merge:
 *      Opens again the original image and update the positions of labels and annotations in relation to their positions on the original image.
 * With the
 *
 * @param props CropMenuProps
 * @interface CropMenuProps { imageShape: ImageShapeInterface; disabled: boolean }
 * @constructor
 */
const CropMenu: React.FC<CropMenuProps> = (props: CropMenuProps) => {
    const [toggleCropMode, setToggleCropMode] = useStorageState<boolean>(sessionStorage, 'toggleCropMode', false);

    const [cropSliderX, setCropSliderX] = useStorageState<CropAxisInterface>(sessionStorage, 'cropSliderX', {
        lower: 0,
        upper: 0,
    });

    const [cropSliderY, setCropSliderY] = useStorageState<CropAxisInterface>(sessionStorage, 'cropSliderY', {
        lower: 0,
        upper: 0,
    });

    const [cropSliderZ, setCropSliderZ] = useStorageState<CropAxisInterface>(sessionStorage, 'cropSliderZ', {
        lower: 0,
        upper: 0,
    });

    const [cropPreviewColor, setCropPreviewColor] = useStorageState<number>(
        sessionStorage,
        'cropPreviewColor',
        0xbf4040
    );

    const [showToast] = useIonToast();
    const toastTime = 2000;

    // positional range references for sliders
    const rangeRefX = useRef<HTMLIonRangeElement | null>(null);
    const rangeRefY = useRef<HTMLIonRangeElement | null>(null);
    const rangeRefZ = useRef<HTMLIonRangeElement | null>(null);

    // updating positional range references with the new values from the sliders
    useEffect(() => {
        if (rangeRefX) {
            if (!isEqual(rangeRefX.current!.value, cropSliderX)) {
                setTimeout(() => {
                    rangeRefX.current!.value = cropSliderX;
                }, 20);
            }
        }
        if (rangeRefY) {
            if (!isEqual(rangeRefY.current!.value, cropSliderY)) {
                setTimeout(() => {
                    rangeRefY.current!.value = cropSliderY;
                }, 20);
            }
        }
        if (rangeRefZ) {
            if (!isEqual(rangeRefZ.current!.value, cropSliderZ)) {
                setTimeout(() => {
                    rangeRefZ.current!.value = cropSliderZ;
                }, 20);
            }
        }
    });

    const handleSliderChangeX = (e: CustomEvent) => {
        const newCropLims = e.detail.value;
        setCropSliderX(newCropLims);
        // preview
        const yLength: number = props.imageShape.y;
        const cropShape: CropShapeInterface = {
            cropX: newCropLims,
            cropY: {
                lower: yLength - cropSliderY.upper,
                upper: yLength - cropSliderY.lower,
            },
            cropZ: cropSliderZ,
        };
        console.log('CropMenu: onPreview', cropShape);
        // send shape to event listener (canvas)
        dispatch('cropShape', cropShape);
        // send change to outside event listeners
        dispatch('cropPreviewMode', true);
        // setToggleCropMode(true);
        showToast('On Crop Preview Mode! Click Reset to deactivate.', toastTime);
    };

    const handleSliderChangeY = (e: CustomEvent) => {
        const newCropLims = e.detail.value;
        setCropSliderY(newCropLims);
        // preview
        const yLength: number = props.imageShape.y;
        const cropShape: CropShapeInterface = {
            cropX: cropSliderX,
            cropY: {
                lower: yLength - newCropLims.upper,
                upper: yLength - newCropLims.lower,
            },
            cropZ: cropSliderZ,
        };
        console.log('CropMenu: onPreview', cropShape);
        // send shape to event listener (canvas)
        dispatch('cropShape', cropShape);
        // send change to outside event listeners
        dispatch('cropPreviewMode', true);
        // setToggleCropMode(true);
        showToast('On Crop Preview Mode! Click Reset to deactivate.', toastTime);
    };

    const handleSliderChangeZ = (e: CustomEvent) => {
        const newCropLims = e.detail.value;
        setCropSliderZ(newCropLims);
        // preview
        const yLength: number = props.imageShape.y;
        const cropShape: CropShapeInterface = {
            cropX: cropSliderX,
            cropY: {
                lower: yLength - cropSliderY.upper,
                upper: yLength - cropSliderY.lower,
            },
            cropZ: newCropLims,
        };
        console.log('CropMenu: onPreview', cropShape);
        // send shape to event listener (canvas)
        dispatch('cropShape', cropShape);
        // send change to outside event listeners
        dispatch('cropPreviewMode', true);
        // setToggleCropMode(true);
        showToast('On Crop Preview Mode! Click Reset to deactivate.', toastTime);
    };

    /**
     * Calls a function on the backend that replaces the working image
     * with a smaller image based on the indexes given by cropShape
     */
    function onApply() {
        setToggleCropMode(false);
        const yLength: number = props.imageShape.y;
        const cropShape: CropShapeInterface = {
            cropX: cropSliderX,
            cropY: {
                lower: yLength - cropSliderY.upper,
                upper: yLength - cropSliderY.lower,
            },
            cropZ: cropSliderZ,
        };
        console.log('CropMenu: onApply', cropShape);
        sfetch('POST', '/crop_apply', JSON.stringify(cropShape), 'json').then((img_info: ImageInfoInterface) => {
            console.log('CropMenu: onApply Success! ', img_info);
            // loads crop image
            dispatch('ImageLoaded', img_info);
            // informs canvas that the superpixel image was deleted
            dispatch('superpixelChanged', {});
            // informs aboud annotation updates in the backend
            dispatch('annotationChanged', null);
            // deactivates crop preview mode on canvas
            dispatch('cropPreviewMode', false);
            const msg: string = 'Crop Applied cropShape: ' + cropShape + ' new imageShape:' + img_info.imageShape;
            showToast(msg, toastTime);
        });
    }
    /**
     * Calls a function on the backend that replaces the working cropped
     * image with the original image opening it again and placing the labels
     * and annotations on their new positions relative to the original image.
     */
    function onMerge() {
        setToggleCropMode(false);
        sfetch('POST', '/crop_merge', '', 'json').then((img_info: ImageInfoInterface) => {
            console.log('CropMenu: onMerge Success! ', img_info);
            // informs canvas that the original (bigger) image was loaded
            dispatch('ImageLoaded', img_info);
            // informs canvas that the superpixel image was deleted
            dispatch('superpixelChanged', {});
            // updates label image updated in the backend
            dispatch('labelChanged', '');
            // informs aboud annotation_menu updates in the backend
            dispatch('annotationChanged', null);
            // deactivates crop preview mode on canvas
            dispatch('cropPreviewMode', false);
            showToast('Crop Merged', toastTime);
        });
    }

    return (
        <Fragment>
            <IonCard disabled={props.disabled}>
                {/* <IonCardHeader>
                    <div style={ { fontWeight: 600, fontSize: 18 } }>
                        { "card name here" }
                    </div>
                </IonCardHeader> */}
                <IonCardContent>
                    <IonItem>
                        <IonLabel>Crop Image</IonLabel>
                        <IonToggle
                            checked={toggleCropMode}
                            onIonChange={(e) => {
                                // sets toggle variable
                                console.log('handleToggleCropMode: ', e.detail.checked);
                                setToggleCropMode(e.detail.checked);
                                // Activate functions on CanvasContainer.Canvas that creates a mask layer
                                // over the image for the current slice and every update when the
                                // cropPreviewMode event is true.
                                dispatch('cropPreviewMode', e.detail.checked);
                            }}
                        ></IonToggle>
                    </IonItem>
                    <div hidden={!toggleCropMode}>
                        <SliderPicker
                            color={'#' + cropPreviewColor.toString(16)}
                            onChange={(e: any) => {
                                const color = rgbToHex(e.rgb.r, e.rgb.g, e.rgb.b);
                                dispatch('cropPreviewColorchanged', color);
                                setCropPreviewColor(color);
                            }}
                        />
                        <IonItem>
                            <IonRange
                                disabled={!toggleCropMode}
                                name={'cropRangeX'}
                                ref={rangeRefX}
                                dualKnobs={true}
                                min={0}
                                max={props.imageShape.x}
                                step={1}
                                snaps={true}
                                pin={true}
                                ticks={false}
                                onIonKnobMoveEnd={handleSliderChangeX}
                            >
                                <IonLabel slot="start">
                                    <h2>X</h2>
                                </IonLabel>
                            </IonRange>
                        </IonItem>
                        <IonItem>
                            <IonRange
                                disabled={!toggleCropMode}
                                name={'cropRangeY'}
                                ref={rangeRefY}
                                dualKnobs={true}
                                min={0}
                                max={props.imageShape.y}
                                step={1}
                                snaps={true}
                                pin={true}
                                ticks={false}
                                onIonKnobMoveEnd={handleSliderChangeY}
                            >
                                <IonLabel slot="start">
                                    <h2>Y</h2>
                                </IonLabel>
                            </IonRange>
                        </IonItem>
                        <IonItem>
                            <IonRange
                                disabled={!toggleCropMode}
                                name={'cropRangeZ'}
                                ref={rangeRefZ}
                                dualKnobs={true}
                                min={0}
                                max={props.imageShape.z}
                                step={1}
                                snaps={true}
                                pin={true}
                                ticks={false}
                                onIonKnobMoveEnd={handleSliderChangeZ}
                            >
                                <IonLabel slot="start">
                                    <h2>Z</h2>
                                </IonLabel>
                            </IonRange>
                        </IonItem>
                        <IonItem>
                            <IonLabel className="ion-text-wrap">
                                Selected Range:
                                <p>
                                    ({cropSliderX.lower}:{cropSliderX.upper}, {cropSliderY.lower}:{cropSliderY.upper},{' '}
                                    {cropSliderZ.lower}:{cropSliderZ.upper})
                                </p>
                            </IonLabel>
                        </IonItem>
                        <IonRow class="ion-justify-content-center">
                            <IonButton disabled={!toggleCropMode} color="primary" size="small" onClick={onApply}>
                                Apply
                            </IonButton>
                            <IonButton disabled={!toggleCropMode} color="primary" size="small" onClick={onMerge}>
                                Merge
                            </IonButton>
                        </IonRow>
                    </div>
                </IonCardContent>
            </IonCard>
        </Fragment>
    );
};

export default CropMenu;
