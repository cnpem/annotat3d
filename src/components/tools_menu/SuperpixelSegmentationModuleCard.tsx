

import {TextFieldTypes} from '@ionic/core';
import { IonItem, IonLabel, IonList, IonInput, IonSelect, IonSelectOption, IonCheckbox, InputChangeEventDetail, IonTextarea } from '@ionic/react';
import {isEqual} from 'lodash';
import {Fragment, useEffect, useState} from 'react';
import {useStorageState} from 'react-storage-hooks';
import {useEventBus, dispatch} from '../../utils/eventbus';
import {sfetch} from '../../utils/simplerequest';
import {ModuleCard, ModuleCardItem } from './ModuleCard';

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
        { id: 'C', label: 'SVM C', value: 1.0, input: 'number'}
    ],
    'mlp': [
        {
            id: 'hidden_layer_sizes', label: 'N. hidden Neurons', value: [100, 10], input: 'text',
            inputPreprocess: (textInput: string) => textInput.split(',')
            .map(t => parseInt(t))
            .filter(n => !Number.isNaN(n))
        }
    ],
    'adaboost': [
        { id: 'n_estimators', label: 'N. classifiers', value: 100, input: 'number'}
    ],
    'knn': [
        { id: 'n_neighbors', label: 'N. neighbors', value: 3 , input: 'number'}
    ]
}

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

interface ModelClassifierParams {

    id: string,
    label: string,
    value: any,
    input: TextFieldTypes,
    inputPreprocess?: (val: any) => any

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
    id: number;
    name: string;
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
}

const SuperpixelSegmentationModuleCard: React.FC = () => {

    const [prevFeatParams, setPrevFeatParams] = useState<FeatureParams>();

    const [featParams, setFeatParams] = useStorageState<FeatureParams>(sessionStorage, 'superpixelFeatParams', {
        pooling: defaultPooling,
        feats: defaultFeatures,
        multiscale: defaultMultiscale
    });

    const [classParams, setClassParams] = useStorageState<ClassifierParams>(sessionStorage, 'superpixelClassParams', {
        classifier: 'rf',
        params: defaultModelClassifierParams['rf']
    });

    const [hasPreprocessed, setHasPreprocessed] = useStorageState<boolean>(sessionStorage, 'superpixelSegmPreprocessed', false);

    const [disabled, setDisabled] = useState<boolean>(true);

    useEffect(() => {
        sfetch('POST', 'is_available_image/superpixel', '', 'json')
        .then((response) => {
            setDisabled(!response.available);
        });
    });

    useEffect(() => {
        console.log(prevFeatParams, featParams);
        console.log(isEqual(prevFeatParams, featParams));
        const hasChanged = !isEqual(prevFeatParams, featParams);
        setHasPreprocessed(!hasChanged);
    }, [featParams, prevFeatParams, setHasPreprocessed]);

    useEventBus('superpixelChanged', () => {
        setDisabled(false);
        setHasPreprocessed(false);
    });

    function getModuleBackendParams() {
        const params = {
            classifier_params: {
                classifier_type: classParams.classifier,
                grid_search: false
            },
            feature_extraction_params: {
                'sigmas': featParams.multiscale,
                'selected_features': featParams.feats
                        .filter(p => p.active)
                        .map(p => p.id),
                'selected_supervoxel_feat_pooling': featParams.pooling
                    .filter(p => p.active)
                    .map(p => p.id),
                'feat_selection_enabled': true,
                'feat_selection_method_threshold': 0.01
            }
        };

        console.log(params);
        return params;
    }

    function onApply() {
        sfetch('POST', 'superpixel_segmentation_module/execute', '').
            then(() => {
            dispatch('labelChanged', '');
            setPrevFeatParams(featParams);
        });
    }

    function onPreview() {
        sfetch('POST', '/superpixel_segmentation_module/preview', '')
            .then(() => {
                dispatch('labelChanged', '');
                setPrevFeatParams(featParams);
            });
    }

    function onPreprocess() {

        const params = getModuleBackendParams();

        sfetch('POST', '/superpixel_segmentation_module/create', JSON.stringify(params))
        .then(() => {
            console.log('preprocessou');
            //setPrevFeatParams(prevFeatParams);
            setHasPreprocessed(true);
        })
        .catch(() => {
            console.log('falhou no preprocessou');
            setHasPreprocessed(false);
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

    function renderModelParameter(modelParam: ModelClassifierParams,
                                  onParamChange?: (value: any) => void) {

                                      return (
                                          <IonItem key={modelParam.id}>
                                              <IonLabel position="floating"> { modelParam.label } </IonLabel>
                                              <IonInput type={ modelParam.input }
                                                  debounce={200}
                                                  value={ modelParam.value }
                                                  onIonChange={ e => {
                                                      let value = e.detail.value;
                                                      console.log('before: ', modelParam.inputPreprocess);
                                                      if (modelParam.inputPreprocess) {
                                                          value = modelParam.inputPreprocess(value);
                                                      }
                                                      console.log('after: ', value);
                                                      if (onParamChange)
                                                          onParamChange(value);
                                                  }
                                                  }>
                                              </IonInput>
                                          </IonItem>
                                      );
                                  }

                                  return (
                                      <ModuleCard name="Superpixel Segmentation" disabled={disabled}
                                          onApply={onApply} onPreview={onPreview} onPreprocess={onPreprocess}
                                          disabledApply={!hasPreprocessed} disabledPreview={!hasPreprocessed} disabledPreprocess={hasPreprocessed}>

                                          <ModuleCardItem name={"featParams " + JSON.stringify(hasPreprocessed)}>

                                              <IonItem>
                                                  <IonTextarea contentEditable={false}>{ JSON.stringify(featParams, null, 2) }</IonTextarea>
                                              </IonItem>

                                          </ModuleCardItem>

                                          <ModuleCardItem name="classParams">
                                              <IonItem>
                                                  <IonTextarea contentEditable={false}>{ JSON.stringify(classParams, null, 2) }</IonTextarea>
                                              </IonItem>
                                          </ModuleCardItem>

                                          <ModuleCardItem name="Superpixel Segmentation Parameters">
                                              <ModuleCardItem name="Feature Extraction Parameters">
                                                  <IonList>
                                                      { featParams.feats.map(renderCheckboxFeature) }
                                                  </IonList>
                                              </ModuleCardItem>

                                              <ModuleCardItem name="Superpixel Feature Pooling">
                                                  { featParams.pooling.map(renderCheckboxPooling) }
                                              </ModuleCardItem>

                                              <ModuleCardItem name="Multi-scale Parameters">
                                                  <IonItem>
                                                      <IonLabel position="floating"><small>Multi-scale Filter Windows</small></IonLabel>
                                                      <IonInput></IonInput>
                                                  </IonItem>
                                              </ModuleCardItem>

                                              <ModuleCardItem name="Feature Selection Parameters">
                                                  <IonItem>
                                                      <IonLabel>Enable?</IonLabel>
                                                      <IonCheckbox/>
                                                  </IonItem>
                                                  <IonItem>
                                                      <IonLabel position="floating">Importance Threshold</IonLabel>
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
                                                                      classifier: e.detail.value,
                                                                      params: defaultModelClassifierParams[e.detail.value]
                                                                  });
                                                              }
                                                          }}>
                                                          { classifiers.map(renderSelectOptionClassifier)  }
                                                      </IonSelect>
                                                  </IonItem>
                                                  <Fragment>
                                                      { classParams.params.map((p) => {
                                                          return renderModelParameter(p, (value) => {
                                                              const newParams = classParams.params.map((np) => {
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
