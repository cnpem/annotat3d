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
} from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';

const diffusionOptions = [
    {
        value: 1,
        label: 'Exponential decay',
        type: 'Diffusion',
        description: 'This option applies exponential decay to the diffusion process.',
    },
    {
        value: 2,
        label: 'Inverse quadratic decay',
        type: 'Diffusion',
        description: 'This option applies inverse quadratic decay to the diffusion process.',
    },
    {
        value: 3,
        label: 'Hyperbolic tangent decay',
        type: 'Diffusion',
        description: 'Tends to converge faster (less iterations) with better results.',
    },
];

const DiffusionOptionSelect: React.FC<{ diffusionOption: number; setDiffusionOption: (value: number) => void }> = ({
    diffusionOption,
    setDiffusionOption,
}) => {
    return (
        <IonItem>
            <IonLabel>Diffusion Option: </IonLabel>
            <IonSelect
                aria-label="Diffusion Option"
                interface="popover"
                placeholder="Select diffusion option"
                value={diffusionOption}
                onIonChange={(e) => setDiffusionOption(e.detail.value)}
            >
                {diffusionOptions.map((option) => (
                    <IonSelectOption key={option.value} value={option.value}>
                        {option.label}
                    </IonSelectOption>
                ))}
            </IonSelect>
            <IonButton id="showDiffusionInfo" slot="end" size="small" fill="clear">
                <IonIcon icon={informationCircleOutline} />
            </IonButton>
            <IonPopover trigger="showDiffusionInfo" reference="event">
                <IonContent>
                    <IonCard>
                        <IonCardHeader>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                                {diffusionOptions.find((o) => o.value === diffusionOption)?.type}
                            </div>
                        </IonCardHeader>
                        <IonCardContent>
                            {diffusionOptions.find((o) => o.value === diffusionOption)?.description}
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </IonItem>
    );
};

// KappaInputWithInfo Component
interface KappaInputWithInfoProps {
    kappa: number;
    setKappa: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
}

const KappaInputWithInfo: React.FC<KappaInputWithInfoProps> = ({ kappa, setKappa, showToast, timeToast }) => {
    return (
        <IonItem>
            <IonLabel>kappa: </IonLabel>
            <IonInput
                value={kappa}
                type="number"
                step="1"
                min={0}
                onIonChange={(e) =>
                    typeof +e.detail.value! === 'number'
                        ? setKappa(+e.detail.value!)
                        : void showToast('Please insert a valid number!', timeToast)
                }
            ></IonInput>
            <IonButton id="showKappaInfo" slot="end" size="small" fill="clear">
                <IonIcon icon={informationCircleOutline} />
            </IonButton>
            <IonPopover trigger="showKappaInfo" reference="event">
                <IonContent>
                    <IonCard>
                        <IonCardHeader>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Kappa Parameter</div>
                        </IonCardHeader>
                        <IonCardContent>
                            Kappa is a parameter used in anisotropic diffusion filtering that controls the level of
                            diffusion. Higher values result in stronger smoothing effects, while lower values preserve
                            more detail.
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </IonItem>
    );
};

// TimeStepInputWithInfo Component
interface TimeStepInputWithInfoProps {
    timeStep: number;
    setTimeStep: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
}

const TimeStepInputWithInfo: React.FC<TimeStepInputWithInfoProps> = ({
    timeStep,
    setTimeStep,
    showToast,
    timeToast,
}) => {
    return (
        <IonItem>
            <IonLabel>Time step size: </IonLabel>
            <IonInput
                value={timeStep}
                type="number"
                step="1"
                min={0}
                onIonChange={(e) =>
                    typeof +e.detail.value! === 'number'
                        ? setTimeStep(+e.detail.value!)
                        : void showToast('Please insert a valid number!', timeToast)
                }
            ></IonInput>
            <IonButton id="showTimeStepInfo" slot="end" size="small" fill="clear">
                <IonIcon icon={informationCircleOutline} />
            </IonButton>
            <IonPopover trigger="showTimeStepInfo" reference="event">
                <IonContent>
                    <IonCard>
                        <IonCardHeader>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Time Step Size</div>
                        </IonCardHeader>
                        <IonCardContent>
                            A smaller time step can lead to more precise but slower convergence.
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </IonItem>
    );
};

// IterationsInputWithInfo Component
interface IterationsInputWithInfoProps {
    totalIterations: number;
    setTotalIterations: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
}

const IterationsInputWithInfo: React.FC<IterationsInputWithInfoProps> = ({
    totalIterations,
    setTotalIterations,
    showToast,
    timeToast,
}) => {
    return (
        <IonItem>
            <IonLabel>Number of Iterations: </IonLabel>
            <IonInput
                value={totalIterations}
                type="number"
                step="1"
                min={1}
                onIonChange={(e) =>
                    Number.isInteger(+e.detail.value!)
                        ? setTotalIterations(+e.detail.value!)
                        : void showToast('Please insert an integer value!', timeToast)
                }
            ></IonInput>
            <IonButton id="showIterationsInfo" slot="end" size="small" fill="clear">
                <IonIcon icon={informationCircleOutline} />
            </IonButton>
            <IonPopover trigger="showIterationsInfo" reference="event">
                <IonContent>
                    <IonCard>
                        <IonCardHeader>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Number of Iterations</div>
                        </IonCardHeader>
                        <IonCardContent>
                            More iterations lead to greater diffusion and more smoothing. It tends to converge after a
                            high value.
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </IonItem>
    );
};

// KernelInputWithInfo Component
interface KernelMeanInputWithInfoProps {
    Kernel: number;
    setKernelSize: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
}

const KernelMeanInputWithInfo: React.FC<KernelMeanInputWithInfoProps> = ({
    Kernel,
    setKernelSize,
    showToast,
    timeToast,
}) => {
    return (
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
                            Specifies the size of the kernel, which defines the area/volume around each pixel/voxel that
                            the filter considers when processing the image. A larger kernel means more neighboring
                            elements are included in the calculation.
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </IonItem>
    );
};

// KernelInputWithInfo Component
interface KernelMedianInputWithInfoProps {
    Kernel: number;
    setKernelSize: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
}

const KernelMedianInputWithInfo: React.FC<KernelMedianInputWithInfoProps> = ({
    Kernel,
    setKernelSize,
    showToast,
    timeToast,
}) => {
    return (
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
            <IonButton id="showKernelMedianInfo" slot="end" size="small" fill="clear">
                <IonIcon icon={informationCircleOutline} />
            </IonButton>
            <IonPopover trigger="showKernelMedianInfo" reference="event">
                <IonContent>
                    <IonCard>
                        <IonCardHeader>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Kernel Size</div>
                        </IonCardHeader>
                        <IonCardContent>
                            Specifies the size of the kernel, which defines the area around each pixel that processing
                            processing the image. A larger kernel means more neighboring elements are included in
                            included in the calculation.
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </IonItem>
    );
};

// SigmaInputWithInfo Component
interface SigmaGaussianInputWithInfoProps {
    Sigma: number;
    setSigma: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
}

const SigmaGaussianInputWithInfo: React.FC<SigmaGaussianInputWithInfoProps> = ({
    Sigma,
    setSigma,
    showToast,
    timeToast,
}) => {
    return (
        <IonItem>
            <IonLabel>Sigma: </IonLabel>
            <IonInput
                value={Sigma}
                type="number"
                step="0.1"
                min={0}
                onIonChange={(e) =>
                    typeof +e.detail.value! === 'number'
                        ? setSigma(+e.detail.value!)
                        : void showToast('Please insert a valid number!', timeToast)
                }
            ></IonInput>
            <IonButton id="showSigmaGaussianInfo" slot="end" size="small" fill="clear">
                <IonIcon icon={informationCircleOutline} />
            </IonButton>
            <IonPopover trigger="showSigmaGaussianInfo" reference="event">
                <IonContent>
                    <IonCard>
                        <IonCardHeader>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Sigma</div>
                        </IonCardHeader>
                        <IonCardContent>
                            Sigma determines the amount of smoothing applied by the Gaussian filter. A larger sigma
                            value results in more blurring, as it spreads out the effect over a wider area or volume.
                            Adjusting sigma allows for fine-tuning the level of detail in the filtered image.
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </IonItem>
    );
};

// SigmaInputWithInfo Component
interface SigmaUMInputWithInfoProps {
    Sigma: number;
    setSigma: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
}

const SigmaUMInputWithInfo: React.FC<SigmaUMInputWithInfoProps> = ({ Sigma, setSigma, showToast, timeToast }) => {
    return (
        <IonItem>
            <IonLabel>Sigma: </IonLabel>
            <IonInput
                value={Sigma}
                type="number"
                step="0.1"
                min={0}
                onIonChange={(e) =>
                    typeof +e.detail.value! === 'number'
                        ? setSigma(+e.detail.value!)
                        : void showToast('Please insert a valid number!', timeToast)
                }
            ></IonInput>
            <IonButton id="showSigmaUMInfo" slot="end" size="small" fill="clear">
                <IonIcon icon={informationCircleOutline} />
            </IonButton>
            <IonPopover trigger="showSigmaUMInfo" reference="event">
                <IonContent>
                    <IonCard>
                        <IonCardHeader>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Sigma</div>
                        </IonCardHeader>
                        <IonCardContent>
                            Sigma determines the amount of smoothing applied by the Gaussian filter. A larger sigma
                            value results in more blurring, as it spreads out the effect over a wider area or volume.
                            Adjusting sigma allows for fine-tuning the level of detail in the filtered image.
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </IonItem>
    );
};

// AmountInputWithInfo Component
interface AmountInputWithInfoProps {
    Amount: number;
    setAmount: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
}

const AmountInputWithInfo: React.FC<AmountInputWithInfoProps> = ({ Amount, setAmount, showToast, timeToast }) => {
    return (
        <IonItem>
            <IonLabel>Amount: </IonLabel>
            <IonInput
                value={Amount}
                type="number"
                step="0.1"
                min={0}
                onIonChange={(e) =>
                    typeof +e.detail.value! === 'number'
                        ? setAmount(+e.detail.value!)
                        : void showToast('Please insert a valid number!', timeToast)
                }
            ></IonInput>
            <IonButton id="showAmountInfo" slot="end" size="small" fill="clear">
                <IonIcon icon={informationCircleOutline} />
            </IonButton>
            <IonPopover trigger="showAmountInfo" reference="event">
                <IonContent>
                    <IonCard>
                        <IonCardHeader>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Amount</div>
                        </IonCardHeader>
                        <IonCardContent>
                            The Amount parameter controls the intensity of the sharpening effect in the unsharp mask
                            filter. Higher values increase the contrast between edges, making details appear more
                            pronounced. Adjusting this value allows you to enhance or soften the sharpening effect.
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </IonItem>
    );
};

// ThresholdInputWithInfo Component
interface ThresholdInputWithInfoProps {
    Threshold: number;
    setThreshold: (value: number) => void;
    showToast: (message: string, duration: number) => void;
    timeToast: number;
}

const ThresholdInputWithInfo: React.FC<ThresholdInputWithInfoProps> = ({
    Threshold,
    setThreshold,
    showToast,
    timeToast,
}) => {
    return (
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
                            The Threshold parameter determines the minimum contrast level required for sharpening to be
                            applied. Higher threshold values prevent sharpening of low-contrast areas, focusing the
                            effect only on more pronounced edges. This helps in avoiding noise enhancement in smoother
                            areas of the image.
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </IonItem>
    );
};

export {
    DiffusionOptionSelect,
    KappaInputWithInfo,
    TimeStepInputWithInfo,
    IterationsInputWithInfo,
    KernelMeanInputWithInfo,
    KernelMedianInputWithInfo,
    SigmaGaussianInputWithInfo,
    SigmaUMInputWithInfo,
    AmountInputWithInfo,
    ThresholdInputWithInfo,
};
