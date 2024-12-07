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
import LoadingComponent from '../../utils/LoadingComponent';
import { HistogramInfoPayload } from '../../../../components/main_menu/file/utils/HistogramInfoInterface';

interface WatershedCardProps {
    isVisible: boolean;
}

const WatershedCard: React.FC<WatershedCardProps> = ({ isVisible }) => {
    const [algorithm, setAlgorithm] = useState<string>('union-find');
    const [isAlgorithmOpen, setIsAlgorithmOpen] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingCompPS, setShowLoadingCompPS] = useState<boolean>(false);
    const [markerID, setMarkerId] = useState<number>(-1);
    const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10);
    const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"');

    const [inputFilter, setInputFilter] = useState<string>('prewitt');
    const [isInputFilterOpen, setIsInputFilterOpen] = useState(false);

    const [dimension, setDimension] = useState<'2d' | '3d'>('2d');

    const [isPostProcessingOpen, setIsPostProcessingOpen] = useState(false);

    if (!isVisible) return null;

    const handleApply = async () => {
        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10); // Retrieve selectedLabel
        const data = {
            algorithm,
            inputFilter,
            dimension,
            current_thresh_marker: markerID,
            current_slice: sliceValue,
            current_axis: sliceName,
            label: selectedLabel, // Add selectedLabel to the data payload
        };

        try {
            console.log('Sending data to backend:', data);
            const result = await sfetch('POST', '/watershed_apply_2d/image', JSON.stringify(data), 'json');
            console.log('Backend response:', result);

            // Dispatch event after the watershed is applied
            console.log('Watershed applied, dispatching event...');
            dispatch('watershedApplied', result);
            console.log('Event dispatched.');

            // Optionally, you can also update loading state or any other state here
            setShowLoadingCompPS(true); // Hide loading if needed
        } catch (error) {
            console.error('Error applying watershed:', error);

            // Cast 'error' to Error type to access 'message' safely
            const typedError = error as Error;

            // Optionally, dispatch an error or set loading state to false
            setShowLoadingCompPS(false); // Hide loading if error occurs
            dispatch('watershedError', { error: typedError.message });
        }
    };

    return (
        <IonCard>
            <IonCardContent>
                <IonList>
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
                    Apply Watershed
                </IonButton>
            </IonCardContent>
        </IonCard>
    );
};

export default WatershedCard;
