import React, { useState, useEffect } from 'react';
import {
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonButton,
    IonRadioGroup,
    IonRadio,
    IonRow,
    IonCol,
    IonGrid,
} from '@ionic/react';

import { sfetch } from '../../../../utils/simplerequest';
import { dispatch, useEventBus } from '../../../../utils/eventbus';
interface MorphologyCardProps {
    isVisible: boolean;
}

const MorphologyCard: React.FC<MorphologyCardProps> = ({ isVisible }) => {
    const [operation, setOperation] = useState<string | undefined>();
    const [kernelShape, setKernelShape] = useState<string | undefined>();
    const [kernelSize, setKernelSize] = useState<number>(1);
    const [imageType, setImageType] = useState('annotation');
    const [kernelShapeOptions, setKernelShapeOptions] = useState([
        'square',
        'circle',
        'vertical_line',
        'horizontal_line',
        'cross',
    ]);

    const handleOperationChange = (selectedValue: string | undefined) => {
        setOperation(selectedValue);
        if (selectedValue === 'fillholes') {
            // Reset kernel-related fields if Fill Holes is selected
            setKernelShape(undefined);
            setKernelSize(1);
        }
    };

    const handleKernelSizeChange = (value: string) => {
        const parsedValue = parseInt(value, 10);
        if (!isNaN(parsedValue) && parsedValue >= 1) {
            setKernelSize(parsedValue);
        } else {
            setKernelSize(1);
        }
    };

    const handleApply = () => {
        if (operation) {
            const data = {
                operation,
                kernelShape: operation === 'fillholes' ? undefined : kernelShape,
                kernelSize: operation === 'fillholes' ? undefined : kernelSize,
                label: parseInt(sessionStorage.getItem('selectedLabel') || '0', 10), // For numbers
                slice: parseInt(sessionStorage.getItem('sliceValue') || '0', 10), // For numbers
                axis: JSON.parse(sessionStorage.getItem('sliceName') || '"XY"'), // For strings with JSON-like quotes
            };
            console.log('Data passed to morphology function:', data); // Log the data
            const flaskPath = '/morphology/binary/morphology/' + imageType + '/';
            console.log('flaskPath: ', flaskPath);
            sfetch('POST', flaskPath, JSON.stringify(data), '')
                .then(() => {
                    console.log('Applied ', operation, ' operation!');
                    dispatch('annotationChanged', null);
                    dispatch('labelChanged', '');
                })
                .catch((error) => {
                    console.log(error.error_msg);
                });
        }
    };

    const isFillHoles = operation === 'fillholes';

    // Update kernel shape options based on imageType selection
    useEffect(() => {
        if (imageType === 'label3D') {
            setKernelShapeOptions([
                'cube',
                'sphere',
                'vertical_cylinder',
                'horizontal_rectangle_x',
                'horizontal_rectangle_y',
                'horizontal_rectangle_z',
                '3D_cross',
            ]);
        } else {
            setKernelShapeOptions(['square', 'circle', 'vertical_line', 'horizontal_line', 'cross']);
        }
    }, [imageType]);

    return (
        <div className={isVisible ? 'visible' : 'hidden'}>
            <IonCard>
                <IonCardContent>
                    <IonList>
                        <IonItem>
                            <IonRadioGroup
                                value={imageType}
                                onIonChange={(e) => setImageType(e.detail.value)} // Use new handler
                                style={{ width: '100%' }}
                            >
                                <IonGrid>
                                    <IonRow class="ion-justify-content-center ion-align-items-center">
                                        <IonCol size="auto">
                                            <IonItem lines="none">
                                                <IonRadio slot="start" value="annotation2D" />
                                                <IonLabel>Annotation (2D)</IonLabel>
                                            </IonItem>
                                        </IonCol>
                                        <IonCol size="auto">
                                            <IonItem lines="none">
                                                <IonRadio slot="start" value="label3D" />
                                                <IonLabel>Label (3D)</IonLabel>
                                            </IonItem>
                                        </IonCol>
                                    </IonRow>
                                </IonGrid>
                            </IonRadioGroup>
                        </IonItem>
                        <IonItem>
                            <IonLabel>Operation</IonLabel>
                            <IonSelect
                                placeholder="Select"
                                okText="Choose"
                                cancelText="Cancel"
                                interface="popover"
                                value={operation}
                                onIonChange={(e) => handleOperationChange(e.detail.value)}
                            >
                                <IonSelectOption value="erosion">Shrink</IonSelectOption>
                                <IonSelectOption value="dilation">Expand</IonSelectOption>
                                <IonSelectOption value="closing">Closing</IonSelectOption>
                                <IonSelectOption value="opening">Opening</IonSelectOption>
                                <IonSelectOption value="smooth">Smooth</IonSelectOption>
                                <IonSelectOption value="fillholes">Fill Holes</IonSelectOption>
                            </IonSelect>
                        </IonItem>
                        <IonItem>
                            <IonLabel>Kernel shape</IonLabel>
                            <IonSelect
                                placeholder="Select"
                                okText="Choose"
                                cancelText="Cancel"
                                interface="popover"
                                value={kernelShape}
                                onIonChange={(e) => setKernelShape(e.detail.value)}
                                disabled={isFillHoles}
                            >
                                {kernelShapeOptions.map((option) => (
                                    <IonSelectOption key={option} value={option}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}{' '}
                                        {/* Capitalize the first letter */}
                                    </IonSelectOption>
                                ))}
                            </IonSelect>
                        </IonItem>
                        <IonItem>
                            <IonLabel>Kernel size</IonLabel>
                            <IonInput
                                type="number"
                                placeholder="1"
                                min="1"
                                value={kernelSize}
                                disabled={isFillHoles}
                                onIonInput={(e: any) => handleKernelSizeChange(e.target.value)}
                            ></IonInput>
                        </IonItem>
                    </IonList>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <IonButton
                            color="primary"
                            size="small"
                            disabled={!operation || (!isFillHoles && (!kernelShape || kernelSize < 1))}
                            onClick={handleApply}
                        >
                            Apply
                        </IonButton>
                    </div>
                </IonCardContent>
            </IonCard>
        </div>
    );
};

export default MorphologyCard;
