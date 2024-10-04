import React, { useEffect, useState } from 'react';
import { IonButton, IonButtons, IonContent, IonIcon, IonInput, IonItem, IonPopover } from '@ionic/react';

/* Icons import */
import { closeOutline, colorPalette, pencilOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

import { LabelInterface } from './LabelInterface';
import { ChromePicker } from 'react-color';
import { useStorageState } from 'react-storage-hooks';
import { defaultColormap } from '../../../../utils/colormap';
import { dispatch, useEventBus } from '../../../../utils/eventbus';
import { sfetch } from '../../../../utils/simplerequest';
import ErrorInterface from '../../../main_menu/file/utils/ErrorInterface';

interface OptionsProps {
    label: LabelInterface;
    onChangeLabelList: (label: LabelInterface) => void;
    onChangeLabel: (newLabelName: string, labelId: number, color: [number, number, number], alpha: number) => void;
    isSLActivated: boolean;
}

interface LabelEditProps {
    label: LabelInterface;
    labelNameTrigger: string;

    showPopover: boolean;
    onShowPopover: (showPop: boolean) => void;

    onChangeLabelName: (newLabelName: string, labelId: number) => void;
}

/**
 * Component of buttons that stays left side of label name that permits the user to change the name, color and delete a label
 * @param {LabelEditProps} props - Object that contains the
 * @interface {LabelEditProps} - LabelEditProps interface for props
 */
const EditLabelNameComp: React.FC<LabelEditProps> = (props: LabelEditProps) => {
    const [newLabelName, setNewLabelName] = useState<string>(props.label.labelName);

    const changeLabelName = (e: CustomEvent) => {
        setNewLabelName(e.detail.value!);
    };

    const exitPopup = () => {
        props.onShowPopover(false);
    };

    const handleChangeNewLabelName = () => {
        props.onChangeLabelName(newLabelName, props.label.id);
        props.onShowPopover(false);
    };

    return (
        <IonPopover
            trigger={props.labelNameTrigger}
            isOpen={props.showPopover}
            onDidDismiss={exitPopup}
            alignment={'end'}
            side={'left'}
        >
            <IonContent>
                <IonItem>
                    <IonInput value={newLabelName} onIonChange={changeLabelName} />
                </IonItem>
            </IonContent>
            <IonButton size={'default'} color={'tertiary'} onClick={handleChangeNewLabelName}>
                Confirm
            </IonButton>
        </IonPopover>
    );
};

/**
 * Component that creates the buttons in the table label
 */
const OptionsIcons: React.FC<OptionsProps> = (props: OptionsProps) => {
    const [userDeleteOp, setUserDeleteOp] = useState<boolean>(false);
    const [showDeletePopUp, setShowDeletePopUp] = useState<boolean>(false);
    const [showNamePopover, setShowNamePopover] = useState<boolean>(false);
    const [showColorPopover, setShowColorPopover] = useState<boolean>(false);
    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);
    const [color, setColor] = useStorageState<[number, number, number]>(
        sessionStorage,
        'labelColor.' + String(props.label.id),
        defaultColormap[props.label.id]
    );
    const [alpha, setAlpha] = useStorageState<number>(sessionStorage, 'labelAlpha.' + String(props.label.id), 1);

    // State to handle view/hide toggle
    const [isEyeOpen, setIsEyeOpen] = useState<boolean>(true);

    useEffect(() => {
        if (userDeleteOp && props.label.id !== 0) {
            props.onChangeLabelList(props.label);
        }
    }, [userDeleteOp, props]);

    useEventBus('changeLockButton', (flag: boolean) => {
        setLockMenu(flag);
    });

    // Toggle function for the eye icon
    const toggleEye = () => {
        let NewAlpha; // Declare NewAlpha

        if (!isEyeOpen) {
            NewAlpha = 1; // Set NewAlpha to 1 if the eye is being open
        } else {
            NewAlpha = 0; // Set NewAlpha to 0 if the eye is being closed
        }

        setIsEyeOpen(!isEyeOpen);
        console.log(`Eye icon clicked for label: ${props.label.labelName}`);

        // Call the onChangeLabel function with updated alpha value
        props.onChangeLabel(props.label.labelName, props.label.id, props.label.color, NewAlpha);

        setAlpha(NewAlpha);
    };

    const handleNameEditClickButton = () => {
        setShowNamePopover(true);
    };

    const handleNameEditShowPopover = (showPop: boolean) => {
        setShowNamePopover(showPop);
    };

    return (
        <IonButtons>
            <IonButton
                id={'delete-label-button-' + String(props.label.id)}
                size="small"
                onClick={() => setShowDeletePopUp(true)}
                disabled={lockMenu || props.isSLActivated}
            >
                <IonIcon icon={closeOutline} />
            </IonButton>
            <IonButton
                id={'edit-label-button-' + String(props.label.id)}
                onClick={handleNameEditClickButton}
                disabled={lockMenu || props.isSLActivated}
            >
                <IonIcon icon={pencilOutline} />
            </IonButton>

            <IonButton
                id={'edit-color-button-' + String(props.label.id)}
                onClick={() => setShowColorPopover(true)}
                disabled={lockMenu || props.isSLActivated}
            >
                <IonIcon icon={colorPalette} />
            </IonButton>

            {/* Eye toggle button */}
            <IonButton
                id={'eye-label-button-' + String(props.label.id)}
                onClick={toggleEye}
                disabled={lockMenu || props.isSLActivated}
            >
                <IonIcon icon={isEyeOpen ? eyeOutline : eyeOffOutline} />
            </IonButton>

            {/*Color popUp*/}
            <IonPopover trigger={'edit-color-button-' + String(props.label.id)} isOpen={showColorPopover}>
                <ChromePicker
                    color={`rgb(${color[0]},${color[1]},${color[2]})`}
                    onChange={(clr: any) => {
                        const colorTuple: [number, number, number] = [clr.rgb.r, clr.rgb.g, clr.rgb.b];
                        props.onChangeLabel(props.label.labelName, props.label.id, colorTuple, props.label.alpha);
                        setColor(colorTuple);
                    }}
                    disableAlpha
                />
            </IonPopover>

            {/*Delete popUp*/}
            <IonPopover
                trigger={'delete-label-button-' + String(props.label.id)}
                isOpen={showDeletePopUp}
                onDidDismiss={() => setShowDeletePopUp(false)}
            >
                <IonContent>
                    <IonItem>Do you wish to delete {props.label.labelName} ?</IonItem>
                </IonContent>

                <IonButton
                    size={'default'}
                    color={'tertiary'}
                    onClick={() => {
                        const params = {
                            label_id: props.label.id,
                        };

                        sfetch('POST', '/delete_label_annot', JSON.stringify(params), '')
                            .then(() => {
                                dispatch('annotationChanged', null);
                            })
                            .catch((error: ErrorInterface) => {
                                //TODO: Need to implement a error window here
                                console.log(error);
                            });

                        setShowDeletePopUp(false);
                        setUserDeleteOp(true);
                    }}
                >
                    Confirm
                </IonButton>
            </IonPopover>

            {/*Edit Label component*/}
            <EditLabelNameComp
                label={props.label}
                labelNameTrigger={'edit-label-button-' + String(props.label.id)}
                showPopover={showNamePopover}
                onChangeLabelName={(name, id) => props.onChangeLabel(name, id, props.label.color, props.label.alpha)}
                onShowPopover={handleNameEditShowPopover}
            />
        </IonButtons>
    );
};

export default OptionsIcons;
