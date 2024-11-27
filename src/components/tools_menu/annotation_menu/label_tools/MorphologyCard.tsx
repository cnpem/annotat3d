import React, { useState } from 'react';
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
            const flaskPath = '/morphology/binary/' + operation + '/';
            console.log('flaskPath: ', flaskPath);
            sfetch('POST', flaskPath, JSON.stringify(data), '')
                .then(() => {
                    console.log('Applied ', operation, ' operation!');
                    dispatch('annotationChanged', null);
                })
                .catch((error) => {
                    console.log(error.error_msg);
                });
        }
    };

    const isFillHoles = operation === 'fillholes';

    return (
        <div className={isVisible ? 'visible' : 'hidden'}>
            <IonCard>
                <IonCardContent>
                    <IonList>
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
                                <IonSelectOption value="close">Closing</IonSelectOption>
                                <IonSelectOption value="open">Opening</IonSelectOption>
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
                                <IonSelectOption value="square">Square</IonSelectOption>
                                <IonSelectOption value="circle">Circle</IonSelectOption>
                                <IonSelectOption value="sphere">Sphere</IonSelectOption>
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
