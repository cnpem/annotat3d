import {
    IonItem,
    IonLabel,
    IonList,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonButton,
    IonPopover,
    IonContent,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonNote,
    useIonToast,
    IonSegmentButton,
    IonSegment,
} from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';
import isEqual from 'lodash.isequal';
import React, { Fragment, useEffect, useState } from 'react';
import { useStorageState } from 'react-storage-hooks';
import { currentEventValue, useEventBus, dispatch } from '../../../utils/eventbus';
import { sfetch } from '../../../utils/simplerequest';
import { ModuleCard, ModuleCardItem } from './ModuleCard';
import LoadingComponent from '../utils/LoadingComponent';
import {
    InitDefaultModelClassifierParams,
    initialParamsValues,
    classifiers,
    Classifier,
    Feature,
    FeatureParams,
    ClassifierParams,
    ModelClassifierParams,
} from './SuperpixelSegInterface';
import ErrorInterface from '../../main_menu/file/utils/ErrorInterface';
import ErrorWindowComp from '../../main_menu/file/utils/ErrorWindowComp';

interface FineTuneStatus {
    isFineTuneAvailable: boolean;
    fineTuneMessage: string;
    classParams: ClassifierParams | null;
    featParams: FeatureParams | null;
}

function useFineTuneStatus(trainingMode: 'train' | 'finetune', classifier: string): FineTuneStatus {
    const [isFineTuneAvailable, setIsFineTuneAvailable] = useState(false);
    const [fineTuneMessage, setFineTuneMessage] = useState('');
    const [classParams, setClassParams] = useState<ClassifierParams | null>(null);
    const [featParams, setFeatParams] = useState<FeatureParams | null>(null);

    useEffect(() => {
        if (trainingMode === 'finetune') {
            if (classifier !== 'mlp') {
                setIsFineTuneAvailable(false);
                setFineTuneMessage('Fine-tune is only available for MLP classifiers.');
                return;
            }

            void sfetch('POST', '/models/current/pixel', '', 'json')
                .then((response: any) => {
                    if (!response.loaded) {
                        setIsFineTuneAvailable(false);
                        setFineTuneMessage('Fine-tune requires a loaded MLP model.');
                    } else if (response.mode !== 'pixel') {
                        setIsFineTuneAvailable(false);
                        setFineTuneMessage(
                            `Fine-tune only works with Pixel MLP models. Loaded: ${String(response.mode) || 'Unknown'}.`
                        );
                    } else {
                        setIsFineTuneAvailable(true);
                        setFineTuneMessage('Parameters locked, inherited from loaded MLP model.');
                        setClassParams(response.classifier_parameters);
                        setFeatParams(response.feature_extraction_params);
                    }
                })
                .catch((error: any) => {
                    console.error('Error while checking model status:', error);
                    setIsFineTuneAvailable(false);
                    setFineTuneMessage(`Unable to check model status.`);
                });
        }
    }, [trainingMode, classifier]);

    return { isFineTuneAvailable, fineTuneMessage, classParams, featParams };
}

const PixelSegmentationModuleCard: React.FC = () => {
    const [defaultModelClassifierParams] = useStorageState(
        sessionStorage,
        'defaultModelClassifierParams',
        InitDefaultModelClassifierParams
    );
    const [prevFeatParams, setPrevFeatParams] = useStorageState<FeatureParams>(sessionStorage, 'pixelPrevFeatParams');
    const [featParams, setFeatParams] = useStorageState<FeatureParams>(
        sessionStorage,
        'pixelFeatParams',
        initialParamsValues
    );
    const [prevClassParams, setPrevClassParams] = useStorageState<ClassifierParams>(
        sessionStorage,
        'pixelPrevClassParams'
    );
    const [classParams, setClassParams] = useStorageState<ClassifierParams>(sessionStorage, 'pixelClassParams', {
        classifier: 'rf',
        params: defaultModelClassifierParams.rf,
    });

    const [isEditLabelActivated, setIsEditLabelActivated] = useStorageState<boolean>(
        sessionStorage,
        'isEditLabelActivatedPixel',
        false
    );
    const [hasPreprocessed, setHasPreprocessed] = useStorageState<boolean>(
        sessionStorage,
        'pixelSegmPreprocessed',
        false
    );

    const [loadingMsg, setLoadingMsg] = useState('');
    const [showLoadingCompPS, setShowLoadingCompPS] = useState(false);
    const [trainingMode, setTrainingMode] = useStorageState<'train' | 'finetune'>(
        sessionStorage,
        'pixelTrainingMode',
        'train'
    );

    const [showToast] = useIonToast();
    const timeToast = 2000;

    const [showErrorWindow, setShowErrorWindow] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [headerErrorMsg, setHeaderErrorMsg] = useState('');

    const toastMessages = {
        onTrain: trainingMode === 'train' ? 'Training done!' : 'Fine-tuning done!',
        onPreview: 'Preview done!',
        onApply: 'Apply done!',
    };

    const loadingMessages = {
        onTrain: trainingMode === 'train' ? 'Training' : 'Fine-tuning',
        onPreview: 'Preparing preview',
        onApply: 'Applying',
    };

    // === Fine-tune hook ===
    const { isFineTuneAvailable, fineTuneMessage } = useFineTuneStatus(trainingMode, classParams.classifier);

    // === Params change tracking (only in train mode) ===
    useEffect(() => {
        if (trainingMode === 'train') {
            setHasPreprocessed(!isEqual(prevFeatParams, featParams));
        }
    }, [featParams, prevFeatParams, trainingMode]);

    useEffect(() => {
        if (trainingMode === 'train') {
            setHasPreprocessed(!isEqual(prevClassParams, classParams));
        }
    }, [classParams, prevClassParams, trainingMode]);

    // === EventBus hooks ===
    useEventBus('ImageLoaded', () => {
        setPrevFeatParams(null);
        setPrevClassParams(null);
    });
    useEventBus('isEditLabelDisabled', (flagPayload: boolean) => {
        setIsEditLabelActivated(flagPayload);
    });

    function getModuleBackendParams() {
        return {
            classifier_params: {
                classifier_type: classParams.classifier,
                grid_search: false,
            },
            classifier_values: {
                id: classParams.params[0].id,
                value: classParams.params[0].value,
            },
            feature_extraction_params: {
                sigmas: featParams.multiscale,
                selected_features: featParams.feats.filter((p) => p.active).map((p) => p.id),
                feat_selection_enabled: featParams.thresholdSelection !== undefined,
                feat_selection_method_threshold: featParams.thresholdSelection,
            },
        };
    }

    // === Apply ===
    function onApply() {
        setShowLoadingCompPS(true);
        setLoadingMsg(loadingMessages.onApply);
        sfetch('POST', '/pixel_segmentation_module/execute', '')
            .then(() => {
                dispatch('labelChanged', '');
                setShowLoadingCompPS(false);
                void showToast(toastMessages.onApply, timeToast);
                dispatch('useSuperpixelModule', false);
            })
            .catch((error: ErrorInterface) => {
                setShowErrorWindow(true);
                setHeaderErrorMsg(`error on apply in pixel segmentation menu`);
                setErrorMsg(error.error_msg);
                setHasPreprocessed(false);
                setShowLoadingCompPS(false);
            });
    }

    // === Train / Fine-tune ===
    function onTrain() {
        const params = getModuleBackendParams();
        dispatch('useSuperpixelModule', false);
        setShowLoadingCompPS(true);
        setLoadingMsg(loadingMessages.onTrain);

        const moduleType = 'pixel';
        const finetuneFlag = trainingMode === 'finetune' ? 'true' : 'false';
        const url = `/segmentation_module/train?module=${moduleType}&finetune=${finetuneFlag}`;

        sfetch('POST', url, JSON.stringify(params), 'json')
            .then(() => {
                setPrevFeatParams(featParams);
                setPrevClassParams(classParams);
                void showToast(toastMessages.onTrain, timeToast);
                setHasPreprocessed(true);
                setShowLoadingCompPS(false);
            })
            .catch((error: ErrorInterface) => {
                setShowErrorWindow(true);
                setHeaderErrorMsg(`error on ${trainingMode} in ${moduleType} segmentation menu`);
                setErrorMsg(error.error_msg);
                setHasPreprocessed(false);
                setShowLoadingCompPS(false);
            });
    }

    // === Slice Preview ===
    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as { slice: number; axis: string };

        setShowLoadingCompPS(true);
        setLoadingMsg(loadingMessages.onPreview);

        sfetch('POST', '/pixel_segmentation_module/preview', JSON.stringify(curSlice))
            .then(() => {
                dispatch('labelChanged', '');
                setShowLoadingCompPS(false);
                setHasPreprocessed(true);
                void showToast(toastMessages.onPreview, timeToast);
            })
            .catch((error: ErrorInterface) => {
                console.log('error in pixel_segmentation_module preview', error.error_msg);
                setShowErrorWindow(true);
                setHeaderErrorMsg(`error on preview in pixel segmentation menu`);
                setErrorMsg(error.error_msg);
                setHasPreprocessed(false);
                setShowLoadingCompPS(false);
            });
    }

    // === Button disable logic ===
    const disableAllWhenFinetuneInvalid = trainingMode === 'finetune' && !isFineTuneAvailable;

    const trainButtonName = trainingMode === 'train' ? 'Train' : 'Fine-tune';

    return (
        <ModuleCard
            name="Pixel Segmentation"
            onApply={onApply}
            onPreview={onPreview}
            onOther={onTrain}
            disabledApply={disableAllWhenFinetuneInvalid}
            disabledPreview={disableAllWhenFinetuneInvalid || isEditLabelActivated}
            disabledOther={disableAllWhenFinetuneInvalid}
            OtherName={trainButtonName}
        >
            {/* Training Mode Toggle at top */}
            <IonItem lines="none">
                <IonLabel position="stacked">Select training mode</IonLabel>
                <IonSegment
                    value={trainingMode}
                    onIonChange={(e) => setTrainingMode(e.detail.value as 'train' | 'finetune')}
                >
                    <IonSegmentButton value="train">
                        <IonLabel>Train from zero</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="finetune">
                        <IonLabel>Fine-tune</IonLabel>
                    </IonSegmentButton>
                </IonSegment>
            </IonItem>

            <IonItem>
                <IonNote color={trainingMode === 'finetune' && isFineTuneAvailable ? 'success' : 'warning'}>
                    {fineTuneMessage}
                </IonNote>
            </IonItem>

            <ModuleCardItem name="Pixel Segmentation Parameters">
                {/* Features */}
                <ModuleCardItem name="Feature Extraction Parameters">
                    <IonList>{featParams?.feats.map((f) => renderCheckboxFeature(f))}</IonList>
                </ModuleCardItem>

                {/* Multi-scale */}
                <ModuleCardItem name="Multi-scale Parameters">
                    <IonItem>
                        <IonLabel position="floating">
                            <small>Multi-scale Filter Windows</small>
                        </IonLabel>
                        <IonInput
                            value={featParams.multiscale.join(',')}
                            disabled={trainingMode === 'finetune'}
                            readonly={trainingMode === 'finetune'}
                            onIonChange={(e) => {
                                if (trainingMode === 'train' && e.detail.value) {
                                    const value = stringToNumberArray(e.detail.value);
                                    if (!isEqual(featParams.multiscale, value)) {
                                        setFeatParams({ ...featParams, multiscale: value });
                                    }
                                }
                            }}
                        ></IonInput>
                    </IonItem>
                </ModuleCardItem>

                {/* Classifier */}
                <ModuleCardItem name="Classifier Parameters">
                    <IonItem>
                        <IonLabel>Classifier Model</IonLabel>
                        <IonSelect
                            interface="popover"
                            value={classParams.classifier}
                            disabled={trainingMode === 'finetune'}
                            onIonChange={(e) => {
                                if (trainingMode === 'train' && e.detail.value) {
                                    setClassParams({
                                        classifier: e.detail.value,
                                        params: defaultModelClassifierParams[e.detail.value],
                                    });
                                }
                            }}
                        >
                            {classifiers.map((c) => (
                                <IonSelectOption key={c.id} value={c.id}>
                                    {c.name}
                                </IonSelectOption>
                            ))}
                        </IonSelect>
                    </IonItem>
                    <Fragment>
                        {classParams.params.map((p) =>
                            renderModelParameter(p, (value) => {
                                if (trainingMode === 'train') {
                                    const newParams = classParams.params.map((np) =>
                                        np.id === p.id ? { ...np, value } : np
                                    );
                                    if (!isEqual(newParams, classParams.params)) {
                                        setClassParams({ ...classParams, params: newParams });
                                    }
                                }
                            })
                        )}
                    </Fragment>
                </ModuleCardItem>
            </ModuleCardItem>

            {/*Error & Loading*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={headerErrorMsg}
                onErrorMsg={setErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={setShowErrorWindow}
            />
            <LoadingComponent openLoadingWindow={showLoadingCompPS} loadingText={loadingMsg} />
        </ModuleCard>
    );

    // === Helpers ===
    function renderCheckboxFeature(feature: Feature) {
        const isLocked = trainingMode === 'finetune';
        return (
            <IonItem key={feature.id}>
                <IonLabel>
                    <small>
                        {feature.name}
                        <IonButton id={'showPixelSegFeatInfo-button-' + feature.id} size="small" fill="clear">
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                    </small>
                    <IonPopover trigger={'showPixelSegFeatInfo-button-' + feature.id} reference="event">
                        <IonContent>
                            <IonCard>
                                <IonCardHeader>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{feature.type}</div>
                                </IonCardHeader>
                                <IonCardContent>{feature.description}</IonCardContent>
                            </IonCard>
                        </IonContent>
                    </IonPopover>
                </IonLabel>
                <IonCheckbox
                    value={feature.id}
                    checked={feature.active}
                    disabled={isLocked}
                    onIonChange={(e) => {
                        if (!isLocked) {
                            const newfeats = featParams?.feats.map((nf) =>
                                nf.id === feature.id ? { ...nf, active: e.detail.checked } : nf
                            );
                            setFeatParams({ ...featParams, feats: newfeats });
                        }
                    }}
                />
            </IonItem>
        );
    }

    function renderModelParameter(modelParam: ModelClassifierParams, onParamChange?: (value: any) => void) {
        const isLocked = trainingMode === 'finetune';
        return (
            <IonItem key={modelParam.id}>
                <IonLabel position="floating">{modelParam.label}</IonLabel>
                <IonInput
                    type={modelParam.input}
                    debounce={200}
                    value={modelParam.value}
                    disabled={isLocked}
                    readonly={isLocked}
                    onIonChange={(e) => {
                        if (!isLocked && onParamChange) {
                            let value: any = e.detail.value;
                            if (modelParam.id === 'hidden_layer_sizes') {
                                value = stringToNumberArray(value);
                            }
                            onParamChange(value);
                        }
                    }}
                ></IonInput>
            </IonItem>
        );
    }

    function stringToNumberArray(text: string): number[] {
        return text
            .split(',')
            .map((t) => parseInt(t))
            .filter((n) => !Number.isNaN(n));
    }
};

export default PixelSegmentationModuleCard;
