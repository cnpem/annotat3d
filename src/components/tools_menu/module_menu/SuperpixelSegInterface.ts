import {TextFieldTypes} from "@ionic/core";

// TODO : i think it's a good idea to document this file if i need time

export const classifiers = [
    {id: 'rf', name: 'Random Forest'},
    {id: 'svm', name: 'Linear SVM'},
    {id: 'mlp', name: 'Multi Layer Perceptron'},
    {id: 'knn', name: 'KNearest Neighbors'},
    {id: 'adaboost', name: 'AdaBoost'}
];

export const InitDefaultModelClassifierParams: Record<string, ModelClassifierParams[]> = {
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
    'knn': [
        {id: 'knn_n_neighbors', label: 'N. neighbors', value: 3, input: 'number'}
    ]
}

export const defaultFeatures: Feature[] = [
    {
        active: true,
        id: 'fft_gauss',
        name: 'FFT Gauss',
        type: 'Smoothing',
        description: 'Filters structures (smoothing) of the specified gaussian filtering in fourier space. Promotes smoothing without worrying about edges.'
    },
    {
        active: false,
        id: 'average',
        name: 'Average',
        type: 'Smoothing',
        description: 'It is a method of "smoothing" images by reducing the amount of intensity variation inside a window (Noise removal)'
    },
    {
        active: false,
        id: 'median',
        name: 'Median',
        type: 'Smoothing',
        description: 'It makes the target pixel intensity equal to the median value in the running window (Noise removal)'
    },
    {
        active: false,
        id: 'sobel',
        name: 'Sobel',
        type: 'Edge detection',
        description: 'It creates an image emphasizing edges because it performs a 2-D spatial gradient measurement on an image and so emphasizes regions of high spatial frequency that correspond to edges.'
    },
    {
        active: true,
        id: 'fft_dog',
        name: 'FFT Difference Of Gaussians',
        type: 'Edge detection',
        description: 'Calculates two gaussian blur images from the original image and subtracts one from the other. It is used to detect edges in the image.'
    },
    {
        active: false,
        id: 'fft_gabor',
        name: 'FFT Gabor',
        type: 'Edge detection,Texture detection',
        description: 'It determines if there is any specific frequency content in the image in specific directions in a localized region around the point or region of analysis. In the spatial domain, it is a Gaussian kernel function modulated by a sinusoidal plane wave. It is one of the most suitable option for texture segmentation and boundary detection'
    },
    {
        active: false,
        id: 'variance',
        name: 'Variance',
        type: 'Texture detection',
        description: 'It is a statistical measure of the amount of variation inside the window. This determines how uniform or not that filtering window is (important for assessing homogeneity and texture)'
    },
    {
        active: false,
        id: 'lbp',
        name: 'Local Binary Pattern',
        type: 'Texture detection',
        description: 'It is a texture operator that tries to capture how are the neighborhoods allocated. It labels the pixels of an image by thresholding the neighborhood of each pixel and considers the result as a binary number.'
    },
    {
        active: true,
        id: 'membrane_projections',
        name: 'Membrane Projections',
        type: 'Membrane Detection',
        description: 'Enhances membrane-like structures of the image through directional filtering.'
    },
    {
        active: false,
        id: 'minimum',
        name: 'Minimum',
        type: 'Color Identification',
        description: 'It replaces the value of the pixel with the value of the darkest pixel inside the filtering window'
    },
    {
        active: false,
        id: 'maximum',
        name: 'Maximum',
        type: 'Color Identification',
        description: 'It replaces the value of the pixel with the value of the lightest pixel inside the filtering window'
    },
    {
        active: true,
        id: 'none',
        name: 'None (Original Image)',
        type: 'Identity',
        description: 'Used to guarantee the preservation of some characteristics of the original image.'
    }
];

export interface ModelClassifierParams {
    id: string;
    label: string;
    value: any;
    input: TextFieldTypes;
}

export const defaultMultiscale = [1, 2, 4, 8];

export const defaultPooling: Pooling[] = [
    {id: 'min', name: 'Minimum', active: false},
    {id: 'max', name: 'Maximum', active: false},
    {id: 'mean', name: 'Mean', active: true}
]

export interface Pooling {
    id: string;
    name: string;
    active: boolean;
}

export interface Feature {
    id: string;
    name: string;
    type: string;
    description: string;
    active?: boolean;
}

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

export interface SuperpixelState {
    compactness: number;
    seedsSpacing: number;
    method: superpixel_type;
}

export const initialParamsValues: FeatureParams = {
    pooling: defaultPooling,
    feats: defaultFeatures,
    multiscale: defaultMultiscale,
    thresholdSelection: 0.01
}

export type superpixel_type = "waterpixels" | "waterpixels3d"

export interface BackEndLoadClassifier {
    superpixel_parameters: SuperpixelState,
    use_pixel_segmentation: boolean,
    classifier_parameters: ClassifierParams,
    feature_extraction_params: FeatureParams
}