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
    IonGrid,
    IonRow,
    IonCol,
} from '@ionic/react';
import { sfetch } from '../../../../utils/simplerequest';
import { dispatch } from '../../../../utils/eventbus';
import LoadingComponent from '../../utils/LoadingComponent';

interface RemoveIslandsCardProps {
    isVisible: boolean;
}

const RemoveIslandsCard: React.FC<RemoveIslandsCardProps> = ({ isVisible }) => {
    const [dimension, setDimension] = useState<'2d' | '3d'>('2d');
    const [minSize, setMinSize] = useState<number>(50);
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingCompPS, setShowLoadingCompPS] = useState<boolean>(false);
    const [markerID, setMarkerId] = useState<number>(-1);
    const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10);
    const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"');
    const [isAlgorithmOpen, setIsAlgorithmOpen] = useState(false);

    if (!isVisible) return null;

    const handleApply = async () => {
        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);
        const data = {
            dimension,
            minSize,
            current_thresh_marker: markerID,
            current_slice: sliceValue,
            current_axis: sliceName,
            label: selectedLabel, // Add selectedLabel to the data payload
        };

        try {
            setShowLoadingCompPS(true);
            setLoadingMsg('Applying Remove Islands...');
            const result = await sfetch('POST', '/remove_islands_apply/image', JSON.stringify(data), 'json');
            console.log('Remove Islands applied successfully:', result);
            dispatch('removeIslandsApplied', result);
        } catch (error) {
            console.error('Error applying Remove Islands:', error);
        } finally {
            setShowLoadingCompPS(false);
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

                {/* Loading Component */}
                {showLoadingCompPS && (
                    <div>
                        <LoadingComponent openLoadingWindow={false} loadingText={''} />
                        <p>{loadingMsg}</p>
                    </div>
                )}

                {/* Apply Button */}
                <IonButton expand="block" onClick={handleApply} disabled={showLoadingCompPS}>
                    Apply
                </IonButton>
            </IonCardContent>
        </IonCard>
    );
};

export default RemoveIslandsCard;
