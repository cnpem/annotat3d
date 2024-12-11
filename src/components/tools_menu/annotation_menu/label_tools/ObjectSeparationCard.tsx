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
    const [sigma, setSigma] = useState<number>(0.1); // Default sigma for Euclidean distance
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
            const result = await sfetch('POST', '/object_separation_apply/image', JSON.stringify(data), 'json');
            console.log('Object separation applied successfully:', result);
            //dispatch('objectSeparationApplied', result);
            if (dimension === '2d') {
                dispatch('annotationChanged', null);
            } else dispatch('labelChanged', '');
        } catch (error) {
            console.error('Error applying object separation:', error);
        }
    };

    return (
        <IonCard>
            <IonCardContent>
                <IonList>
                    {/* Watershed Algorithm Info Button */}
                    <IonItem>
                        <IonLabel>
                            <strong>Object Separation</strong>
                        </IonLabel>
                        <IonButton id="showWatershedInfo" slot="end" size="small" fill="clear">
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                        <IonPopover trigger="showWatershedInfo" reference="event">
                            <IonContent>
                                <IonCard>
                                    <IonCardHeader>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>Object Separation</div>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        This process uses the watershed algorithm to separate objects in an image. The
                                        markers for the watershed algorithm are obtained by performing a distance
                                        transform on the image. This helps identify boundaries and distinct regions
                                        within the image for accurate object separation.It will be applied slice by
                                        slice.
                                    </IonCardContent>
                                </IonCard>
                            </IonContent>
                        </IonPopover>
                    </IonItem>

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
