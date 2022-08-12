import {
    IonItem,
    IonLabel,
    IonList,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    useIonAlert,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonContent,
    IonPopover,
    useIonToast
} from '@ionic/react';
import {informationCircleOutline} from 'ionicons/icons';
import {isEqual} from 'lodash';
import {Fragment, useEffect, useState} from 'react';
import {useStorageState} from 'react-storage-hooks';
import {currentEventValue, useEventBus} from '../../../utils/eventbus';
import {dispatch} from '../../../utils/eventbus';
import {sfetch} from '../../../utils/simplerequest';
import LoadingComponent from '../utils/LoadingComponent';
import {ModuleCard, ModuleCardItem} from './ModuleCard';
import {
    BackEndLoadClassifier,
    Classifier,
    ClassifierParams, classifiers, Feature,
    FeatureParams,
    InitDefaultModelClassifierParams,
    initialParamsValues, ModelClassifierParams
} from "./SuperpixelSegInterface";

const PixelSegmentationModuleCard: React.FC = () => {

    const [present] = useIonAlert();

    const [defaultModelClassifierParams, setDefaultModelClassifierParams] = useStorageState(sessionStorage, "defaultModelClassifierParams", InitDefaultModelClassifierParams)
    const [prevFeatParams, setPrevFeatParams] = useStorageState<FeatureParams>(sessionStorage, 'superpixelPrevFeatParams');
    const [featParams, setFeatParams] = useStorageState<FeatureParams>(sessionStorage, 'superpixelFeatParams', initialParamsValues);

    const [prevClassParams, setPrevClassParams] = useStorageState<ClassifierParams>(sessionStorage, "superpixelPrevClassParams");
    const [classParams, setClassParams] = useStorageState<ClassifierParams>(sessionStorage, 'pixelClassParams', {
        classifier: 'rf',
        params: defaultModelClassifierParams['rf']
    });

    const [hasPreprocessed, setHasPreprocessed] = useStorageState<boolean>(sessionStorage, 'pixelSegmPreprocessed', false);
    const [loadingMsg, setLoadingMsg] = useState<string>("");
    const [showLoadingCompPS, setShowLoadingCompPS] = useState<boolean>(false);
    const [disabled, setDisabled] = useState<boolean>(false);

    const [showToast] = useIonToast();
    const timeToast = 2000;
    const toastMessages = {
        onPreprocess: "Preprocess done!",
        onPreview: "Preview done!",
        onApply: "Apply done!"
    }

    const loadingMessages = {
        onPreprocess: "Preprocessing",
        onPreview: "Preparing preview",
        onApply: "Applying"
    }

    // useEffect to force the user to use preprocess if he changes the featParams
    useEffect(() => {
        console.log(prevFeatParams, featParams);
        console.log(isEqual(prevFeatParams, featParams));
        const hasChanged = !isEqual(prevFeatParams, featParams);
        setHasPreprocessed(!hasChanged);
    }, [featParams, prevFeatParams, setHasPreprocessed]);

    // useEffect to force the user to use preprocess if he changes the classParams
    useEffect(() => {
        const hasChanged = !isEqual(prevClassParams, classParams);
        setHasPreprocessed(!hasChanged);
    }, [classParams, prevClassParams, setHasPreprocessed]);

    useEventBus('ImageLoaded', () => {
        setPrevClassParams(null);
        setPrevFeatParams(null);
    });

    /**
     * This EventBus forces FeatParams to update. For some reason, this component is having trouble
     * to update featParams and prevFeatParams.
     * The value 17 is the maximum checkbox and input the user can place on this menu
     * TODO : If we have time, we can implement a less criminal way to update this state
     */
    useEventBus("updateFeatParamsPixel", (payloadParams: { newParams: FeatureParams, index: number }) => {
        if (payloadParams.index < 17) {
            setFeatParams(payloadParams.newParams);
            setPrevFeatParams(null);
            dispatch("updateFeatParams", {
                ...payloadParams,
                index: payloadParams.index + 1
            });
        }
    });

    useEventBus("setNewClassParams", (newClassifier: BackEndLoadClassifier) => {
        let newDefaultModelClassifierParams: Record<string, ModelClassifierParams[]>;
        if (newClassifier.classifier_parameters.classifier === "rf") {
            newDefaultModelClassifierParams = {
                'rf': newClassifier.classifier_parameters.params,
                'svm': [
                    {id: 'svm_C', label: 'SVM C', value: 1.0, input: 'number'}
                ],
                'mlp': [
                    {id: 'mlp_hidden_layer_sizes', label: 'N. hidden Neurons', value: [100, 10], input: 'text'}
                ],
                'adaboost': [
                    {id: 'adaboost_n_estimators', label: 'N. classifiers', value: 100, input: 'number'}
                ],
                'knn': [
                    {id: 'knn_n_neighbors', label: 'N. neighbors', value: 3, input: 'number'}
                ]
            }
        } else if (newClassifier.classifier_parameters.classifier === "svm") {
            newDefaultModelClassifierParams = {
                'rf': [
                    {id: 'rf_n_estimators', label: 'Random Forest N. Trees', value: 100, input: 'number'}
                ],
                'svm': newClassifier.classifier_parameters.params,
                'mlp': [
                    {id: 'mlp_hidden_layer_sizes', label: 'N. hidden Neurons', value: [100, 10], input: 'text'}
                ],
                'adaboost': [
                    {id: 'adaboost_n_estimators', label: 'N. classifiers', value: 100, input: 'number'}
                ],
                'knn': [
                    {id: 'knn_n_neighbors', label: 'N. neighbors', value: 3, input: 'number'}
                ]
            }
        } else if (newClassifier.classifier_parameters.classifier === "mlp") {
            newDefaultModelClassifierParams = {
                'rf': [
                    {id: 'rf_n_estimators', label: 'Random Forest N. Trees', value: 100, input: 'number'}
                ],
                'svm': [
                    {id: 'svm_C', label: 'SVM C', value: 1.0, input: 'number'}
                ],
                'mlp': newClassifier.classifier_parameters.params,
                'adaboost': [
                    {id: 'adaboost_n_estimators', label: 'N. classifiers', value: 100, input: 'number'}
                ],
                'knn': [
                    {id: 'knn_n_neighbors', label: 'N. neighbors', value: 3, input: 'number'}
                ]
            }
        } else if (newClassifier.classifier_parameters.classifier === "adaboost") {
            newDefaultModelClassifierParams = {
                'rf': [
                    {id: 'rf_n_estimators', label: 'Random Forest N. Trees', value: 100, input: 'number'}
                ],
                'svm': [
                    {id: 'svm_C', label: 'SVM C', value: 1.0, input: 'number'}
                ],
                'mlp': [
                    {id: 'mlp_hidden_layer_sizes', label: 'N. hidden Neurons', value: [100, 10], input: 'text'}
                ],
                'adaboost': newClassifier.classifier_parameters.params,
                'knn': [
                    {id: 'knn_n_neighbors', label: 'N. neighbors', value: 3, input: 'number'}
                ]
            }
        } else {
            newDefaultModelClassifierParams = {
                'rf': [
                    {id: 'rf_n_estimators', label: 'Random Forest N. Trees', value: 100, input: 'number'}
                ],
                'svm': [
                    {id: 'svm_C', label: 'SVM C', value: 1.0, input: 'number'}
                ],
                'mlp': [
                    {id: 'mlp_hidden_layer_sizes', label: 'N. hidden Neurons', value: [100, 10], input: 'text'}
                ],
                'adaboost': [
                    {id: 'adaboost_n_estimators', label: 'N. classifiers', value: 100, input: 'number'}
                ],
                'knn': newClassifier.classifier_parameters.params
            }
        }
        setDefaultModelClassifierParams(newDefaultModelClassifierParams);
        setClassParams(newClassifier.classifier_parameters);
        setPrevClassParams(newClassifier.classifier_parameters);

        console.table(newClassifier.feature_extraction_params);

        dispatch("updateFeatParams", {
            newParams: newClassifier.feature_extraction_params,
            index: 0
        });
    });


    function getModuleBackendParams() {
        const params = {
            classifier_params: {
                classifier_type: classParams.classifier,
                grid_search: false
            },
            feature_extraction_params: {
                'sigmas': featParams.multiscale,
                'selected_features': featParams.feats!
                    .filter(p => p.active)
                    .map(p => p.id),
                'feat_selection_enabled': featParams.thresholdSelection !== null,
                'feat_selection_method_threshold': featParams.thresholdSelection
            }
        };

        console.log(params);
        return params;
    }

    function onApply() {
        setDisabled(true);
        setShowLoadingCompPS(true);
        setLoadingMsg(loadingMessages.onApply);
        sfetch('POST', 'pixel_segmentation_module/execute', '')
            .then(() => {
                dispatch('labelChanged', '');
            })
            .catch(error => {
                present({
                    header: error.error,
                    message: error.error_msg
                });
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingCompPS(false);
                showToast(toastMessages.onApply, timeToast);
            });
    }

    function onPreview() {

        const curSlice = currentEventValue('sliceChanged') as {
            slice: number,
            axis: string
        };

        console.log(curSlice);

        setDisabled(true);
        setShowLoadingCompPS(true);
        setLoadingMsg(loadingMessages.onPreview);
        sfetch('POST', '/pixel_segmentation_module/preview', JSON.stringify(curSlice))
            .then(() => {
                dispatch('labelChanged', '');
            })
            .catch((error) => {
                present({
                    header: error.error,
                    message: error.error_msg
                });
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingCompPS(false);
                showToast(toastMessages.onPreview, timeToast);
            });
    }

    function onPreprocess() {

        const params = getModuleBackendParams();

        setDisabled(true);
        setShowLoadingCompPS(true);
        setLoadingMsg(loadingMessages.onPreprocess);
        sfetch('POST', '/pixel_segmentation_module/create', JSON.stringify(params))
            .then(() => {
                setPrevFeatParams(featParams);
                setPrevClassParams(classParams);
                showToast(toastMessages.onPreprocess, timeToast);
            })
            .catch(() => {
                console.log('Fail on preprocess');
                setHasPreprocessed(false);
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingCompPS(false);
            });
    }

    function renderSelectOptionClassifier(classifier: Classifier) {
        return (
            <IonSelectOption key={classifier.id} value={classifier.id}>
                {classifier.name}
            </IonSelectOption>
        );
    }

    function renderCheckboxFeature(feature: Feature) {
        return (
            <IonItem key={feature.id}>
                <IonLabel>
                    <small>
                        {feature.name}
                        <IonButton id={"showPixelSegFeatInfo-button-" + feature.id} size="small" fill='clear'>
                            <IonIcon icon={informationCircleOutline}/>
                        </IonButton>
                    </small>
                    <IonPopover trigger={"showPixelSegFeatInfo-button-" + feature.id} reference="event">
                        <IonContent>
                            <IonCard>
                                <IonCardHeader>
                                    <div style={{fontWeight: 600, fontSize: 14}}>{feature.type}</div>
                                </IonCardHeader>
                                <IonCardContent>{feature.description}</IonCardContent>
                            </IonCard>
                        </IonContent>
                    </IonPopover>
                </IonLabel>
                <IonCheckbox value={feature.id} checked={feature.active}
                             onIonChange={(e) => {
                                 console.log(e);
                                 const newfeats = featParams?.feats.map(nf => {
                                     if (nf.id === feature.id) {
                                         return {
                                             ...nf,
                                             active: e.detail.checked
                                         }
                                     } else {
                                         return nf;
                                     }
                                 });
                                 setFeatParams({...featParams, feats: newfeats});
                             }}
                />
            </IonItem>
        );
    }

    function stringToNumberArray(text: string): number[] {
        return text.split(',')
            .map(t => parseInt(t))
            .filter(n => !Number.isNaN(n))
    }

    function renderModelParameter(modelParam: ModelClassifierParams, onParamChange?: (value: any) => void) {

        return (
            <IonItem key={modelParam.id}>
                <IonLabel position="floating"> {modelParam.label} </IonLabel>
                <IonInput type={modelParam.input}
                          debounce={200}
                          value={modelParam.value}
                          onIonChange={e => {
                              let value: any = e.detail.value;
                              if (modelParam.id === 'hidden_layer_sizes') {
                                  value = stringToNumberArray(value);
                              }
                              if (onParamChange) {
                                  onParamChange(value);
                              }
                          }}>
                </IonInput>
            </IonItem>
        );
    }

    return (
        <ModuleCard name="Pixel Segmentation" disabled={disabled}
                    onApply={onApply} onPreview={onPreview} onOther={onPreprocess}
                    disabledApply={!hasPreprocessed} disabledPreview={!hasPreprocessed} disabledOther={hasPreprocessed}
                    OtherName="Preprocess">

            <ModuleCardItem name="Pixel Segmentation Parameters">
                <ModuleCardItem name="Feature Extraction Parameters">
                    <IonList>
                        {featParams?.feats.map(renderCheckboxFeature)}
                    </IonList>
                </ModuleCardItem>

                <ModuleCardItem name="Multi-scale Parameters">
                    <IonItem>
                        <IonLabel position="floating">
                            <small>Multi-scale Filter Windows</small>
                        </IonLabel>
                        <IonInput value={featParams.multiscale!.join(',')}
                                  onIonChange={(e) => {
                                      if (e.detail.value) {
                                          const value = stringToNumberArray(e.detail.value);
                                          if (!isEqual(featParams.multiscale, value)) {
                                              setFeatParams({...featParams, multiscale: value});
                                          }
                                      }
                                  }}>
                        </IonInput>
                    </IonItem>
                </ModuleCardItem>

                <ModuleCardItem name="Feature Selection Parameters">
                    <IonItem>
                        <IonLabel>Enable?</IonLabel>
                        <IonCheckbox checked={featParams.thresholdSelection !== undefined}
                                     onIonChange={(e) => {
                                         const value = e.detail.checked ? 0.01 : undefined;
                                         setFeatParams({...featParams, thresholdSelection: value});
                                     }}/>
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Importance Threshold</IonLabel>
                        <IonInput
                            placeholder="feat selection disabled"
                            min={0} max={0.1}
                            type="number" step="0.01"
                            value={featParams.thresholdSelection}
                            onIonChange={(e) => {
                                const value = e.detail.value ? +e.detail.value : undefined;

                                setFeatParams({
                                    ...featParams,
                                    thresholdSelection: value
                                })
                            }}>
                        </IonInput>
                    </IonItem>
                </ModuleCardItem>

                <ModuleCardItem name="Classifier Parameters">
                    <IonItem>
                        <IonLabel>Classifier Model</IonLabel>
                        <IonSelect interface="popover"
                                   value={classParams.classifier}
                                   onIonChange={(e) => {
                                       if (e.detail.value) {
                                           setClassParams({
                                               ...classParams,
                                               classifier: e.detail.value,
                                               params: defaultModelClassifierParams[e.detail.value]
                                           });
                                       }
                                   }}>
                            {classifiers.map(renderSelectOptionClassifier)}
                        </IonSelect>
                    </IonItem>
                    <Fragment>
                        {classParams.params!.map((p) => {
                            return renderModelParameter(p, (value) => {
                                const newParams = classParams.params!.map((np) => {
                                    if (np.id === p.id) {
                                        return {...np, value: value}
                                    } else {
                                        return np;
                                    }
                                })

                                if (!isEqual(newParams, classParams.params)) {
                                    setClassParams({
                                        ...classParams,
                                        params: newParams
                                    });
                                }
                            });
                        })
                        }
                    </Fragment>
                </ModuleCardItem>
            </ModuleCardItem>
            <LoadingComponent
                openLoadingWindow={showLoadingCompPS}
                loadingText={loadingMsg}/>
        </ModuleCard>
    );
};

export default PixelSegmentationModuleCard;

