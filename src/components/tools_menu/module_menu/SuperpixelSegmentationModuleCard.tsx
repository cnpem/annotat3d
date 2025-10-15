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
    IonSegment,
    IonSegmentButton,
} from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';
import React, { Fragment, useEffect, useState } from 'react';
import { useStorageState } from 'react-storage-hooks';
import isEqual from 'lodash.isequal';
import { currentEventValue, useEventBus, dispatch } from '../../../utils/eventbus';
import { sfetch } from '../../../utils/simplerequest';
import { ModuleCard, ModuleCardItem } from './ModuleCard';
import LoadingComponent from '../utils/LoadingComponent';
import ErrorWindowComp from '../../main_menu/file/utils/ErrorWindowComp';
import {
    InitDefaultModelClassifierParams,
    initialParamsValues,
    classifiers,
    Classifier,
    ClassifierParams,
    Feature,
    FeatureParams,
    Pooling,
    ModelClassifierParams,
} from './SuperpixelSegInterface';
import ErrorInterface from '../../main_menu/file/utils/ErrorInterface';

// ==============================
// Fine-tune status hook
// ==============================
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

            void sfetch('POST', '/models/current/superpixel', '', 'json')
                .then((response: any) => {
                    if (!response.loaded) {
                        setIsFineTuneAvailable(false);
                        setFineTuneMessage('Fine-tune requires a loaded MLP model.');
                    } else if (response.mode !== 'superpixel') {
                        setIsFineTuneAvailable(false);
                        setFineTuneMessage(
                            `The model loaded was trained as : ${
                                String(response.mode) || 'Unknown'
                            }. Therefore it doens't work as superpixel model`
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

// ==============================
// Component
// ==============================
const SuperpixelSegmentationModuleCard: React.FC = () => {
    const [defaultModelClassifierParams] = useStorageState(
        sessionStorage,
        'defaultModelClassifierParams',
        InitDefaultModelClassifierParams
    );
    const [featParams, setFeatParams] = useStorageState<FeatureParams>(
        sessionStorage,
        'superpixelFeatParams',
        initialParamsValues
    );
    const [classParams, setClassParams] = useStorageState<ClassifierParams>(sessionStorage, 'superpixelClassParams', {
        classifier: 'rf',
        params: defaultModelClassifierParams.rf,
    });

    const [prevFeatParams, setPrevFeatParams] = useStorageState<FeatureParams>(
        sessionStorage,
        'superpixelPrevFeatParams'
    );
    const [prevClassParams, setPrevClassParams] = useStorageState<ClassifierParams>(
        sessionStorage,
        'superpixelPrevClassParams'
    );
    const [trainingMode, setTrainingMode] = useStorageState<'train' | 'finetune'>(
        sessionStorage,
        'superpixelTrainingMode',
        'train'
    );

    const [isEditLabelActivated, setIsEditLabelActivated] = useStorageState<boolean>(
        sessionStorage,
        'isEditLabelActivatedSuperpixel',
        false
    );
    const [hasPreprocessed, setHasPreprocessed] = useStorageState<boolean>(
        sessionStorage,
        'superpixelSegmPreprocessed',
        false
    );

    const [loadingMsg, setLoadingMsg] = useState('');
    const [showLoadingCompSpS, setShowLoadingCompSpS] = useState(false);
    const [showToast] = useIonToast();
    const [showErrorWindow, setShowErrorWindow] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [headerErrorMsg, setHeaderErrorMsg] = useState('');

    const timeToast = 2000;
    const toastMessages = {
        onTrain: trainingMode === 'train' ? 'Training done!' : 'Fine-tuning done!',
        onSlicePreview: 'Slice Preview done!',
        onVolApply: 'Volume Apply done!',
    };
    const loadingMessages = {
        onTrain: trainingMode === 'train' ? 'Training' : 'Fine-tuning',
        onSlicePreview: 'Preparing slice preview',
        onVolApply: 'Applying volume preview',
    };

    // === Fine-tune status ===
    const { isFineTuneAvailable, fineTuneMessage } = useFineTuneStatus(trainingMode, classParams.classifier);

    // === Track param changes (only in train mode) ===
    useEffect(() => {
        if (trainingMode === 'train') {
            const featChanged = !isEqual(prevFeatParams, featParams);
            const classChanged = !isEqual(prevClassParams, classParams);
            setHasPreprocessed(!(featChanged || classChanged));
        }
    }, [featParams, prevFeatParams, classParams, prevClassParams, trainingMode]);

    // === EventBus hooks ===
    useEventBus('ImageLoaded', () => {
        setPrevFeatParams(null);
        setPrevClassParams(null);
    });
    useEventBus('isEditLabelDisabled', (flagPayload: boolean) => {
        setIsEditLabelActivated(flagPayload);
    });

    // ==============================
    // Backend payload builder
    // ==============================
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
                selected_supervoxel_feat_pooling: featParams.pooling.filter((p) => p.active).map((p) => p.id),
                feat_selection_enabled: featParams.thresholdSelection !== undefined,
                feat_selection_method_threshold: featParams.thresholdSelection,
            },
        };
    }

    // ==============================
    // Backend actions
    // ==============================
    function onTrain() {
        const params = getModuleBackendParams();
        console.log('Parameters Backend', params);
        setShowLoadingCompSpS(true);
        setLoadingMsg(loadingMessages.onTrain);

        const finetuneFlag = trainingMode === 'finetune' ? 'true' : 'false';
        const url = `/segmentation_module/train?module=superpixel&finetune=${finetuneFlag}`;

        sfetch('POST', url, JSON.stringify(params), 'json')
            .then(() => {
                setPrevFeatParams(featParams);
                setPrevClassParams(classParams);
                void showToast(toastMessages.onTrain, timeToast);
                setShowLoadingCompSpS(false);
            })
            .catch((error: ErrorInterface) => {
                console.error('error in superpixel train', error.error_msg);
                setShowErrorWindow(true);
                setHeaderErrorMsg(`Error on ${trainingMode}`);
                setErrorMsg(error.error_msg);
                setShowLoadingCompSpS(false);
            });
    }

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as { slice: number; axis: string };

        setShowLoadingCompSpS(true);
        setLoadingMsg(loadingMessages.onSlicePreview);

        sfetch('POST', '/superpixel_segmentation_module/preview', JSON.stringify(curSlice))
            .then((response: { selected_features_names: string[] }) => {
                dispatch('labelChanged', '');
                setShowLoadingCompSpS(false);
                void showToast(toastMessages.onSlicePreview, timeToast);
            })
            .catch((error: ErrorInterface) => {
                console.error('error in superpixel slice preview', error.error_msg);
                setShowErrorWindow(true);
                setHeaderErrorMsg(`Error on slice preview`);
                setErrorMsg(error.error_msg);
                setShowLoadingCompSpS(false);
            });
    }

    function onApply() {
        setShowLoadingCompSpS(true);
        setLoadingMsg(loadingMessages.onVolApply);

        sfetch('POST', '/superpixel_segmentation_module/execute', '')
            .then(() => {
                dispatch('labelChanged', '');
                setShowLoadingCompSpS(false);
                void showToast(toastMessages.onVolApply, timeToast);
                dispatch('useSuperpixelModule', true);
            })
            .catch((error: ErrorInterface) => {
                console.error('error in superpixel volume apply', error.error_msg);
                setShowErrorWindow(true);
                setHeaderErrorMsg(`Error on volume apply`);
                setErrorMsg(error.error_msg);
                setShowLoadingCompSpS(false);
            });
    }

    // ==============================
    // Button disable logic
    // ==============================
    const disableAll = trainingMode === 'finetune' && !isFineTuneAvailable;
    const trainButtonName = trainingMode === 'train' ? 'Train' : 'Fine-tune';

    // ==============================
    // Render
    // ==============================
    return (
        <ModuleCard
            name="Superpixel Segmentation"
            onApply={onApply}
            onPreview={onPreview}
            onOther={onTrain}
            disabledApply={disableAll}
            disabledPreview={disableAll || isEditLabelActivated}
            disabledOther={disableAll}
            OtherName={trainButtonName}
        >
            {/* Training Mode */}
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

            {/* Parameters */}
            <ModuleCardItem name="Superpixel Segmentation Parameters">
                {/* Features */}
                <ModuleCardItem name="Feature Extraction Parameters">
                    <IonList>{featParams.feats.map(renderCheckboxFeature)}</IonList>
                </ModuleCardItem>

                {/* Pooling */}
                <ModuleCardItem name="Superpixel Feature Pooling">
                    <IonList>{featParams.pooling.map(renderCheckboxPooling)}</IonList>
                </ModuleCardItem>

                {/* Multiscale */}
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
                            {classifiers.map((c: Classifier) => (
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

            {/* Error + Loading */}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={headerErrorMsg}
                onErrorMsg={setErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={setShowErrorWindow}
            />
            <LoadingComponent openLoadingWindow={showLoadingCompSpS} loadingText={loadingMsg} />
        </ModuleCard>
    );

    // ==============================
    // Helpers
    // ==============================
    function renderCheckboxFeature(feature: Feature) {
        const isLocked = trainingMode === 'finetune';
        return (
            <IonItem key={feature.id}>
                <IonLabel>
                    <small>
                        {feature.name}
                        <IonButton id={`showSuperpixelFeatInfo-${feature.id}`} size="small" fill="clear">
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                    </small>
                    <IonPopover trigger={`showSuperpixelFeatInfo-${feature.id}`} reference="event">
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
                    checked={feature.active}
                    disabled={isLocked}
                    onIonChange={(e) => {
                        if (!isLocked) {
                            const newFeats = featParams.feats.map((f) =>
                                f.id === feature.id ? { ...f, active: e.detail.checked } : f
                            );
                            setFeatParams({ ...featParams, feats: newFeats });
                        }
                    }}
                />
            </IonItem>
        );
    }

    function renderCheckboxPooling(pool: Pooling) {
        const isLocked = trainingMode === 'finetune';
        return (
            <IonItem key={pool.id}>
                <IonLabel>{pool.name}</IonLabel>
                <IonCheckbox
                    checked={pool.active}
                    disabled={isLocked}
                    onIonChange={(e) => {
                        if (!isLocked) {
                            const newPooling = featParams.pooling.map((p) =>
                                p.id === pool.id ? { ...p, active: e.detail.checked } : p
                            );
                            setFeatParams({ ...featParams, pooling: newPooling });
                        }
                    }}
                />
            </IonItem>
        );
    }

    function renderModelParameter(param: ModelClassifierParams, onParamChange?: (v: any) => void) {
        const isLocked = trainingMode === 'finetune';
        return (
            <IonItem key={param.id}>
                <IonLabel position="floating">{param.label}</IonLabel>
                <IonInput
                    type={param.input}
                    debounce={200}
                    value={param.value}
                    disabled={isLocked}
                    readonly={isLocked}
                    onIonChange={(e) => {
                        if (!isLocked && onParamChange) {
                            let value: any = e.detail.value;
                            if (param.id === 'hidden_layer_sizes') {
                                value = stringToNumberArray(value);
                            }
                            onParamChange(value);
                        }
                    }}
                />
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

export default SuperpixelSegmentationModuleCard;
