import {TextFieldTypes} from '@ionic/core';
import { IonItem, IonLabel, IonList, IonInput, IonSelect, IonSelectOption, IonCheckbox, IonButton, IonPopover, IonContent, IonIcon, IonCard, IonCardHeader, IonCardContent, useIonToast } from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';
import {isEqual} from 'lodash';
import {Fragment, useEffect, useState} from 'react';
import {useStorageState} from 'react-storage-hooks';
import {currentEventValue} from '../../utils/eventbus';
import {useEventBus, dispatch} from '../../utils/eventbus';
import {sfetch} from '../../utils/simplerequest';
import {ModuleCard, ModuleCardItem } from './ModuleCard';
import LoadingComponent from "./LoadingComponent";

const classifiers = [
    { id: 'rf', name: 'Random Forest' },
    { id: 'svm', name: 'Linear SVM' },
    { id: 'mlp', name: 'Multi Layer Perceptron' },
    { id: 'knn', name: 'KNearest Neighbors' },
    { id: 'adaboost', name: 'AdaBoost' }
];

const defaultModelClassifierParams: Record<string, ModelClassifierParams[]> = {
    'rf': [
        { id: 'n_estimators', label: 'Random Forest N. Trees', value: 100, input: 'number' }
    ],
    'svm': [
        { id: 'C', label: 'SVM C', value: 1.0, input: 'number' }
    ],
    'mlp': [
        { id: 'hidden_layer_sizes', label: 'N. hidden Neurons', value: [100, 10], input: 'text' }
    ],
    'adaboost': [
        { id: 'n_estimators', label: 'N. classifiers', value: 100, input: 'number'}
    ],
    'knn': [
        { id: 'n_neighbors', label: 'N. neighbors', value: 3 , input: 'number'}
    ]
}

const defaultFeatures: Feature[] = [
    { id: 'fft_gauss', name: 'FFT Gauss', type: 'Smoothing', description: 'Filters structures (smoothing) of the specified gaussian filtering in fourier space. Promotes smoothing without worrying about edges.'},
    { id: 'average', name: 'Average', type: 'Smoothing', description: 'It is a method of "smoothing" images by reducing the amount of intensity variation inside a window (Noise removal)'},
    { id: 'median', name: 'Median', type: 'Smoothing', description: 'It makes the target pixel intensity equal to the median value in the running window (Noise removal)' },
    { id: 'sobel', name: 'Sobel', type: 'Edge detection', description: 'It creates an image emphasizing edges because it performs a 2-D spatial gradient measurement on an image and so emphasizes regions of high spatial frequency that correspond to edges.' },
    { id: 'fft_dog', name: 'FFT Difference Of Gaussians', type: 'Edge detection', description: 'Calculates two gaussian blur images from the original image and subtracts one from the other. It is used to detect edges in the image.' },
    { id: 'fft_gabor', name: 'FFT Gabor', type: 'Edge detection,Texture detection', description: 'It determines if there is any specific frequency content in the image in specific directions in a localized region around the point or region of analysis. In the spatial domain, it is a Gaussian kernel function modulated by a sinusoidal plane wave. It is one of the most suitable option for texture segmentation and boundary detection' },
    { id: 'variance', name: 'Variance', type: 'Texture detection', description: 'It is a statistical measure of the amount of variation inside the window. This determines how uniform or not that filtering window is (important for assessing homogeneity and texture)' },
    { id: 'lbp', name: 'Local Binary Pattern', type: 'Texture detection', description: 'It is a texture operator that tries to capture how are the neighborhoods allocated. It labels the pixels of an image by thresholding the neighborhood of each pixel and considers the result as a binary number.' },
    { id: 'membrane_projections', name: 'Membrane Projections', type: 'Membrane Detection', description: 'Enhances membrane-like structures of the image through directional filtering.' },
    { id: 'minimum', name: 'Minimum', type: 'Color Identification', description: 'It replaces the value of the pixel with the value of the darkest pixel inside the filtering window' },
    { id: 'maximum', name: 'Maximum', type: 'Color Identification', description: 'It replaces the value of the pixel with the value of the lightest pixel inside the filtering window' },
    { id: 'none', name: 'None (Original Image)', type: 'Identity', description: 'Used to guarantee the preservation of some characteristics of the original image.' }
];

interface ModelClassifierParams {
    id: string;
    label: string;
    value: any;
    input: TextFieldTypes;
}

const defaultMultiscale = [1, 2, 4, 8];

const defaultPooling: Pooling[] = [
    { id: 'min', name: 'Minimum', active: false },
    { id: 'max', name: 'Maximum', active: false },
    { id: 'mean', name: 'Mean', active: true }
]

interface Pooling {
    id: string;
    name: string;
    active: boolean;
}

interface Feature {
    id: string;
    name: string;
    type: string;
    description: string;
    active?: boolean;
}

interface Classifier {
    id: string;
    name: string;
}

interface ClassifierParams {
    classifier: string;
    params: ModelClassifierParams[];
}

interface FeatureParams {
    pooling: Pooling[];
    feats: Feature[];
    multiscale: number[];
    thresholdSelection?: number;
}

const SuperpixelSegmentationModuleCard: React.FC = () => {

    const [prevFeatParams, setPrevFeatParams] = useStorageState<FeatureParams>(sessionStorage, 'superpixelPrevFeatParams');
    const [featParams, setFeatParams] = useStorageState<FeatureParams>(sessionStorage, 'superpixelFeatParams', {
        pooling: defaultPooling,
        feats: defaultFeatures,
        multiscale: defaultMultiscale,
        thresholdSelection: 0.1
    });

    const [classParams, setClassParams] = useStorageState<ClassifierParams>(sessionStorage, 'superpixelClassParams', {
        classifier: 'rf',
        params: defaultModelClassifierParams['rf']
    });

    const [hasPreprocessed, setHasPreprocessed] = useStorageState<boolean>(sessionStorage, 'superpixelSegmPreprocessed', false);
    const [loadingMsg, setLoadingMsg] = useState<string>("");
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [disabled, setDisabled] = useState<boolean>(true);
    const [showToast] = useIonToast();

    useEffect(() => {
        sfetch('POST', 'is_available_image/superpixel', '', 'json')
        .then((response) => {
            setDisabled(!response.available);
        });
    });

    useEffect(() => {
        // testing
        console.log('hey!')
        console.log(featParams.feats)
        console.log('normal output starts here:')
        console.log(prevFeatParams, featParams);
        console.log(isEqual(prevFeatParams, featParams));
        const hasChanged = !isEqual(prevFeatParams, featParams);
        setHasPreprocessed(!hasChanged);
    }, [featParams, prevFeatParams, setHasPreprocessed]);

    useEventBus('superpixelChanged', () => {
        setDisabled(false);
        setHasPreprocessed(false);
        setPrevFeatParams(null);
    });

    useEventBus('ImageLoaded', () => {
        setPrevFeatParams(null);
    });

    function getModuleBackendParams() {
        const params = {
            classifier_params: {
                classifier_type: classParams.classifier,
                grid_search: false
            },
            feature_extraction_params: {
                'sigmas': featParams.multiscale,
                'selected_features': featParams?.feats
                .filter(p => p.active)
                .map(p => p.id),
                'selected_supervoxel_feat_pooling': featParams?.pooling
                .filter(p => p.active)
                .map(p => p.id),
                'feat_selection_enabled': featParams.thresholdSelection !== null,
                'feat_selection_method_threshold': featParams.thresholdSelection
            }
        };

        return params;
    }

    function onApply() {
        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg("doing the apply operation");
        sfetch('POST', 'superpixel_segmentation_module/execute', '')
        .then(() => {
            dispatch('labelChanged', '');
        })!
        .finally(() => {
            setDisabled(false);
            setShowLoadingComp(false);
            showToast("Successfully applied the superpixel segmentation !", 2000);
        });
    }

    function onPreview() {

        const curSlice = currentEventValue('sliceChanged') as {
            slice: number,
            axis: string
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg("Doing the preview operation");
        sfetch('POST', '/superpixel_segmentation_module/preview', JSON.stringify(curSlice))
        .then(() => {
            dispatch('labelChanged', '');
        })
        .finally(() => {
            setDisabled(false);
            setShowLoadingComp(false);
            showToast("Successfully applied the preview !", 1000);
        });
    }

    function onPreprocess() {

        const params = getModuleBackendParams();

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg("doing the preprocess operation");
        sfetch('POST', '/superpixel_segmentation_module/create', JSON.stringify(params))
        .then(() => {
            console.log('preprocessou');
            setPrevFeatParams(featParams);
        })
        .catch(() => {
            console.log('falhou no preprocessou');
            setHasPreprocessed(false);
        })
        .finally(() => {
            setDisabled(false);
            setShowLoadingComp(false);
            showToast("Successfully applied the preprocess !", 1000);
        });
    }

    function renderSelectOptionClassifier( classifier: Classifier ) {
        return (
            <IonSelectOption key={classifier.id} value={classifier.id}>
                { classifier.name }
            </IonSelectOption>
        );
    }

    function renderCheckboxFeature( feature: Feature) {
        return (
            <IonItem key={feature.id}>
                <IonLabel>
                    <small>
                        {feature.name} 
                        <IonButton id={"showFeatInfo-button-"+feature.id} size="small" fill='clear'>
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                    </small>
                    <IonPopover trigger={"showFeatInfo-button-" + feature.id} reference="event">
                        <IonContent>
                            <IonCard>
                                <IonCardHeader><div style={ { fontWeight: 600, fontSize: 14 } }>{feature.type}</div></IonCardHeader>
                                <IonCardContent>{feature.description}</IonCardContent>
                            </IonCard>
                        </IonContent>
                    </IonPopover>
                </IonLabel>
                <IonCheckbox value={feature.id} checked={feature.active}
                    onIonChange={(e) => {
                        console.log(e);
                        const newfeats = featParams?.feats.map( nf => {
                            if (nf.id === feature.id) {
                                return {
                                    ...nf,
                                    active: e.detail.checked 
                                }
                            } else {
                                return nf;
                            }
                        } );
                        setFeatParams({...featParams, feats: newfeats});
                    }}
                />
            </IonItem>
        );
    }

    function renderCheckboxPooling(pooling: Pooling) {
        return (
            <IonItem key={pooling.id}>
                <IonLabel>{pooling.name}</IonLabel>
                <IonCheckbox value={pooling.id} checked={pooling.active}
                    onIonChange={ (e) => {
                        console.log(e);
                        const newpooling = featParams?.pooling.map( np => {
                            if (np.id === pooling.id) {
                                return {
                                    ...np,
                                    active : e.detail.checked
                                }
                            } else {
                                return np
                            }
                        } );
                        setFeatParams({...featParams, pooling: newpooling})
                    } }/>
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
                <IonLabel position="floating"> { modelParam.label } </IonLabel>
                <IonInput type={ modelParam.input }
                    debounce={200}
                    value={ modelParam.value }
                    onIonChange={ e => {
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
        <ModuleCard name="Superpixel Segmentation" disabled={disabled}
            onApply={onApply} onPreview={onPreview} onPreprocess={onPreprocess}
            disabledApply={!hasPreprocessed} disabledPreview={!hasPreprocessed} disabledPreprocess={hasPreprocessed}>

            <ModuleCardItem name="Superpixel Segmentation Parameters">
                <ModuleCardItem name="Feature Extraction Parameters">
                    <IonList>
                        { featParams?.feats.map(renderCheckboxFeature) }
                    </IonList>
                </ModuleCardItem>

                <ModuleCardItem name="Superpixel Feature Pooling">
                    { featParams?.pooling.map(renderCheckboxPooling) }
                </ModuleCardItem>

                <ModuleCardItem name="Multi-scale Parameters">
                    <IonItem>
                        <IonLabel position="floating">
                            <small>Multi-scale Filter Windows</small>
                        </IonLabel>
                        <IonInput value={featParams?.multiscale.join(',')}
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
                    <LoadingComponent
                        openLoadingWindow={showLoadingComp}
                        loadingText={loadingMsg}/>
                </ModuleCardItem>
                <ModuleCardItem name="Feature Selection Parameters">
                    <IonItem>
                        <IonLabel>Enable?</IonLabel>
                        <IonCheckbox checked={featParams.thresholdSelection!==undefined}
                            onIonChange={(e) => {
                                const value = e.detail.checked ? 0.01: undefined;
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
                                const value = e.detail.value? +e.detail.value : undefined;

                                setFeatParams({...featParams,
                                              thresholdSelection: value})
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
                            { classifiers.map(renderSelectOptionClassifier)  }
                        </IonSelect>
                    </IonItem>
                    <Fragment>
                        { classParams!.params.map((p) => {
                            return renderModelParameter(p, (value) => {
                                const newParams = classParams!.params.map((np) => {
                                    if (np.id === p.id) {
                                        return {...np, value: value}
                                    } else {
                                        return np;
                                    }
                                })

                                if (!isEqual(newParams, classParams.params)) {
                                    setClassParams(
                                        {...classParams, params: newParams}
                                    );
                                }
                            });
                        })
                        }
                    </Fragment>
                </ModuleCardItem>
            </ModuleCardItem>

        </ModuleCard>
    );
};

export default SuperpixelSegmentationModuleCard;
