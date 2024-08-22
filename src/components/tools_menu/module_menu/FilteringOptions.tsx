import React from 'react';
import { IonItem, IonLabel, IonInput, IonButton, IonIcon, IonPopover, IonContent, IonCard, IonCardHeader, IonCardContent, IonSelect, IonSelectOption } from '@ionic/react';
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

const DiffusionOptionSelect: React.FC<{ diffusionOption: number, setDiffusionOption: (value: number) => void }> = ({ diffusionOption, setDiffusionOption }) => {
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
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{diffusionOptions.find(o => o.value === diffusionOption)?.type}</div>
                        </IonCardHeader>
                        <IonCardContent>
                            {diffusionOptions.find(o => o.value === diffusionOption)?.description}
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
                            Kappa is a parameter used in anisotropic diffusion filtering that controls the level of diffusion. Higher values result in stronger smoothing effects, while lower values preserve more detail.
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

const TimeStepInputWithInfo: React.FC<TimeStepInputWithInfoProps> = ({ timeStep, setTimeStep, showToast, timeToast }) => {
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

const IterationsInputWithInfo: React.FC<IterationsInputWithInfoProps> = ({ totalIterations, setTotalIterations, showToast, timeToast }) => {
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
                            More iterations lead to greater diffusion and more smoothing. It tends to converge after a high value.
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </IonItem>
    );
};

export { DiffusionOptionSelect, KappaInputWithInfo, TimeStepInputWithInfo, IterationsInputWithInfo };
