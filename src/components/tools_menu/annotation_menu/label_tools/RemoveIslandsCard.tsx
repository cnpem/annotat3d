/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useState } from 'react';
import {
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonRadioGroup,
    IonRadio,
    IonButton,
    IonInput,
    IonCheckbox,
    IonGrid,
    IonRow,
    IonCol,
} from '@ionic/react';
import { sfetch } from '../../../../utils/simplerequest';
import { dispatch } from '../../../../utils/eventbus';

interface RemoveIslandsCardProps {
    isVisible: boolean;
}

const RemoveIslandsCard: React.FC<RemoveIslandsCardProps> = ({ isVisible }) => {
    const [dimension, setDimension] = useState<'2d' | '3d'>('2d');
    const [minSize, setMinSize] = useState<number>(50);
    const [isAlgorithmOpen, setIsAlgorithmOpen] = useState(false);

    if (!isVisible) return null;

    const handleApply = async () => {
        const data = {
            dimension,
            minSize,
        };

        try {
            const result = await sfetch('POST', '/remove_islands/apply', JSON.stringify(data), 'json');
            console.log('Remove Islands applied successfully:', result);
            dispatch('removeIslandsApplied', result);
        } catch (error) {
            console.error('Error applying Remove Islands:', error);
        }
    };

    return (
        <IonCard>
            <IonCardContent>
                <IonList>
                    {/* Dimension Selection */}
                    <IonItem>
                        <IonLabel>Neighborhood</IonLabel>
                        <IonRadioGroup value={dimension} onIonChange={(e) => setDimension(e.detail.value)}>
                            <IonGrid>
                                <IonRow>
                                    <IonCol>
                                        <IonItem lines="none">
                                            <IonLabel>2D</IonLabel>
                                            <IonRadio value="2d" />
                                        </IonItem>
                                    </IonCol>
                                    <IonCol>
                                        <IonItem lines="none">
                                            <IonLabel>3D</IonLabel>
                                            <IonRadio value="3d" />
                                        </IonItem>
                                    </IonCol>
                                </IonRow>
                            </IonGrid>
                        </IonRadioGroup>
                    </IonItem>

                    {/* Minimum Size */}
                    <IonItem>
                        <IonLabel>Minimum Island Size</IonLabel>
                        <IonInput
                            type="number"
                            value={minSize}
                            onIonChange={(e) => setMinSize(parseInt(e.detail.value || '0', 10))}
                            placeholder="Enter minimum size"
                        />
                    </IonItem>
                </IonList>
                {/* Apply Button */}
                <IonButton expand="block" onClick={handleApply}>
                    Apply
                </IonButton>
            </IonCardContent>
        </IonCard>
    );
};

export default RemoveIslandsCard;
