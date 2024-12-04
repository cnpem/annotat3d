/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useState } from 'react';
import { informationCircleOutline } from 'ionicons/icons';
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
    IonIcon,
    IonPopover,
    IonContent,
    IonCardHeader,
} from '@ionic/react';
import { sfetch } from '../../../../utils/simplerequest';
import { dispatch } from '../../../../utils/eventbus';

interface ObjectSeparationCardProps {
    isVisible: boolean;
}

const ObjectSeparationCard: React.FC<ObjectSeparationCardProps> = ({ isVisible }) => {
    const [algorithm, setAlgorithm] = useState<string>('union-find');
    const [isAlgorithmOpen, setIsAlgorithmOpen] = useState(false);
    const [sigma, setSigma] = useState<number>(1.0); // Default sigma for Euclidean distance
    const [markerID, setMarkerId] = useState<number>(-1); // Marker ID
    const [dimension, setDimension] = useState<'2d' | '3d'>('2d'); // Default neighborhood
    const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10);
    const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"');
    const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);

    if (!isVisible) return null;

    const handleApply = async () => {
        const data = {
            algorithm,
            sigma,
            dimension,
            current_thresh_marker: markerID,
            current_slice: sliceValue,
            current_axis: sliceName,
            label: selectedLabel, // Add selectedLabel to the data payload
        };

        try {
            const result = await sfetch('POST', '/object_separation/apply', JSON.stringify(data), 'json');
            console.log('Object separation applied successfully:', result);
            dispatch('objectSeparationApplied', result);
        } catch (error) {
            console.error('Error applying object separation:', error);
        }
    };

    return (
        <IonCard>
            <IonCardContent>
                <IonList>
                    {/* Algorithm Selection */}
                    <IonItem button onClick={() => setIsAlgorithmOpen(!isAlgorithmOpen)}>
                        <IonLabel>Object Separation Algorithms</IonLabel>
                    </IonItem>
                    {isAlgorithmOpen && (
                        <IonRadioGroup value={algorithm} onIonChange={(e) => setAlgorithm(e.detail.value)}>
                            <IonItem lines="none">
                                <IonLabel>Union-Find</IonLabel>
                                <IonRadio value="union-find" />
                            </IonItem>
                            <IonItem lines="none">
                                <IonLabel>Meyers Algorithm</IonLabel>
                                <IonRadio value="meyers" />
                            </IonItem>
                        </IonRadioGroup>
                    )}

                    {/* Sigma Selection */}
                    <IonItem>
                        <IonLabel>Sigma</IonLabel>
                        <IonInput
                            type="number"
                            value={sigma}
                            step="0.1"
                            onIonChange={(e) => setSigma(parseFloat(e.detail.value!))}
                        />
                        <IonButton id="showSigmaInfo" slot="end" size="small" fill="clear">
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                        <IonPopover trigger="showSigmaInfo" reference="event">
                            <IonContent>
                                <IonCard>
                                    <IonCardHeader>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>Sigma Parameter</div>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        Sigma is a smoothing parameter used to control the approximation accuracy of the
                                        minimum function in the distance transform. Smaller sigma values result in
                                        higher accuracy but may require greater numerical precision.
                                    </IonCardContent>
                                </IonCard>
                            </IonContent>
                        </IonPopover>
                    </IonItem>

                    {/* 2D or 3D Neighborhood Selection */}
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
                </IonList>
                {/* Apply Button */}
                <IonButton expand="block" onClick={() => handleApply()}>
                    Apply Object Separation
                </IonButton>
            </IonCardContent>
        </IonCard>
    );
};

export default ObjectSeparationCard;
