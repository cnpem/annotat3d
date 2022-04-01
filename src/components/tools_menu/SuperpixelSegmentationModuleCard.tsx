

import { IonItem, IonLabel, IonList, IonInput, IonSelect, IonSelectOption, IonCheckbox } from '@ionic/react';
import {useEffect, useState} from 'react';
import {useStorageState} from 'react-storage-hooks';
import {useEventBus} from '../../utils/eventbus';
import {sfetch} from '../../utils/simplerequest';
import {ModuleCard, ModuleCardItem } from './ModuleCard';

const classifiers = [
    { id: 'rf', name: 'Random Forest' },
    { id: 'svm', name: 'Linear SVM' },
    { id: 'mlp', name: 'Multi Layer Perceptron' },
    { id: 'knn', name: 'KNearest Neighbors' },
    { id: 'adaboost', name: 'AdaBoost' }
];

const defaultFeatures: Feature[] = [
    { id: 0, name: 'FFT Gauss', active: true },
    { id: 1, name: 'None (Original Image)', active: true },
    { id: 2, name: 'Sobel' },
    { id: 3, name: 'Minimum' },
    { id: 4, name: 'Average' },
    { id: 5, name: 'Median' },
    { id: 6, name: 'FFT Gabor' },
    { id: 7, name: 'FFT Difference of Gaussians', active: true },
    { id: 8, name: 'Membrane Projections', active: true },
    { id: 9, name: 'Maximum' },
    { id: 10, name: 'Variance' },
    { id: 11, name: 'Local Binary Pattern' }
];

const defaultPooling: Pooling[] = [
    { id: 'min', name: 'Minimum', active: false },
    { id: 'max', name: 'Maximum', active: false },
    { id: 'mean', name: 'Mean', active: true }
]

interface Pooling {
    id: string,
    name: string,
    active: boolean
}

interface Feature {
    id: number,
    name: string,
    active?: boolean;
}

interface Classifier {
    id: string;
    name: string;
}

interface ClassifierParams {
    classifier: string
}

interface FeatureParams {
    pooling: Pooling[],
    feats: Feature[]
}

const SuperpixelSegmentationModuleCard: React.FC = () => {


    const [featParams, setFeatParams] = useStorageState<FeatureParams>(sessionStorage, 'superpixelFeatParams', {
        pooling: defaultPooling,
        feats: defaultFeatures
    });

    const [classParams, setClassParams] = useStorageState<ClassifierParams>(sessionStorage, 'superpixelClassParams', {
        classifier: 'rf'
    });

    const [hasPreprocessed, setHasPreprocessed] = useStorageState<boolean>(sessionStorage, 'superpixelSegmPreprocessed', false);

    const [disabled, setDisabled] = useState<boolean>(true);
 
    useEffect(() => {
        sfetch('POST', 'is_available_image/superpixel', '', 'json')
        .then((response) => {
           setDisabled(!response.available); 
        });
    });

    useEventBus('superpixelChanged', () => {
        setDisabled(false);
    });

    function onApply() {
        sfetch('POST', 'superpixel_segmentation_module/execute', '');
    }

    function onPreview() {
        sfetch('POST', '/superpixel_segmentation_module/preview', '');
    }

    function onPreprocess() {
        sfetch('POST', '/superpixel_segmentation_module/create', '')
        .then(() => {
            setHasPreprocessed(true);
        })
    }

    function renderSelectOptionClassifier( classifier: Classifier ) {
        return (
            <IonSelectOption key={classifier.id} value={classifier.id}>
                { classifier.name }
            </IonSelectOption>
        );
    }

    function renderCheckboxFeature(feature: Feature) {
        return (
            <IonItem key={feature.id}>
                <IonLabel><small>{feature.name}</small></IonLabel>
                <IonCheckbox value={feature.id} checked={feature.active}
                    onIonChange={(e) => {
                        console.log(e);
                        const newfeats = featParams.feats.map( nf => {
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
                        const newpooling = featParams.pooling.map( np => {
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

    return (
        <ModuleCard name="Superpixel Segmentation" disabled={disabled}
            onApply={onApply} onPreview={onPreview} onPreprocess={onPreprocess}
            disabledApply={!hasPreprocessed} disabledPreview={!hasPreprocessed} disabledPreprocess={hasPreprocessed}>

            <ModuleCardItem name="Superpixel Segmentation Parameters">
                <ModuleCardItem name="Feature Extraction Parameters">
                    <IonList>
                        { featParams.feats.map(renderCheckboxFeature) }
                    </IonList>
                </ModuleCardItem>

                <ModuleCardItem name="debug">
                    <IonItem>
                        <IonLabel>{ JSON.stringify(featParams.feats) }</IonLabel>
                    </IonItem>
                </ModuleCardItem>

                <ModuleCardItem name="Superpixel Feature Pooling">
                    { featParams.pooling.map(renderCheckboxPooling) }
                </ModuleCardItem>

                <ModuleCardItem name="Multi-scale Parameters">
                    <IonItem>
                        <IonLabel><small>Multi-scale Filter Windows</small></IonLabel>
                        <IonInput></IonInput>
                    </IonItem>
                </ModuleCardItem>

                <ModuleCardItem name="Feature Selection Parameters">
                    <IonItem>
                        <IonLabel>Enable?</IonLabel>
                        <IonCheckbox/>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Importance Threshold</IonLabel>
                        <IonInput type="number" step="0.01"></IonInput>
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
                                        classifier: e.detail.value
                                    });
                                }
                            }}>
                            { classifiers.map(renderSelectOptionClassifier)  }
                        </IonSelect>
                    </IonItem>
                </ModuleCardItem>
            </ModuleCardItem>

        </ModuleCard>
    );
};

export default SuperpixelSegmentationModuleCard;
