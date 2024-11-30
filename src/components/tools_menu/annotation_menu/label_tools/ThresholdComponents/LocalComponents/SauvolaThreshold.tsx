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

// SauvolaThresholdProps Interface
interface SauvolaThresholdProps {
    Kernel: number;
    setKernelSize: React.Dispatch<React.SetStateAction<number>>;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
    Weight: number;
    setWeight: React.Dispatch<React.SetStateAction<number>>;
    Range: number;
    setRange: React.Dispatch<React.SetStateAction<number>>;
    ConvolutionType: string;
    setConvolutionType: React.Dispatch<React.SetStateAction<string>>;
    handleApplySauvola: () => void; // Add this
}

const SauvolaThreshold: React.FC<SauvolaThresholdProps> = ({
    Kernel,
    setKernelSize,
    showToast,
    timeToast,
    Weight,
    setWeight,
    Range,
    setRange,
    ConvolutionType,
    setConvolutionType,
    handleApplySauvola,
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
            handleApplySauvola();
            setDisabled(false);
            setShowLoadingComp(false);
            showToast('Threshold applied successfully', timeToast);
        }, 3000); // Simulating a delay for applying
    };
    return (
        <>
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
                                Specifies the size of the kernel, which defines the area/volume around each pixel/voxel
                                that the filter considers when processing the image. A larger kernel means more
                                neighboring elements are included in the calculation.
                            </IonCardContent>
                        </IonCard>
                    </IonContent>
                </IonPopover>
            </IonItem>
            <IonItem>
                <IonLabel>Weight: </IonLabel>
                <IonInput
                    value={Weight}
                    type="number"
                    step="0.1"
                    min={0}
                    onIonChange={(e) =>
                        typeof +e.detail.value! === 'number'
                            ? setWeight(+e.detail.value!)
                            : void showToast('Please insert a valid number!', timeToast)
                    }
                ></IonInput>
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
                                Defines the weight of the standard deviation during the threshold.
                            </IonCardContent>
                        </IonCard>
                    </IonContent>
                </IonPopover>
            </IonItem>
            <IonItem>
                <IonLabel>Range: </IonLabel>
                <IonInput
                    value={Range}
                    type="number"
                    step="0.1"
                    min={0}
                    onIonChange={(e) =>
                        typeof +e.detail.value! === 'number'
                            ? setRange(+e.detail.value!)
                            : void showToast('Please insert a valid number!', timeToast)
                    }
                ></IonInput>
                <IonButton id="showRangeInfo" slot="end" size="small" fill="clear">
                    <IonIcon icon={informationCircleOutline} />
                </IonButton>
                <IonPopover trigger="showRangeInfo" reference="event">
                    <IonContent>
                        <IonCard>
                            <IonCardHeader>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>Range Value</div>
                            </IonCardHeader>
                            <IonCardContent>Specifies the range value used in the calculation.</IonCardContent>
                        </IonCard>
                    </IonContent>
                </IonPopover>
            </IonItem>
            <IonItem>
                <IonLabel>Convolution Type:</IonLabel>
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

export default SauvolaThreshold;
