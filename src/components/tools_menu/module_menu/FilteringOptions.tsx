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
}

const KappaInputWithInfo: React.FC<KappaInputWithInfoProps> = ({ kappa, setKappa }) => {
    return (
        <IonItem>
            <IonLabel>kappa: </IonLabel>
            <IonInput
                value={kappa}
                type="number"
                step="1"
                min={0}
                onIonChange={(e) => {
                    const inputValue = +e.detail.value!;
                    if (typeof inputValue === 'number') {
                        setKappa(inputValue);
                    }
                }}
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
}

const TimeStepInputWithInfo: React.FC<TimeStepInputWithInfoProps> = ({ timeStep, setTimeStep }) => {
    return (
        <IonItem>
            <IonLabel>Time step size: </IonLabel>
            <IonInput
                value={timeStep}
                type="number"
                step="1"
                min={0}
                onIonChange={(e) => {
                    const inputValue = +e.detail.value!;
                    if (typeof inputValue === 'number') {
                        setTimeStep(inputValue);
                    }
                }}
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
}

const IterationsInputWithInfo: React.FC<IterationsInputWithInfoProps> = ({ totalIterations, setTotalIterations }) => {
    return (
        <IonItem>
            <IonLabel>Number of Iterations: </IonLabel>
            <IonInput
                value={totalIterations}
                type="number"
                step="1"
                min={1}
                onIonChange={(e) => {
                    const inputValue = +e.detail.value!;
                    if (Number.isInteger(inputValue)) {
                        setTotalIterations(inputValue);
                    }
                }}
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

interface AnisoNeighbourInputWithInfoProps {
    anisoNeighbour: string;
    setNeighbour: (value: string) => void;
}

const AnisoNeighbourInputWithInfo: React.FC<AnisoNeighbourInputWithInfoProps> = ({ anisoNeighbour, setNeighbour }) => {
    return (
        <IonItem>
            <IonRadioGroup
                value={anisoNeighbour}
                onIonChange={(e) => setNeighbour(e.detail.value)}
                style={{ width: '100%' }}
            >
                <IonGrid>
                    <IonRow class="ion-justify-content-center ion-align-items-center">
                        <IonCol size="auto">
                            <IonItem lines="none">
                                <IonRadio slot="start" value="2D" />
                                <IonLabel>2D</IonLabel>
                            </IonItem>
                        </IonCol>
                        <IonCol size="auto">
                            <IonItem lines="none">
                                <IonRadio slot="start" value="3D" />
                                <IonLabel>3D</IonLabel>
                            </IonItem>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonRadioGroup>
            <IonButton id="showNeighborInfo" slot="end" size="small" fill="clear">
                <IonIcon icon={informationCircleOutline} />
            </IonButton>
            <IonPopover trigger="showNeighborInfo" reference="event">
                <IonContent>
                    <IonCard>
                        <IonCardHeader>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Neighbour 2D or 3D</div>
                        </IonCardHeader>
                        <IonCardContent>
                            Choose between 2D and 3D options for anisotropic diffusion. The choice affects how the
                            diffusion is applied across dimensions.
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
    AnisoNeighbourInputWithInfo,
};
