import type { TextFieldTypes } from '@ionic/core';

// TODO : i think it's a good idea to document this file if i need time

export const classifiers = [
    { id: 'rf', name: 'Random Forest' },
    { id: 'svm', name: 'Linear SVM' },
    { id: 'mlp', name: 'Multi Layer Perceptron' },
    { id: 'knn', name: 'KNearest Neighbors' },
    { id: 'adaboost', name: 'AdaBoost' },
];

export interface ModelClassifierParams {
    id: string;
    label: string;
    value: any;
    input: TextFieldTypes;
}

export const InitDefaultModelClassifierParams: Record<string, ModelClassifierParams[]> = {
    rf: [{ id: 'rf_n_estimators', label: 'Random Forest N. Trees', value: 100, input: 'number' }],
    svm: [{ id: 'svm_C', label: 'SVM C', value: 1.0, input: 'number' }],
    mlp: [{ id: 'mlp_hidden_layer_sizes', label: 'N. hidden Neurons', value: [100, 10], input: 'text' }],
    adaboost: [{ id: 'adaboost_n_estimators', label: 'N. classifiers', value: 100, input: 'number' }],
    knn: [{ id: 'knn_n_neighbors', label: 'N. neighbors', value: 3, input: 'number' }],
};

export interface Feature {
    id: string;
    name: string;
    type: string;
    description: string;
    active?: boolean;
}

export const defaultFeatures: Feature[] = [
    {
        active: true,
        id: 'intensity',
        name: 'Intensity',
        type: 'Color Identification',
        description:
            'Intensity values are sent to the classifier with or without gaussian filtering. It is the most basic feature.',
    },
    {
        active: false,
        id: 'texture',
        name: 'Texture',
        type: 'Color Identification',
        description: 'Applies a hessian matrix to the image, extracting its texture-patterns.',
    },
    {
        active: true,
        id: 'edges',
        name: 'Edges',
        type: 'Edge',
        description: 'Inputs edges as features, using prewitt filter.',
    },
];

export const defaultMultiscale = [0, 1, 2, 4, 8];

export interface Pooling {
    id: string;
    name: string;
    active: boolean;
}

export const defaultPooling: Pooling[] = [
    { id: 'min', name: 'Minimum', active: false },
    { id: 'max', name: 'Maximum', active: false },
    { id: 'mean', name: 'Mean', active: true },
];

export interface Classifier {
    id: string;
    name: string;
}

export interface ClassifierParams {
    classifier: string;
    params: ModelClassifierParams[];
}

export interface FeatureParams {
    pooling: Pooling[];
    feats: Feature[];
    multiscale: number[];
    thresholdSelection?: number;
}

export type SuperpixelType = 'waterpixels' | 'waterpixels3d';

export interface SuperpixelState {
    compactness: number;
    seedsSpacing: number;
    method: SuperpixelType;
}

export const initialParamsValues: FeatureParams = {
    pooling: defaultPooling,
    feats: defaultFeatures,
    multiscale: defaultMultiscale,
    thresholdSelection: 0.01,
};

export interface BackEndLoadClassifier {
    superpixel_parameters: SuperpixelState;
    use_pixel_segmentation: boolean;
    classifier_parameters: ClassifierParams;
    feature_extraction_params: FeatureParams;
}
