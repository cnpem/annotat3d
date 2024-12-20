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
            label: selectedLabel,
        };

        try {
            setShowLoadingCompPS(true);
            setLoadingMsg('Applying Remove Islands...');
            const result = await sfetch('POST', '/remove_islands_apply/image', JSON.stringify(data), 'json');
            console.log('Remove Islands applied successfully:', result);
            //dispatch('removeIslandsApplied', result);
            if (dimension === '2d') {
                dispatch('annotationChanged', null);
            } else dispatch('labelChanged', '');
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
                        <IonRadioGroup
                            value={dimension}
                            onIonChange={(e) => setDimension(e.detail.value)}
                            style={{ width: '100%' }}
                        >
                            <IonGrid>
                                <IonRow class="ion-justify-content-center ion-align-items-center">
                                    <IonCol size="auto">
                                        <IonItem lines="none">
                                            <IonRadio slot="start" value="2d" />
                                            <IonLabel>Annotation (2D)</IonLabel>
                                        </IonItem>
                                    </IonCol>
                                    <IonCol size="auto">
                                        <IonItem lines="none">
                                            <IonRadio slot="start" value="3d" />
                                            <IonLabel>Label (3D)</IonLabel>
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
                    Apply Remove Islands
                </IonButton>
            </IonCardContent>
        </IonCard>
    );
};

export default RemoveIslandsCard;
