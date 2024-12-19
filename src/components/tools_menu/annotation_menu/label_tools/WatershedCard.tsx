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
    IonGrid,
    IonRow,
    IonCol,
} from '@ionic/react';
import { sfetch } from '../../../../utils/simplerequest';
import { dispatch } from '../../../../utils/eventbus';
import LoadingComponent from '../../utils/LoadingComponent';

interface WatershedCardProps {
    isVisible: boolean;
}

const WatershedCard: React.FC<WatershedCardProps> = ({ isVisible }) => {
    const [algorithm, setAlgorithm] = useState<string>('union-find');
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingCompPS, setShowLoadingCompPS] = useState<boolean>(false);
    const [markerID, setMarkerId] = useState<number>(-1);
    const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10);
    const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"');

    const [inputFilter, setInputFilter] = useState<string>('prewitt');
    const [isInputFilterOpen, setIsInputFilterOpen] = useState(false);

    const [selectedDimension, setSelectedDimension] = useState<'2D' | '3D'>('2D');

    if (!isVisible) return null;

    const handleApply = async () => {
        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);
        const data = {
            algorithm,
            inputFilter,
            dimension: selectedDimension.toLowerCase(),
            current_thresh_marker: markerID,
            current_slice: sliceValue,
            current_axis: sliceName,
            label: selectedLabel,
        };

        try {
            console.log('Sending data to backend:', data);
            const result = await sfetch('POST', '/watershed_apply_2d/image', JSON.stringify(data), 'json');
            console.log('Backend response:', result);

            //dispatch('watershedApplied', result);
            if (selectedDimension === '2D') {
                dispatch('annotationChanged', null);
            } else dispatch('labelChanged', '');

            setShowLoadingCompPS(true);
        } catch (error) {
            console.error('Error applying watershed:', error);
            const typedError = error as Error;
            setShowLoadingCompPS(false);
            dispatch('watershedError', { error: typedError.message });
        }
        setShowLoadingCompPS(false);
    };

    return (
        <IonCard>
            <IonCardContent>
                <IonList>
                    <LoadingComponent openLoadingWindow={showLoadingCompPS} loadingText={loadingMsg} />
                    {/* Input Filter Selection */}
                    <IonItem button onClick={() => setIsInputFilterOpen(!isInputFilterOpen)}>
                        <IonLabel>Input Image Filter</IonLabel>
                    </IonItem>
                    {isInputFilterOpen && (
                        <IonRadioGroup value={inputFilter} onIonChange={(e) => setInputFilter(e.detail.value)}>
                            <IonItem lines="none">
                                <IonLabel>Prewitt</IonLabel>
                                <IonRadio value="prewitt" />
                            </IonItem>
                            <IonItem lines="none">
                                <IonLabel>Sobel</IonLabel>
                                <IonRadio value="sobel" />
                            </IonItem>
                        </IonRadioGroup>
                    )}

                    {/* 2D or 3D Selection */}
                    <IonItem>
                        <IonRadioGroup
                            value={selectedDimension}
                            onIonChange={(e) => setSelectedDimension(e.detail.value)}
                            style={{ width: '100%' }}
                        >
                            <IonGrid>
                                <IonRow class="ion-justify-content-center ion-align-items-center">
                                    <IonCol size="auto">
                                        <IonItem lines="none">
                                            <IonRadio slot="start" value="2D" />
                                            <IonLabel>Annotation (2D)</IonLabel>
                                        </IonItem>
                                    </IonCol>
                                    <IonCol size="auto">
                                        <IonItem lines="none">
                                            <IonRadio slot="start" value="3D" />
                                            <IonLabel>Label (3D)</IonLabel>
                                        </IonItem>
                                    </IonCol>
                                </IonRow>
                            </IonGrid>
                        </IonRadioGroup>
                    </IonItem>
                </IonList>

                {/* Apply Button */}
                <IonButton expand="block" onClick={handleApply}>
                    Apply Watershed
                </IonButton>
            </IonCardContent>
        </IonCard>
    );
};

export default WatershedCard;
