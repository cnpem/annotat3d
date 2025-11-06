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

    const [isEditLabelActivated, setIsEditLabelActivated] = useStorageState<boolean>(
        sessionStorage,
        'isEditLabelActivatedSuperpixel',
        false
    );

    const [showLoadingCompSpS, setShowLoadingCompSpS] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');

    const [showToast] = useIonToast();
    const [showErrorWindow, setShowErrorWindow] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [headerErrorMsg, setHeaderErrorMsg] = useState('');

    const timeToast = 2000;

    /** safe converter for TS */
    function toNumber(v: string | number | null | undefined): number {
        const n = Number(v);
        return isNaN(n) ? 0 : n;
    }

    // Track pre-process status
    useEffect(() => {
        const featChanged = !isEqual(prevFeatParams, featParams);
        const classChanged = !isEqual(prevClassParams, classParams);
        if (!featChanged && !classChanged) return;
        setPrevFeatParams(featParams);
        setPrevClassParams(classParams);
    }, [featParams, prevFeatParams, classParams, prevClassParams]);

    // Backend params for segmentation
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

    // TRAIN
    function onTrain() {
        const params = getModuleBackendParams();
        setShowLoadingCompSpS(true);
        setLoadingMsg('Training model...');

        sfetch('POST', '/segmentation_module/train?module=superpixel&finetune=false', JSON.stringify(params), 'json')
            .then(() => {
                void showToast('Training done ✅', timeToast);
                setShowLoadingCompSpS(false);
            })
            .catch((error: ErrorInterface) => {
                console.error('error in superpixel train', error.error_msg);
                setShowErrorWindow(true);
                setHeaderErrorMsg('Error on training');
                setErrorMsg(error.error_msg);
                setShowLoadingCompSpS(false);
            });
    }

    // PREVIEW
    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as { slice: number; axis: string };

        setShowLoadingCompSpS(true);
        setLoadingMsg('Generating slice preview...');

        sfetch('POST', '/superpixel_segmentation_module/preview', JSON.stringify(curSlice))
            .then(() => {
                dispatch('labelChanged', '');
                void showToast('Slice preview done ✅', timeToast);
                setShowLoadingCompSpS(false);
            })
            .catch((error: ErrorInterface) => {
                setShowErrorWindow(true);
                setHeaderErrorMsg('Error on preview');
                setErrorMsg(error.error_msg);
                setShowLoadingCompSpS(false);
            });
    }

    // APPLY (Volume segmentation)
    function onApply() {
        setShowLoadingCompSpS(true);
        setLoadingMsg('Running full volume segmentation...');

        sfetch('POST', '/superpixel_segmentation_module/execute', '')
            .then(() => {
                dispatch('labelChanged', '');
                void showToast('Volume segmentation done ✅', timeToast);
                setShowLoadingCompSpS(false);
            })
            .catch((error: ErrorInterface) => {
                setShowErrorWindow(true);
                setHeaderErrorMsg('Error applying model');
                setErrorMsg(error.error_msg);
                setShowLoadingCompSpS(false);
            });
    }

    return (
        <ModuleCard
            name="Superpixel Segmentation"
            onApply={onApply}
            onPreview={onPreview}
            onOther={onTrain}
            OtherName="Train"
            disabledPreview={isEditLabelActivated}
        >
            <ModuleCardItem name="Superpixel Segmentation Parameters">
                {/* FEATURES */}
                <ModuleCardItem name="Feature Extraction Parameters">
                    <IonList>{featParams.feats.map(renderCheckboxFeature)}</IonList>
                </ModuleCardItem>

                {/* POOLING */}
                <ModuleCardItem name="Supervoxel Feature Pooling">
                    <IonList>{featParams.pooling.map(renderCheckboxPooling)}</IonList>
                </ModuleCardItem>

                {/* MULTISCALE */}
                <ModuleCardItem name="Multiscale Filtering">
                    <IonItem>
                        <IonLabel position="floating">Multi-scale sigma list</IonLabel>
                        <IonInput
                            value={featParams.multiscale.join(',')}
                            onIonChange={(e) => {
                                const v = (e.detail.value as string) || '';
                                setFeatParams({ ...featParams, multiscale: v.split(',').map((n) => +n) });
                            }}
                        />
                    </IonItem>
                </ModuleCardItem>

                {/* CLASSIFIER */}
                <ModuleCardItem name="Classifier">
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
                                const newParams = classParams.params.map((np) =>
                                    np.id === p.id ? { ...np, value } : np
                                );
                                setClassParams({ ...classParams, params: newParams });
                            })
                        )}
                    </Fragment>
                </ModuleCardItem>

                <LoadingComponent openLoadingWindow={showLoadingCompSpS} loadingText={loadingMsg} />
            </ModuleCardItem>

            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={headerErrorMsg}
                onErrorMsg={setErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={setShowErrorWindow}
            />
        </ModuleCard>
    );

    /** UI helpers */
    function renderCheckboxFeature(feature: Feature) {
        return (
            <IonItem key={feature.id}>
                <IonLabel>
                    <small>
                        {feature.name}
                        <IonButton id={`featinfo-${feature.id}`} size="small" fill="clear">
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                    </small>

                    <IonPopover trigger={`featinfo-${feature.id}`} reference="event">
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
                    onIonChange={(e) => {
                        const newFeats = featParams.feats.map((f) =>
                            f.id === feature.id ? { ...f, active: e.detail.checked } : f
                        );
                        setFeatParams({ ...featParams, feats: newFeats });
                    }}
                />
            </IonItem>
        );
    }

    function renderCheckboxPooling(pool: Pooling) {
        return (
            <IonItem key={pool.id}>
                <IonLabel>{pool.name}</IonLabel>
                <IonCheckbox
                    checked={pool.active}
                    onIonChange={(e) => {
                        const newPooling = featParams.pooling.map((p) =>
                            p.id === pool.id ? { ...p, active: e.detail.checked } : p
                        );
                        setFeatParams({ ...featParams, pooling: newPooling });
                    }}
                />
            </IonItem>
        );
    }

    function renderModelParameter(param: ModelClassifierParams, onChange?: (v: any) => void) {
        return (
            <IonItem key={param.id}>
                <IonLabel position="floating">{param.label}</IonLabel>
                <IonInput
                    type={param.input}
                    debounce={200}
                    value={param.value}
                    onIonChange={(e) => {
                        const v = e.detail.value;
                        if (onChange) onChange(v);
                    }}
                />
            </IonItem>
        );
    }
};

export default SuperpixelSegmentationModuleCard;
