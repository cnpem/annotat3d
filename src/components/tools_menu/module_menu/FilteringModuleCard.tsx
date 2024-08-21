import { IonInput, IonItem, IonLabel, IonRadio, IonRadioGroup, IonToggle, useIonToast } from '@ionic/react';
import { useState } from 'react';
import { useStorageState } from 'react-storage-hooks';
import { currentEventValue, dispatch } from '../../../utils/eventbus';
import { sfetch } from '../../../utils/simplerequest';
import LoadingComponent from '../utils/LoadingComponent';
import { ModuleCard, ModuleCardItem } from './ModuleCard';

function onApplyThen(info: { slice: number; axis: string }) {
    dispatch('imageChanged', info);
}

const timeToast = 2000;
const toastMessages = {
    onPreview: 'Preview done!',
    onApply: 'Apply done!',
};

const BM3DFilteringModuleCard: React.FC = () => {
    const [showToast] = useIonToast();

    const [disabled, setDisabled] = useState<boolean>(false);

    const [sigma, setSigma] = useStorageState<number>(sessionStorage, 'bm3dSigma', 1024);
    const [twostep, setTwostep] = useStorageState<boolean>(sessionStorage, 'bm3dTwostep', false);

    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            sigma,
            twostep,
            axis: curSlice.axis,
            slice: curSlice.slice,
        };

        setDisabled(true);

        setShowLoadingComp(true);
        setLoadingMsg('Creating the preview');

        sfetch('POST', '/filters/bm3d/preview/image/future', JSON.stringify(params))
            .then(() => {
                dispatch('futureChanged', curSlice);
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingComp(false);
                void showToast(toastMessages.onPreview, timeToast);
            });
    }

    function onApply() {
        const params = {
            sigma,
            twostep,
        };

        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Applying');

        sfetch('POST', '/filters/bm3d/apply/image/image', JSON.stringify(params))
            .then(() => {
                onApplyThen(curSlice);
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingComp(false);
                void showToast(toastMessages.onApply, timeToast);
            });
    }

    return (
        <ModuleCard disabled={disabled} name="BM3D Smooth Filtering" onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <IonItem>
                    <IonLabel>Sigma</IonLabel>
                    <IonInput
                        value={sigma}
                        type="number"
                        step="0.1"
                        min={0.1}
                        onIonChange={(e) => setSigma(+e.detail.value!)}
                    ></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Two Step</IonLabel>
                    <IonToggle checked={twostep} onIonChange={(e) => setTwostep(e.detail.checked)}></IonToggle>
                </IonItem>
            </ModuleCardItem>
            <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={loadingMsg} />
        </ModuleCard>
    );
};

const GaussianFilteringModuleCard: React.FC = () => {
    const [showToast] = useIonToast();

    const [disabled, setDisabled] = useState<boolean>(false);

    const [sigma, setSigma] = useStorageState<number>(sessionStorage, 'gaussianSigma', 2);
    const [convType, setConvType] = useStorageState<string>(sessionStorage, 'gaussianConvType', '2d');

    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            sigma,
            convType,
            axis: curSlice.axis,
            slice: curSlice.slice,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Creating the preview');

        sfetch('POST', '/filters/gaussian/preview/image/future', JSON.stringify(params))
            .then(() => {
                dispatch('futureChanged', curSlice);
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingComp(false);
                void showToast(toastMessages.onPreview, timeToast);
            });
    }

    function onApply() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            sigma,
            convType,
            axis: curSlice.axis,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Applying');

        sfetch('POST', '/filters/gaussian/apply/image/image', JSON.stringify(params))
            .then(() => {
                onApplyThen(curSlice);
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingComp(false);
                void showToast(toastMessages.onApply, timeToast);
            });
    }

    return (
        <ModuleCard disabled={disabled} name="Gaussian Filtering" onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <IonItem>
                    <IonLabel>Sigma</IonLabel>
                    <IonInput
                        value={sigma}
                        type="number"
                        step="0.1"
                        min={0.1}
                        onIonChange={(e) => setSigma(+e.detail.value!)}
                    ></IonInput>
                </IonItem>
                <IonRadioGroup value={convType} onIonChange={(e) => setConvType(e.detail.value)}>
                    <IonItem>
                        <IonLabel>2D Convolution</IonLabel>
                        <IonRadio value="2d" />
                    </IonItem>
                    <IonItem>
                        <IonLabel>3D Convolution</IonLabel>
                        <IonRadio value="3d"></IonRadio>
                    </IonItem>
                </IonRadioGroup>
            </ModuleCardItem>
            <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={loadingMsg} />
        </ModuleCard>
    );
};

const NonLocalMeansFilteringModuleCard: React.FC = () => {
    const [showToast] = useIonToast();

    const [disabled, setDisabled] = useState<boolean>(false);

    const [sigma, setSigma] = useStorageState<number>(sessionStorage, 'nlmSigma', 2);
    const [nlmStep, setNlmStep] = useStorageState<number>(sessionStorage, 'nlmStep', 2);
    const [gaussianStep, setGaussianStep] = useStorageState<number>(sessionStorage, 'gaussianStep', 2);

    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            sigma,
            nlmStep,
            gaussianStep,
            axis: curSlice.axis,
            slice: curSlice.slice,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Creating the preview');

        sfetch('POST', '/filters/nlm/preview/image/future', JSON.stringify(params))
            .then(() => {
                dispatch('futureChanged', curSlice);
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingComp(false);
                void showToast(toastMessages.onPreview, timeToast);
            });
    }

    function onApply() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            sigma,
            nlmStep,
            gaussianStep,
            axis: curSlice.axis,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Applying');

        sfetch('POST', '/filters/nlm/apply/image/image', JSON.stringify(params))
            .then(() => {
                onApplyThen(curSlice);
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingComp(false);
                void showToast(toastMessages.onApply, timeToast);
            });
    }

    return (
        <ModuleCard disabled={disabled} name="Non Local Means Filtering" onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <IonItem>
                    <IonLabel>Sigma</IonLabel>
                    <IonInput
                        value={sigma}
                        type="number"
                        step="0.1"
                        min={0.1}
                        onIonChange={(e) => setSigma(+e.detail.value!)}
                    ></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>NLM Step</IonLabel>
                    <IonInput
                        value={nlmStep}
                        type="number"
                        step="1"
                        min={1}
                        onIonChange={(e) =>
                            Number.isInteger(+e.detail.value!)
                                ? setNlmStep(+e.detail.value!)
                                : void showToast('Please insert an integer value!', timeToast)
                        }
                    ></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Gaussian Step</IonLabel>
                    <IonInput
                        value={gaussianStep}
                        type="number"
                        step="1"
                        min={1}
                        onIonChange={(e) =>
                            Number.isInteger(+e.detail.value!)
                                ? setGaussianStep(+e.detail.value!)
                                : void showToast('Please insert an integer value!', timeToast)
                        }
                    ></IonInput>
                </IonItem>
            </ModuleCardItem>
            <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={loadingMsg} />
        </ModuleCard>
    );
};

const AnisotropicDiffusionFilteringModuleCard: React.FC = () => {

    const diffusionOptions = [
        { value: 1, label: 'Exponential decay' },
        { value: 2, label: 'Inverse quadratic decay' },
        { value: 3, label: 'Hyperbolic tangent decay' },
    ];

    const [showToast] = useIonToast();

    const [disabled, setDisabled] = useState<boolean>(false);

    const [kappa, setKappa] = useState<number>(2);
    const [totalIterations, setTotalIterations] = useState<number>(2);
    const [TimeStep, setTimeStep] = useState<number>(2);
    const [diffusionOption, setdiffusionOption] = useState<number>(3);


    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            total_iterations: totalIterations,
            delta_t : TimeStep,
            kappa: kappa,
            diffusion_option: diffusionOption,
            aniso3D: aniso3D,
            axis: curSlice.axis,
            slice: curSlice.slice,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Creating the preview');

        sfetch('POST', '/filters/anisodiff/preview/image/future', JSON.stringify(params))
            .then(() => {
                dispatch('futureChanged', curSlice);
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingComp(false);
                void showToast(toastMessages.onPreview, timeToast);
            });
    }

    function onApply() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            sigma,
            nlmStep,
            gaussianStep,
            axis: curSlice.axis,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Applying');

        sfetch('POST', '/filters/anisodiff/apply/image/image', JSON.stringify(params))
            .then(() => {
                onApplyThen(curSlice);
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingComp(false);
                void showToast(toastMessages.onApply, timeToast);
            });
    }

    return (
        <ModuleCard disabled={disabled} name="Anisotropic Diffusion Filtering" onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <IonItem>
                    <IonLabel>kappa</IonLabel>
                    <IonInput
                        value={kappa}
                        type="number"
                        step="0.1"
                        min={0.1}
                        onIonChange={(e) =>                             
                        typeof +e.detail.value! == 'number'
                        ? setTimeStep(+e.detail.value!)
                        : void showToast('Please insert an valid number!', timeToast)}
                    ></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Time step size</IonLabel>
                    <IonInput
                        value={TimeStep}
                        type="number"
                        step="1"
                        min={0}
                        onIonChange={(e) =>
                            typeof +e.detail.value! == 'number'
                                ? setTimeStep(+e.detail.value!)
                                : void showToast('Please insert an valid number!', timeToast)
                        }
                    ></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Number of Iterations</IonLabel>
                    <IonInput
                        value={totalIterations}
                        type="number"
                        step="1"
                        min={1}
                        onIonChange={(e) =>
                            Number.isInteger(+e.detail.value!)
                                ? setGaussianStep(+e.detail.value!)
                                : void showToast('Please insert an integer value!', timeToast)
                        }
                    ></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Diffusion Option</IonLabel>
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
                </IonItem>
            </ModuleCardItem>
            <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={loadingMsg} />
        </ModuleCard>
    );
};

export { BM3DFilteringModuleCard, GaussianFilteringModuleCard, NonLocalMeansFilteringModuleCard, AnisotropicDiffusionFilteringModuleCard };
