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
interface LocalGaussianThresholdProps {
    Sigma: number;
    setSigma: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
    Threshold: number;
    setThreshold: (value: number) => void;
}

const LocalGaussianThreshold: React.FC<LocalGaussianThresholdProps> = ({
    Sigma,
    setSigma,
    showToast,
    timeToast,
    Threshold,
    setThreshold,
}) => {
    return (
        <>
            <IonItem>
                <IonLabel>Sigma: </IonLabel>
                <IonInput
                    value={Sigma}
                    type="number"
                    step="1"
                    min={3}
                    onIonChange={(e) =>
                        typeof +e.detail.value! === 'number'
                            ? setSigma(+e.detail.value!)
                            : void showToast('Please insert a valid number!', timeToast)
                    }
                ></IonInput>
                <IonButton id="showSigmaInfo" slot="end" size="small" fill="clear">
                    <IonIcon icon={informationCircleOutline} />
                </IonButton>
                <IonPopover trigger="showSigmaInfo" reference="event">
                    <IonContent>
                        <IonCard>
                            <IonCardHeader>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>Kernel Size</div>
                            </IonCardHeader>
                            <IonCardContent>
                                The <strong>Sigma</strong> parameter defines the standard deviation of the Gaussian
                                kernel used in local thresholding. It controls the degree of smoothing applied to the
                                image:
                                <ul>
                                    <li>
                                        <strong>Smaller Sigma:</strong> Focuses on finer details, making the
                                        thresholding more sensitive to local variations but potentially more prone to
                                        noise.
                                    </li>
                                    <li>
                                        <strong>Larger Sigma:</strong> Blurs the image over a wider area, capturing
                                        broader intensity patterns but potentially losing small details.
                                    </li>
                                </ul>
                                Adjust sigma based on the scale of the features in the image to achieve optimal
                                thresholding results.
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

export default LocalGaussianThreshold;
