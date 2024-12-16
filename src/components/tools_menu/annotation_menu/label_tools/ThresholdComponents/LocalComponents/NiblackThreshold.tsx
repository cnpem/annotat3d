import React, { useState } from 'react';
import {
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonPopover,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonRadioGroup,
    IonRadio,
    IonGrid,
    IonRow,
    IonCol,
} from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';
import LoadingComponent from '../../../../utils/LoadingComponent';

interface NiblackThresholdProps {
    Kernel: number;
    setKernelSize: (value: number) => void;
    Weight: number;
    setWeight: (value: number) => void;
    ConvolutionType: string;
    setConvolutionType: (value: string) => void;
    handleApplyNiblack: (kernel: number, weight: number, convType: string) => void;
    handlePreviewNiblack: (kernel: number, weight: number, convType: string) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
}

const NiblackThreshold: React.FC<NiblackThresholdProps> = ({
    Kernel,
    setKernelSize,
    Weight,
    setWeight,
    ConvolutionType,
    setConvolutionType,
    handleApplyNiblack,
    handlePreviewNiblack,
    showToast,
    timeToast,
}) => {
    const [disabled, setDisabled] = useState<boolean>(false);
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');

    const onPreview = () => {
        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Creating the preview');

        // Replace with your preview logic
        setTimeout(() => {
            handlePreviewNiblack(Kernel, Weight, ConvolutionType);
            setDisabled(false);
            setShowLoadingComp(false);
            showToast('Preview generated successfully', timeToast);
        }, 3000); // Simulating a delay for preview generation
    };

    const onApply = () => {
        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Applying the threshold');

        // Replace with your apply logic
        setTimeout(() => {
            handleApplyNiblack(Kernel, Weight, ConvolutionType);
            setDisabled(false);
            setShowLoadingComp(false);
            showToast('Threshold applied successfully', timeToast);
        }, 3000); // Simulating a delay for applying
    };

    return (
        <>
            {/* Kernel Size Input */}
            <IonItem>
                <IonLabel>Kernel: </IonLabel>
                <IonInput
                    value={Kernel}
                    type="number"
                    step="1"
                    min={3}
                    disabled={disabled}
                    onIonChange={(e) => {
                        const inputValue = +e.detail.value!;
                        if (!isNaN(inputValue)) {
                            setKernelSize(inputValue);
                        } else {
                            showToast('Please insert a valid kernel size!', timeToast);
                        }
                    }}
                />
                <IonButton id="showKernelSizeInfo" slot="end" size="small" fill="clear">
                    <IonIcon icon={informationCircleOutline} />
                </IonButton>
                <IonPopover trigger="showKernelSizeInfo" reference="event">
                    <IonContent>
                        <IonCard>
                            <IonCardHeader>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>Kernel Size</div>
                            </IonCardHeader>
                            <IonCardContent>
                                Defines the size of the kernel for local mean and standard deviation calculations. A
                                larger kernel includes more neighboring pixels.
                            </IonCardContent>
                        </IonCard>
                    </IonContent>
                </IonPopover>
            </IonItem>

            {/* Weight Input */}
            <IonItem>
                <IonLabel>Weight: </IonLabel>
                <IonInput
                    value={Weight}
                    type="number"
                    step="0.1"
                    min={0}
                    disabled={disabled}
                    onIonChange={(e) => {
                        const inputValue = +e.detail.value!;
                        if (!isNaN(inputValue)) {
                            setWeight(inputValue);
                        } else {
                            showToast('Please insert a valid weight!', timeToast);
                        }
                    }}
                />
                <IonButton id="showWeightInfo" slot="end" size="small" fill="clear">
                    <IonIcon icon={informationCircleOutline} />
                </IonButton>
                <IonPopover trigger="showWeightInfo" reference="event">
                    <IonContent>
                        <IonCard>
                            <IonCardHeader>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>Weight Value</div>
                            </IonCardHeader>
                            <IonCardContent>
                                The weight influences the contribution of the standard deviation to the threshold.
                            </IonCardContent>
                        </IonCard>
                    </IonContent>
                </IonPopover>
            </IonItem>

            {/* Convolution Type */}
            <IonItem>
                <IonLabel>Annotation(2D) or Label (3D):</IonLabel>
            </IonItem>
            <IonRadioGroup value={ConvolutionType} onIonChange={(e) => setConvolutionType(e.detail.value)}>
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <IonItem>
                                <IonLabel>2D</IonLabel>
                                <IonRadio slot="start" value="2d" />
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem>
                                <IonLabel>3D</IonLabel>
                                <IonRadio slot="start" value="3d" />
                            </IonItem>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonRadioGroup>

            {/* Apply Button */}
            <IonItem lines="none">
                <IonButton expand="block" disabled={disabled || Kernel < 3 || Weight < 0} onClick={onApply}>
                    Apply Threshold
                </IonButton>
            </IonItem>

            {/* Loading Component */}
            <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={loadingMsg} />
        </>
    );
};

export default NiblackThreshold;
