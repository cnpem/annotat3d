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

interface LocalMeanThresholdProps {
    Kernel: number;
    setKernelSize: React.Dispatch<React.SetStateAction<number>>;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
    Threshold: number;
    setThreshold: React.Dispatch<React.SetStateAction<number>>;
    ConvolutionType: string;
    setConvolutionType: React.Dispatch<React.SetStateAction<string>>;
    handleApplyLocalMean: () => void; // Add this
}

const LocalMeanThreshold: React.FC<LocalMeanThresholdProps> = ({
    Kernel,
    setKernelSize,
    showToast,
    timeToast,
    Threshold,
    setThreshold,
    ConvolutionType,
    setConvolutionType,
    handleApplyLocalMean,
}) => {
    const [disabled, setDisabled] = useState<boolean>(false);
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');

    const onApply = () => {
        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Applying the threshold');

        // Replace with your apply logic
        setTimeout(() => {
            handleApplyLocalMean();
            setDisabled(false);
            setShowLoadingComp(false);
            showToast('Threshold applied successfully', timeToast);
        }, 3000); // Simulating a delay for applying
    };
    return (
        <>
            {/* Kernel Input */}
            <IonItem>
                <IonLabel>Kernel: </IonLabel>
                <IonInput
                    value={Kernel}
                    type="number"
                    step="1"
                    min={3}
                    onIonChange={(e) =>
                        typeof +e.detail.value! === 'number'
                            ? setKernelSize(+e.detail.value!)
                            : void showToast('Please insert a valid number!', timeToast)
                    }
                ></IonInput>
                <IonButton id="showKernelInfo" slot="end" size="small" fill="clear">
                    <IonIcon icon={informationCircleOutline} />
                </IonButton>
                <IonPopover trigger="showKernelInfo" reference="event">
                    <IonContent>
                        <IonCard>
                            <IonCardHeader>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>Kernel Size</div>
                            </IonCardHeader>
                            <IonCardContent>
                                Specifies the size of the kernel, defining the area around each pixel that the filter
                                considers when processing the image. Larger kernels include more neighboring elements.
                            </IonCardContent>
                        </IonCard>
                    </IonContent>
                </IonPopover>
            </IonItem>

            {/* Threshold Input */}
            <IonItem>
                <IonLabel>Threshold: </IonLabel>
                <IonInput
                    value={Threshold}
                    type="number"
                    step="0.1"
                    min={0}
                    onIonChange={(e) =>
                        typeof +e.detail.value! === 'number'
                            ? setThreshold(+e.detail.value!)
                            : void showToast('Please insert a valid number!', timeToast)
                    }
                ></IonInput>
                <IonButton id="showThresholdInfo" slot="end" size="small" fill="clear">
                    <IonIcon icon={informationCircleOutline} />
                </IonButton>
                <IonPopover trigger="showThresholdInfo" reference="event">
                    <IonContent>
                        <IonCard>
                            <IonCardHeader>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>Threshold Value</div>
                            </IonCardHeader>
                            <IonCardContent>
                                The Threshold parameter determines the minimum value required for binarization.
                            </IonCardContent>
                        </IonCard>
                    </IonContent>
                </IonPopover>
            </IonItem>

            {/* Convolution Type Radio Group */}
            <IonItem>
                <IonLabel>Annotation(2D) or Label (3D)</IonLabel>
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
                <IonButton expand="block" disabled={disabled || Kernel < 3 || Threshold < 0} onClick={onApply}>
                    Apply Threshold
                </IonButton>
            </IonItem>

            {/* Loading Component */}
            <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={loadingMsg} />
        </>
    );
};

export default LocalMeanThreshold;
