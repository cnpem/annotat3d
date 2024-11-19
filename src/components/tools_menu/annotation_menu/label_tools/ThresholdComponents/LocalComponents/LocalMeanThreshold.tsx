import React from 'react';
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
    IonSelect,
    IonSelectOption,
    IonRadio,
    IonRadioGroup,
    IonGrid,
    IonRow,
    IonCol,
    IonNote,
} from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';

// KernelInputWithInfo Component
interface LocalMeanThresholdProps {
    Kernel: number;
    setKernelSize: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
    Threshold: number;
    setThreshold: (value: number) => void;
}

const LocalMeanThreshold: React.FC<LocalMeanThresholdProps> = ({
    Kernel,
    setKernelSize,
    showToast,
    timeToast,
    Threshold,
    setThreshold,
}) => {
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
                <IonButton id="showKernelMeanInfo" slot="end" size="small" fill="clear">
                    <IonIcon icon={informationCircleOutline} />
                </IonButton>
                <IonPopover trigger="showKernelMeanInfo" reference="event">
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
                                The Threshold parameter determines the minimum value required for limiarization.
                            </IonCardContent>
                        </IonCard>
                    </IonContent>
                </IonPopover>
            </IonItem>
        </>
    );
};

export default LocalMeanThreshold;
