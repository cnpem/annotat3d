import {
    IonItem,
    IonLabel,
    IonList,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonNote,
    useIonToast,
} from '@ionic/react';

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
    Classifier,
    Feature,
    FeatureParams,
    ClassifierParams,
    ModelClassifierParams,
} from './SuperpixelSegInterface';
import ErrorInterface from '../../main_menu/file/utils/ErrorInterface';
import ErrorWindowComp from '../../main_menu/file/utils/ErrorWindowComp';

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

    const [showLoadingCompPS, setShowLoadingCompPS] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');

    const [showToast] = useIonToast();
    const timeToast = 2000;

    const [showErrorWindow, setShowErrorWindow] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [headerErrorMsg, setHeaderErrorMsg] = useState('');

    useEventBus('isEditLabelDisabled', (flagPayload: boolean) => {
        setIsEditLabelActivated(flagPayload);
    });

    // ==================================================
    // Helpers
    // ==================================================

    function getParamsForBackend() {
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

    /**
     * ✅ FIXED: accepts string | null | undefined
     */
    function stringToNumberArray(text: string | null | undefined): number[] {
        if (!text) return [];
        return text
            .split(',')
            .map((t) => Number(t.trim()))
            .filter((n) => !Number.isNaN(n));
    }

    // ==================================================
    // Train
    // ==================================================
    function onTrain() {
        const params = getParamsForBackend();
        dispatch('useSuperpixelModule', false);

        setShowLoadingCompPS(true);
        setLoadingMsg('Training...');

        sfetch('POST', `/segmentation_module/train?module=pixel&finetune=false`, JSON.stringify(params), 'json')
            .then(() => {
                void showToast('Training finished ✅', timeToast);
                setPrevFeatParams(featParams);
                setPrevClassParams(classParams);
            })
            .catch((error: ErrorInterface) => {
                setShowErrorWindow(true);
                setHeaderErrorMsg(`Error during training`);
                setErrorMsg(error.error_msg);
            })
            .finally(() => {
                setShowLoadingCompPS(false);
            });
    }

    // ==================================================
    // Preview (single slice)
    // ==================================================
    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as { slice: number; axis: string };

        setShowLoadingCompPS(true);
        setLoadingMsg('Generating preview...');

        sfetch('POST', '/pixel_segmentation_module/preview', JSON.stringify(curSlice))
            .then(() => {
                dispatch('labelChanged', '');
                void showToast('Preview complete ✅', timeToast);
            })
            .catch((error: ErrorInterface) => {
                setShowErrorWindow(true);
                setHeaderErrorMsg(`error on preview in pixel segmentation menu`);
                setErrorMsg(error.error_msg);
            })
            .finally(() => {
                setShowLoadingCompPS(false);
            });
    }

    // ==================================================
    // Apply (full volume segmentation)
    // ==================================================
    function onApply() {
        setShowLoadingCompPS(true);
        setLoadingMsg('Applying segmentation...');

        sfetch('POST', '/pixel_segmentation_module/execute', '')
            .then(() => {
                dispatch('labelChanged', '');
                void showToast('Segmentation done ✅', timeToast);
            })
            .catch((error: ErrorInterface) => {
                setShowErrorWindow(true);
                setHeaderErrorMsg(`error on apply in pixel segmentation menu`);
                setErrorMsg(error.error_msg);
            })
            .finally(() => setShowLoadingCompPS(false));
    }

    return (
        <ModuleCard
            name="Pixel Segmentation"
            onOther={onTrain}
            onPreview={onPreview}
            onApply={onApply}
            OtherName="Train"
            PreviewName="Preview (slice)"
            ApplyName="Run full volume"
        >
            <ModuleCardItem name="Pixel Segmentation Parameters">
                {/* Features */}
                <ModuleCardItem name="Feature Extraction">
                    <IonList>
                        {featParams?.feats.map((f) => (
                            <IonItem key={f.id}>
                                <IonLabel>{f.name}</IonLabel>
                                <IonCheckbox
                                    value={f.id}
                                    checked={f.active}
                                    onIonChange={(e) => {
                                        const newfeats = featParams?.feats.map((nf) =>
                                            nf.id === f.id ? { ...nf, active: e.detail.checked } : nf
                                        );
                                        setFeatParams({ ...featParams, feats: newfeats });
                                    }}
                                />
                            </IonItem>
                        ))}
                    </IonList>
                </ModuleCardItem>

                {/* Multi-scale */}
                <ModuleCardItem name="Multi-scale parameters">
                    <IonItem>
                        <IonLabel position="floating">Multi-scale Filter Windows</IonLabel>
                        <IonInput
                            value={featParams.multiscale.join(',')}
                            onIonChange={(e) => {
                                const newValues = stringToNumberArray(e.detail.value);
                                if (!isEqual(featParams.multiscale, newValues)) {
                                    setFeatParams({ ...featParams, multiscale: newValues });
                                }
                            }}
                        />
                    </IonItem>
                </ModuleCardItem>

                {/* Classifier */}
                <ModuleCardItem name="Classifier Parameters">
                    <IonItem>
                        <IonLabel>Classifier Model</IonLabel>
                        <IonSelect
                            interface="popover"
                            value={classParams.classifier}
                            onIonChange={(e) =>
                                setClassParams({
                                    classifier: e.detail.value,
                                    params: defaultModelClassifierParams[e.detail.value],
                                })
                            }
                        >
                            <IonSelectOption value="rf">Random Forest</IonSelectOption>
                            <IonSelectOption value="svm">SVM</IonSelectOption>
                            <IonSelectOption value="mlp">MLP</IonSelectOption>
                        </IonSelect>
                    </IonItem>

                    <Fragment>
                        {classParams.params.map((p) => (
                            <IonItem key={p.id}>
                                <IonLabel position="floating">{p.label}</IonLabel>
                                <IonInput
                                    type={p.input}
                                    debounce={200}
                                    value={p.value}
                                    onIonChange={(e) => {
                                        let value: any = e.detail.value;
                                        if (p.id === 'hidden_layer_sizes') value = stringToNumberArray(value);
                                        setClassParams({
                                            classifier: classParams.classifier,
                                            params: classParams.params.map((np) =>
                                                np.id === p.id ? { ...np, value } : np
                                            ),
                                        });
                                    }}
                                />
                            </IonItem>
                        ))}
                    </Fragment>
                </ModuleCardItem>
            </ModuleCardItem>

            {/* Error & Loading */}
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
};

export default PixelSegmentationModuleCard;
