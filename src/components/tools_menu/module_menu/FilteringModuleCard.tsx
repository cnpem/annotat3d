/* eslint-disable @typescript-eslint/no-misused-promises */
import {
    IonInput,
    IonItem,
    IonLabel,
    IonRadio,
    IonRadioGroup,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    useIonToast,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
} from '@ionic/react';
import { useState } from 'react';
import { useStorageState } from 'react-storage-hooks';
import { currentEventValue, dispatch } from '../../../utils/eventbus';
import { sfetch } from '../../../utils/simplerequest';
import LoadingComponent from '../utils/LoadingComponent';
import { ModuleCard, ModuleCardItem } from './ModuleCard';
import {
    DiffusionOptionSelect,
    KappaInputWithInfo,
    TimeStepInputWithInfo,
    IterationsInputWithInfo,
    AnisoNeighbourInputWithInfo,
    KernelMeanInputWithInfo,
    KernelMedianInputWithInfo,
    SigmaGaussianInputWithInfo,
    SigmaUMInputWithInfo,
    AmountInputWithInfo,
    ThresholdInputWithInfo,
} from './FilteringOptions';

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
                <SigmaGaussianInputWithInfo
                    Sigma={sigma}
                    setSigma={setSigma}
                    showToast={showToast}
                    timeToast={timeToast}
                />
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

const MeanFilteringModuleCard: React.FC = () => {
    const [showToast] = useIonToast();

    const [disabled, setDisabled] = useState<boolean>(false);

    const [Kernel, setKernelSize] = useStorageState<number>(sessionStorage, 'Kernel', 3);
    const [convType, setConvType] = useStorageState<string>(sessionStorage, 'convType', '2d');

    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            Kernel,
            convType,
            axis: curSlice.axis,
            slice: curSlice.slice,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Creating the preview');

        sfetch('POST', '/filters/mean/preview/image/future', JSON.stringify(params))
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
            Kernel,
            convType,
            axis: curSlice.axis,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Applying');

        sfetch('POST', '/filters/mean/apply/image/image', JSON.stringify(params))
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
        <ModuleCard disabled={disabled} name="Mean Filtering" onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <KernelMeanInputWithInfo
                    Kernel={Kernel}
                    setKernelSize={setKernelSize}
                    showToast={showToast}
                    timeToast={timeToast}
                />
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

    const [kappa, setKappa] = useStorageState<number>(sessionStorage, 'kappa', 100);
    const [totalIterations, setTotalIterations] = useStorageState<number>(sessionStorage, 'totalIterations', 1);
    const [timeStep, setTimeStep] = useStorageState<number>(sessionStorage, 'TimeStep', 0.1);
    const [diffusionOption, setDiffusionOption] = useStorageState<number>(sessionStorage, 'diffusionOption', 3);
    const [anisoNeighbour, setNeighbour] = useStorageState<string>(sessionStorage, 'anisoNeighbour', '2D');

    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            total_iterations: totalIterations,
            delta_t: timeStep,
            kappa,
            diffusion_option: diffusionOption,
            aniso3D: anisoNeighbour === '2D',
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
            total_iterations: totalIterations,
            delta_t: timeStep,
            kappa,
            diffusion_option: diffusionOption,
            aniso3D: anisoNeighbour === '2D',
            axis: curSlice.axis,
            slice: curSlice.slice,
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
        <ModuleCard disabled={disabled} name="Anisotropic Diffusion" onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <DiffusionOptionSelect diffusionOption={diffusionOption} setDiffusionOption={setDiffusionOption} />

                <KappaInputWithInfo kappa={kappa} setKappa={setKappa} />

                <TimeStepInputWithInfo timeStep={timeStep} setTimeStep={setTimeStep} />

                <IterationsInputWithInfo totalIterations={totalIterations} setTotalIterations={setTotalIterations} />

                <AnisoNeighbourInputWithInfo anisoNeighbour={anisoNeighbour} setNeighbour={setNeighbour} />
            </ModuleCardItem>
            <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={loadingMsg} />
        </ModuleCard>
    );
};

const UnsharpMaskFilteringModuleCard: React.FC = () => {
    const [showToast] = useIonToast();

    const [disabled, setDisabled] = useState<boolean>(false);

    const [Sigma, setSigma] = useStorageState<number>(sessionStorage, 'Sigma', 1);
    const [Amount, setAmount] = useStorageState<number>(sessionStorage, 'Amount', 1);
    const [Threshold, setThreshold] = useStorageState<number>(sessionStorage, 'Threshold', 0);
    const [convType, setConvType] = useStorageState<string>(sessionStorage, 'convType', '2d');

    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            Sigma,
            Amount,
            Threshold,
            convType,
            axis: curSlice.axis,
            slice: curSlice.slice,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Creating the preview');

        sfetch('POST', '/filters/UMFilter/preview/image/future', JSON.stringify(params))
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
            Sigma,
            Amount,
            Threshold,
            convType,
            axis: curSlice.axis,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Applying');

        sfetch('POST', '/filters/UMFilter/apply/image/image', JSON.stringify(params))
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
        <ModuleCard disabled={disabled} name="Unsharp Mask Filter" onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <SigmaUMInputWithInfo Sigma={Sigma} setSigma={setSigma} showToast={showToast} timeToast={timeToast} />
                <AmountInputWithInfo
                    Amount={Amount}
                    setAmount={setAmount}
                    showToast={showToast}
                    timeToast={timeToast}
                />
                <ThresholdInputWithInfo
                    Threshold={Threshold}
                    setThreshold={setThreshold}
                    showToast={showToast}
                    timeToast={timeToast}
                />
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

const MedianFilteringModuleCard: React.FC = () => {
    const [showToast] = useIonToast();

    const [disabled, setDisabled] = useState<boolean>(false);

    const [Kernel, setKernelSize] = useStorageState<number>(sessionStorage, 'Kernel', 3);
    const [convType, setConvType] = useStorageState<string>(sessionStorage, 'convType', '2d');

    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            Kernel,
            convType,
            axis: curSlice.axis,
            slice: curSlice.slice,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Creating the preview');

        sfetch('POST', '/filters/median/preview/image/future', JSON.stringify(params))
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
            Kernel,
            convType,
            axis: curSlice.axis,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Applying');

        sfetch('POST', '/filters/median/apply/image/image', JSON.stringify(params))
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
        <ModuleCard disabled={disabled} name="Median Filtering" onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <KernelMedianInputWithInfo
                    Kernel={Kernel}
                    setKernelSize={setKernelSize}
                    showToast={showToast}
                    timeToast={timeToast}
                />
            </ModuleCardItem>
            <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={loadingMsg} />
        </ModuleCard>
    );
};

export {
    BM3DFilteringModuleCard,
    GaussianFilteringModuleCard,
    MeanFilteringModuleCard,
    NonLocalMeansFilteringModuleCard,
    AnisotropicDiffusionFilteringModuleCard,
    UnsharpMaskFilteringModuleCard,
    MedianFilteringModuleCard,
};
