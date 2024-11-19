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
interface SauvolaThresholdProps {
    Kernel: number;
    setKernelSize: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
    Weight: number;
    setWeight: (value: number) => void;
    Range: number;
    setRange: (value: number) => void;
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
                <IonButton id="showRangeInfo" slot="end" size="small" fill="clear">
                    <IonIcon icon={informationCircleOutline} />
                </IonButton>
                <IonPopover trigger="showRangeInfo" reference="event">
                    <IonContent>
                        <IonCard>
                            <IonCardHeader>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>Range Value</div>
                            </IonCardHeader>
                            <IonCardContent>Range.</IonCardContent>
                        </IonCard>
                    </IonContent>
                </IonPopover>
            </IonItem>
        </>
    );
};

export default SauvolaThreshold;
