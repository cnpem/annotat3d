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
    IonToggle,
    IonNote,
    IonToggle,
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
    BackEndLoadClassifier,
    Classifier,
    ClassifierParams,
    classifiers,
    Feature,
    FeatureParams,
    InitDefaultModelClassifierParams,
    initialParamsValues,
    ModelClassifierParams,
    Pooling,
} from './SuperpixelSegInterface';
import ErrorInterface from '../../main_menu/file/utils/ErrorInterface';
import ErrorWindowComp from '../../main_menu/file/utils/ErrorWindowComp';

interface ModelStatus {
    loaded: boolean;
    mode?: string;
}

interface ModelStatus {
    loaded: boolean;
    mode?: string;
}

const SuperpixelSegmentationModuleCard: React.FC = () => {
    const [defaultModelClassifierParams, setDefaultModelClassifierParams] = useStorageState(
        sessionStorage,
        'defaultModelClassifierParams',
        InitDefaultModelClassifierParams
    );
    const [prevFeatParams, setPrevFeatParams] = useStorageState<FeatureParams>(
        sessionStorage,
        'superpixelPrevFeatParams'
    );
    const [featParams, setFeatParams] = useStorageState<FeatureParams>(
        sessionStorage,
        'superpixelFeatParams',
        initialParamsValues
    );

    const [prevClassParams, setPrevClassParams] = useStorageState<ClassifierParams>(
        sessionStorage,
        'superpixelPrevClassParams'
    );
    const [classParams, setClassParams] = useStorageState<ClassifierParams>(sessionStorage, 'superpixelClassParams', {
        classifier: 'rf',
        params: defaultModelClassifierParams.rf,
    });

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
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingCompSpS, setShowLoadingCompSpS] = useState<boolean>(false);
    const [disabled, setDisabled] = useState<boolean>(true);

    // Training mode state
    const [trainingMode, setTrainingMode] = useStorageState<'train' | 'finetune'>(
        sessionStorage,
        'superpixelTrainingMode',
        'train'
    );
    const [modelStatus, setModelStatus] = useState<ModelStatus>({ loaded: false });
    const [isFineTuneAvailable, setIsFineTuneAvailable] = useState<boolean>(false);
    const [fineTuneMessage, setFineTuneMessage] = useState<string>('');

    // Training mode state
    const [trainingMode, setTrainingMode] = useStorageState<'train' | 'finetune'>(
        sessionStorage,
        'superpixelTrainingMode',
        'train'
    );
    const [modelStatus, setModelStatus] = useState<ModelStatus>({ loaded: false });
    const [isFineTuneAvailable, setIsFineTuneAvailable] = useState<boolean>(false);
    const [fineTuneMessage, setFineTuneMessage] = useState<string>('');

    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [headerErrorMsg, setHeaderErrorMsg] = useState<string>('');

    const [showToast] = useIonToast();
    const timeToast = 2000;
    const toastMessages = {
        onTrain: trainingMode === 'train' ? 'Training done!' : 'Fine-tuning done!',
        onSlicePreview: 'Slice Preview done!',
        onVolPreview: 'Vol Preview done!',
        onTrain: trainingMode === 'train' ? 'Training done!' : 'Fine-tuning done!',
        onSlicePreview: 'Slice Preview done!',
        onVolApply: 'Volume Apply done!',
    };

    const loadingMessages = {
        onTrain: trainingMode === 'train' ? 'Training' : 'Fine-tuning',
        onSlicePreview: 'Preparing slice preview',
        onVolPreview: 'Applying volume preview',
        onTrain: trainingMode === 'train' ? 'Training' : 'Fine-tuning',
        onSlicePreview: 'Preparing slice preview',
        onVolApply: 'Applying volume preview',
    };

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    };

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    };

    // Check model status for fine-tune availability
    useEffect(() => {
        if (trainingMode === 'finetune') {
            void sfetch('GET', '/models/current?module=superpixel', '', 'json')
                .then((response: any) => {
                    if (!response.loaded) {
                        setIsFineTuneAvailable(false);
                        setFineTuneMessage('Fine-tune requires a loaded model.');
                    } else if (response.mode !== 'superpixel') {
                        setIsFineTuneAvailable(false);
                        setFineTuneMessage(
                            `Fine-tune only works with Superpixel models. Loaded: ${
                                String(response.mode) || 'Unknown'
                            }.`
                        );
                    } else {
                        setIsFineTuneAvailable(true);
                        setFineTuneMessage('Parameters locked, inherited from loaded model.');

                        // overwrite UI state with backend values
                        setClassParams(response.classifier_parameters);
                        setFeatParams(response.feature_extraction_params);
                        setPrevClassParams(response.classifier_parameters);
                        setPrevFeatParams(response.feature_extraction_params);
                    }
                })
                .catch(() => {
                    setIsFineTuneAvailable(false);
                    setFineTuneMessage('Unable to check model status.');
                });
        }
    }, [trainingMode]);

    // useEffect to force the user to use training if he changes the classParams
    useEffect(() => {
        if (trainingMode === 'train') {
            const hasChanged = !isEqual(prevClassParams, classParams);
            setHasPreprocessed(!hasChanged);
        }
    }, [classParams, prevClassParams, setHasPreprocessed, trainingMode]);

    useEventBus('superpixelChanged', () => {
        setDisabled(false);
        setHasPreprocessed(false);
        setPrevFeatParams(null);
        setPrevClassParams(null);
    });

    /**
     * This EventBus forces FeatParams to update. For some reason, this component is having trouble
     * to update featParams and prevFeatParams.
     * The value 17 is the maximum checkbox and input the user can place on this menu
     * TODO : If we have time, we can implement a less criminal way to update this state
     */
    useEventBus('updateFeatParams', (payloadParams: { newParams: FeatureParams; index: number }) => {
        if (payloadParams.index < 17) {
            setFeatParams(payloadParams.newParams);
            setPrevFeatParams(null);
            dispatch('updateFeatParams', {
                ...payloadParams,
                index: payloadParams.index + 1,
            });
        }
    });

    useEventBus('setNewClassParams', (newClassifier: BackEndLoadClassifier) => {
        let newDefaultModelClassifierParams: Record<string, ModelClassifierParams[]>;
        if (newClassifier.classifier_parameters.classifier === 'rf') {
            newDefaultModelClassifierParams = {
                rf: newClassifier.classifier_parameters.params,
                svm: [{ id: 'svm_C', label: 'SVM C', value: 1.0, input: 'number' }],
                mlp: [{ id: 'mlp_hidden_layer_sizes', label: 'N. hidden Neurons', value: [100, 10], input: 'text' }],
                adaboost: [{ id: 'adaboost_n_estimators', label: 'N. classifiers', value: 100, input: 'number' }],
                knn: [{ id: 'knn_n_neighbors', label: 'N. neighbors', value: 3, input: 'number' }],
            };
        } else if (newClassifier.classifier_parameters.classifier === 'svm') {
            newDefaultModelClassifierParams = {
                rf: [{ id: 'rf_n_estimators', label: 'Random Forest N. Trees', value: 100, input: 'number' }],
                svm: newClassifier.classifier_parameters.params,
                mlp: [{ id: 'mlp_hidden_layer_sizes', label: 'N. hidden Neurons', value: [100, 10], input: 'text' }],
                adaboost: [{ id: 'adaboost_n_estimators', label: 'N. classifiers', value: 100, input: 'number' }],
                knn: [{ id: 'knn_n_neighbors', label: 'N. neighbors', value: 3, input: 'number' }],
            };
        } else if (newClassifier.classifier_parameters.classifier === 'mlp') {
            newDefaultModelClassifierParams = {
                rf: [{ id: 'rf_n_estimators', label: 'Random Forest N. Trees', value: 100, input: 'number' }],
                svm: [{ id: 'svm_C', label: 'SVM C', value: 1.0, input: 'number' }],
                mlp: newClassifier.classifier_parameters.params,
                adaboost: [{ id: 'adaboost_n_estimators', label: 'N. classifiers', value: 100, input: 'number' }],
                knn: [{ id: 'knn_n_neighbors', label: 'N. neighbors', value: 3, input: 'number' }],
            };
        } else if (newClassifier.classifier_parameters.classifier === 'adaboost') {
            newDefaultModelClassifierParams = {
                rf: [{ id: 'rf_n_estimators', label: 'Random Forest N. Trees', value: 100, input: 'number' }],
                svm: [{ id: 'svm_C', label: 'SVM C', value: 1.0, input: 'number' }],
                mlp: [{ id: 'mlp_hidden_layer_sizes', label: 'N. hidden Neurons', value: [100, 10], input: 'text' }],
                adaboost: newClassifier.classifier_parameters.params,
                knn: [{ id: 'knn_n_neighbors', label: 'N. neighbors', value: 3, input: 'number' }],
            };
        } else {
            newDefaultModelClassifierParams = {
                rf: [{ id: 'rf_n_estimators', label: 'Random Forest N. Trees', value: 100, input: 'number' }],
                svm: [{ id: 'svm_C', label: 'SVM C', value: 1.0, input: 'number' }],
                mlp: [{ id: 'mlp_hidden_layer_sizes', label: 'N. hidden Neurons', value: [100, 10], input: 'text' }],
                adaboost: [{ id: 'adaboost_n_estimators', label: 'N. classifiers', value: 100, input: 'number' }],
                knn: newClassifier.classifier_parameters.params,
            };
        }
        setDefaultModelClassifierParams(newDefaultModelClassifierParams);
        setClassParams(newClassifier.classifier_parameters);
        setPrevClassParams(newClassifier.classifier_parameters);

        console.table(newClassifier.feature_extraction_params);

        dispatch('updateFeatParams', {
            newParams: newClassifier.feature_extraction_params,
            index: 0,
        });
    });

    useEventBus('ImageLoaded', () => {
        setPrevFeatParams(null);
        setPrevClassParams(null);
    });

    useEventBus('isEditLabelDisabled', (flagPayload: boolean) => {
        setIsEditLabelActivated(flagPayload);
    });

    function getModuleBackendParams() {
        const params = {
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
                selected_features: featParams?.feats.filter((p) => p.active).map((p) => p.id),
                selected_supervoxel_feat_pooling: featParams?.pooling.filter((p) => p.active).map((p) => p.id),
                feat_selection_enabled: featParams.thresholdSelection !== undefined,
                feat_selection_method_threshold: featParams.thresholdSelection,
            },
        };

        return params;
    }

    function onVolApply() {
        setDisabled(true);
        setShowLoadingCompSpS(true);
        setLoadingMsg(loadingMessages.onVolApply);

        const payload = {
            mode: 'superpixel' as const,
            training_mode: trainingMode,
        };

        sfetch('POST', '/api/superpixel/infer/volume', JSON.stringify(payload), 'json')
            .then(() => {
                dispatch('labelChanged', '');
                setShowLoadingCompSpS(false);
                setDisabled(false);
                void showToast(toastMessages.onVolApply, timeToast);
                dispatch('useSuperpixelModule', true);
            })
            .catch((error: ErrorInterface) => {
                setDisabled(false);
                console.log('error in superpixel_segmentation_module vol apply');
                console.log(error.error_msg);
                setShowErrorWindow(true);
                setHeaderErrorMsg(`error on vol apply in superpixel segmentation menu`);
                setErrorMsg(error.error_msg);
                setHasPreprocessed(false);
                setShowLoadingCompSpS(false);
            });
    }

    // Slice Preview (formerly Preview)
    function onSlicePreview() {
    // Slice Preview (formerly Preview)
    function onSlicePreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        setDisabled(true);
        setShowLoadingCompSpS(true);
        setLoadingMsg(loadingMessages.onSlicePreview);

        const payload = {
            slice_index: curSlice.slice,
            axis: curSlice.axis,
            mode: 'superpixel' as const,
            training_mode: trainingMode,
        };

        sfetch('POST', '/api/superpixel/infer/slice', JSON.stringify(payload), 'json')
        setLoadingMsg(loadingMessages.onSlicePreview);

        const payload = {
            slice_index: curSlice.slice,
            axis: curSlice.axis,
            mode: 'superpixel' as const,
            training_mode: trainingMode,
        };

        sfetch('POST', '/api/superpixel/infer/slice', JSON.stringify(payload), 'json')
            .then((response: { selected_features_names: string[] }) => {
                dispatch('selectedFeaturesNames', response.selected_features_names);
                dispatch('labelChanged', '');
                setDisabled(false);
                setShowLoadingCompSpS(false);
                setHasPreprocessed(true);
                void showToast(toastMessages.onSlicePreview, timeToast);
                void showToast(toastMessages.onSlicePreview, timeToast);
            })
            .catch((error: ErrorInterface) => {
                setDisabled(false);
                console.log('error in superpixel_segmentation_module slice preview');
                console.log('error in superpixel_segmentation_module slice preview');
                console.log(error.error_msg);
                setShowErrorWindow(true);
                setHeaderErrorMsg(`error on slice preview in superpixel segmentation menu`);
                setHeaderErrorMsg(`error on slice preview in superpixel segmentation menu`);
                setErrorMsg(error.error_msg);
                setHasPreprocessed(false);
                setShowLoadingCompSpS(false);
            });
    }

    // Train/Fine-tune (formerly Preprocess)
    function onTrain() {
    // Train/Fine-tune (formerly Preprocess)
    function onTrain() {
        const params = getModuleBackendParams();

        setDisabled(true);
        setShowLoadingCompSpS(true);
        setLoadingMsg(loadingMessages.onTrain);

        // Build query string for backend
        const moduleType = 'superpixel'; // or "pixel", depending on UI state
        const finetuneFlag = trainingMode === 'finetune' ? 'true' : 'false';
        const url = `/segmentation_module/train?module=${moduleType}&finetune=${finetuneFlag}`;

        sfetch('POST', url, JSON.stringify(params), 'json')
            .then(() => {
                setPrevFeatParams(featParams);
                setPrevClassParams(classParams);
                void showToast(toastMessages.onTrain, timeToast);
                void showToast(toastMessages.onTrain, timeToast);
                setHasPreprocessed(true);
                setDisabled(false);
                setShowLoadingCompSpS(false);
            })
            .catch((error: ErrorInterface) => {
                setDisabled(false);
                console.log(`error in ${moduleType}_segmentation_module ${trainingMode}`);
                console.log(error.error_msg);
                setShowErrorWindow(true);
                setHeaderErrorMsg(`error on ${trainingMode} in ${moduleType} segmentation menu`);
                setErrorMsg(error.error_msg);
                setHasPreprocessed(false);
                setShowLoadingCompSpS(false);
            });
    }

    function handleTrainingModeChange(isFineTune: boolean) {
        const newMode = isFineTune ? 'finetune' : 'train';
        setTrainingMode(newMode);

        if (newMode === 'train') {
            setHasPreprocessed(false);
        } else {
            // In fine-tune mode, consider as preprocessed if model is available
            setHasPreprocessed(isFineTuneAvailable);
        }
    }

    function handleTrainingModeChange(isFineTune: boolean) {
        const newMode = isFineTune ? 'finetune' : 'train';
        setTrainingMode(newMode);

        if (newMode === 'train') {
            setHasPreprocessed(false);
        } else {
            // In fine-tune mode, consider as preprocessed if model is available
            setHasPreprocessed(isFineTuneAvailable);
        }
    }

    function renderSelectOptionClassifier(classifier: Classifier) {
        return (
            <IonSelectOption key={classifier.id} value={classifier.id}>
                {classifier.name}
            </IonSelectOption>
        );
    }

    function renderCheckboxFeature(feature: Feature) {
        const isLocked = trainingMode === 'finetune';

        const isLocked = trainingMode === 'finetune';

        return (
            <IonItem key={feature.id}>
                <IonLabel>
                    <small>
                        {feature.name}
                        <IonButton id={'showSuperpixelSegFeatInfo-button-' + feature.id} size="small" fill="clear">
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                    </small>
                    <IonPopover trigger={'showSuperpixelSegFeatInfo-button-' + feature.id} reference="event">
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
                    disabled={isLocked}
                    onIonChange={(e) => {
                        if (!isLocked) {
                            console.log(e);
                            const newfeats = featParams?.feats.map((nf) => {
                                if (nf.id === feature.id) {
                                    return {
                                        ...nf,
                                        active: e.detail.checked,
                                    };
                                } else {
                                    return nf;
                                }
                            });
                            setFeatParams({ ...featParams, feats: newfeats });
                        }
                        if (!isLocked) {
                            console.log(e);
                            const newfeats = featParams?.feats.map((nf) => {
                                if (nf.id === feature.id) {
                                    return {
                                        ...nf,
                                        active: e.detail.checked,
                                    };
                                } else {
                                    return nf;
                                }
                            });
                            setFeatParams({ ...featParams, feats: newfeats });
                        }
                    }}
                />
            </IonItem>
        );
    }

    function renderCheckboxPooling(pooling: Pooling) {
        const isLocked = trainingMode === 'finetune';

        const isLocked = trainingMode === 'finetune';

        return (
            <IonItem key={pooling.id}>
                <IonLabel>{pooling.name}</IonLabel>
                <IonCheckbox
                    value={pooling.id}
                    checked={pooling.active}
                    disabled={isLocked}
                    disabled={isLocked}
                    onIonChange={(e) => {
                        if (!isLocked) {
                            console.log(e);
                            const newpooling = featParams?.pooling.map((np) => {
                                if (np.id === pooling.id) {
                                    return {
                                        ...np,
                                        active: e.detail.checked,
                                    };
                                } else {
                                    return np;
                                }
                            });
                            setFeatParams({ ...featParams, pooling: newpooling });
                        }
                        if (!isLocked) {
                            console.log(e);
                            const newpooling = featParams?.pooling.map((np) => {
                                if (np.id === pooling.id) {
                                    return {
                                        ...np,
                                        active: e.detail.checked,
                                    };
                                } else {
                                    return np;
                                }
                            });
                            setFeatParams({ ...featParams, pooling: newpooling });
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

    function renderModelParameter(modelParam: ModelClassifierParams, onParamChange?: (value: any) => void) {
        const isLocked = trainingMode === 'finetune';

        const isLocked = trainingMode === 'finetune';

        return (
            <IonItem key={modelParam.id}>
                <IonLabel position="floating"> {modelParam.label} </IonLabel>
                <IonInput
                    type={modelParam.input}
                    debounce={200}
                    value={modelParam.value}
                    disabled={isLocked}
                    readonly={isLocked}
                    disabled={isLocked}
                    readonly={isLocked}
                    onIonChange={(e) => {
                        if (!isLocked) {
                            let value: any = e.detail.value;
                            if (modelParam.id === 'hidden_layer_sizes') {
                                value = stringToNumberArray(value);
                            }
                            if (onParamChange) {
                                onParamChange(value);
                            }
                        if (!isLocked) {
                            let value: any = e.detail.value;
                            if (modelParam.id === 'hidden_layer_sizes') {
                                value = stringToNumberArray(value);
                            }
                            if (onParamChange) {
                                onParamChange(value);
                            }
                        }
                    }}
                ></IonInput>
            </IonItem>
        );
    }

    // Determine button states and names
    const trainButtonName = trainingMode === 'train' ? 'Train' : 'Fine-tune';
    const trainDisabled = trainingMode === 'train' ? hasPreprocessed : !isFineTuneAvailable;

    // Determine button states and names
    const trainButtonName = trainingMode === 'train' ? 'Train' : 'Fine-tune';
    const trainDisabled = trainingMode === 'train' ? hasPreprocessed : !isFineTuneAvailable;

    return (
        <ModuleCard
            name="Superpixel Segmentation"
            disabled={disabled}
            onApply={onVolApply}
            onPreview={onSlicePreview}
            onOther={onTrain}
            disabledApply={trainingMode === 'finetune' ? !isFineTuneAvailable : !hasPreprocessed}
            disabledPreview={
                (trainingMode === 'finetune' ? !isFineTuneAvailable : !hasPreprocessed) || isEditLabelActivated
            }
            disabledOther={trainDisabled}
            ApplyName="Vol Apply"
            PreviewName="Slice Preview"
            OtherName={trainButtonName}
        >
            {/* Training Mode Toggle */}
            <ModuleCardItem name="Training Mode">
                <IonItem lines="none">
                    <IonLabel position="stacked">Select training mode</IonLabel>
                    <IonSegment
                        value={trainingMode}
                        onIonChange={(e) => handleTrainingModeChange(e.detail.value === 'finetune')}
                    >
                        <IonSegmentButton value="train">
                            <IonLabel>Train from zero</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="finetune">
                            <IonLabel>Train loaded model</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                </IonItem>

                <IonItem>
                    <IonNote color={trainingMode === 'finetune' && isFineTuneAvailable ? 'success' : 'warning'}>
                        {fineTuneMessage}
                    </IonNote>
                </IonItem>
            </ModuleCardItem>

            <ModuleCardItem name="Superpixel Segmentation Parameters">
                <ModuleCardItem name="Feature Extraction Parameters">
                    <Fragment>
                        {trainingMode === 'finetune' && !isFineTuneAvailable && (
                            <IonItem>
                                <IonNote color="medium">Parameters are locked in fine-tune mode</IonNote>
                            </IonItem>
                        )}
                        <IonList>{featParams?.feats.map(renderCheckboxFeature)}</IonList>
                    </Fragment>
                    <Fragment>
                        {trainingMode === 'finetune' && !isFineTuneAvailable && (
                            <IonItem>
                                <IonNote color="medium">Parameters are locked in fine-tune mode</IonNote>
                            </IonItem>
                        )}
                        <IonList>{featParams?.feats.map(renderCheckboxFeature)}</IonList>
                    </Fragment>
                </ModuleCardItem>

                <ModuleCardItem name="Superpixel Feature Pooling">
                    {featParams?.pooling.map(renderCheckboxPooling)}
                </ModuleCardItem>

                <ModuleCardItem name="Multi-scale Parameters">
                    <IonItem>
                        <IonLabel position="floating">
                            <small>Multi-scale Filter Windows</small>
                        </IonLabel>
                        <IonInput
                            value={featParams?.multiscale.join(',')}
                            disabled={trainingMode === 'finetune'}
                            readonly={trainingMode === 'finetune'}
                            disabled={trainingMode === 'finetune'}
                            readonly={trainingMode === 'finetune'}
                            onIonChange={(e) => {
                                if (trainingMode === 'train' && e.detail.value) {
                                if (trainingMode === 'train' && e.detail.value) {
                                    const value = stringToNumberArray(e.detail.value);
                                    if (!isEqual(featParams.multiscale, value)) {
                                        setFeatParams({
                                            ...featParams,
                                            multiscale: value,
                                        });
                                    }
                                }
                            }}
                        ></IonInput>
                    </IonItem>
                </ModuleCardItem>


                <ModuleCardItem name="Feature Selection Parameters">
                    <IonItem>
                        <IonLabel>Enable?</IonLabel>
                        <IonCheckbox
                            checked={featParams.thresholdSelection !== undefined}
                            disabled={trainingMode === 'finetune'}
                            disabled={trainingMode === 'finetune'}
                            onIonChange={(e) => {
                                if (trainingMode === 'train') {
                                    const value = e.detail.checked ? 0.01 : undefined;
                                    setFeatParams({ ...featParams, thresholdSelection: value });
                                }
                                if (trainingMode === 'train') {
                                    const value = e.detail.checked ? 0.01 : undefined;
                                    setFeatParams({ ...featParams, thresholdSelection: value });
                                }
                            }}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Importance Threshold</IonLabel>
                        <IonInput
                            placeholder="feat selection disabled"
                            min={0}
                            max={0.1}
                            type="number"
                            step="0.01"
                            value={featParams.thresholdSelection}
                            disabled={trainingMode === 'finetune'}
                            readonly={trainingMode === 'finetune'}
                            disabled={trainingMode === 'finetune'}
                            readonly={trainingMode === 'finetune'}
                            onIonChange={(e) => {
                                if (trainingMode === 'train') {
                                    const value = e.detail.value ? +e.detail.value : undefined;
                                    setFeatParams({
                                        ...featParams,
                                        thresholdSelection: value,
                                    });
                                }
                                if (trainingMode === 'train') {
                                    const value = e.detail.value ? +e.detail.value : undefined;
                                    setFeatParams({
                                        ...featParams,
                                        thresholdSelection: value,
                                    });
                                }
                            }}
                        ></IonInput>
                    </IonItem>
                </ModuleCardItem>


                <ModuleCardItem name="Classifier Parameters">
                    <IonItem>
                        <IonLabel>Classifier Model</IonLabel>
                        <IonSelect
                            interface="popover"
                            value={classParams.classifier}
                            disabled={trainingMode === 'finetune'}
                            disabled={trainingMode === 'finetune'}
                            onIonChange={(e) => {
                                if (trainingMode === 'train' && e.detail.value) {
                                if (trainingMode === 'train' && e.detail.value) {
                                    setClassParams({
                                        classifier: e.detail.value,
                                        params: defaultModelClassifierParams[e.detail.value],
                                    });
                                }
                            }}
                        >
                            {classifiers.map(renderSelectOptionClassifier)}
                        </IonSelect>
                    </IonItem>
                    <Fragment>
                        {classParams.params.map((p) => {
                            return renderModelParameter(p, (value) => {
                                if (trainingMode === 'train') {
                                    const newParams = classParams.params.map((np) => {
                                        if (np.id === p.id) {
                                            return { ...np, value };
                                        } else {
                                            return np;
                                        }
                                    });
                                if (trainingMode === 'train') {
                                    const newParams = classParams.params.map((np) => {
                                        if (np.id === p.id) {
                                            return { ...np, value };
                                        } else {
                                            return np;
                                        }
                                    });

                                    if (!isEqual(newParams, classParams.params)) {
                                        setClassParams({
                                            ...classParams,
                                            params: newParams,
                                        });
                                    }
                                    if (!isEqual(newParams, classParams.params)) {
                                        setClassParams({
                                            ...classParams,
                                            params: newParams,
                                        });
                                    }
                                }
                            });
                        })}
                    </Fragment>
                </ModuleCardItem>
            </ModuleCardItem>


            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={headerErrorMsg}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}
            />
            <LoadingComponent openLoadingWindow={showLoadingCompSpS} loadingText={loadingMsg} />
        </ModuleCard>
    );
};

export default SuperpixelSegmentationModuleCard;
