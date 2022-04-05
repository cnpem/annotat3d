

import { IonCard, IonCardTitle, IonCardHeader, IonCardSubtitle, IonCardContent, IonButton, IonAccordion, IonAccordionGroup, IonTitle, IonItem, IonItemDivider, IonLabel, IonList, IonInput, IonGrid, IonRow, IonSelect, IonSelectOption, IonSpinner, useIonLoading, IonContent, IonIcon, IonFooter, IonHeader, IonChip, IonToolbar, IonCheckbox, IonCol } from '@ionic/react';
import {arrowDown} from 'ionicons/icons';
import {Fragment, useState} from 'react';
import {ModuleCard, ModuleCardItem } from './ModuleCard';

const classifiers = [
    {
        id: 'rf',
        name: 'Random Forest'
    },
    {
        id: 'svm',
        name: 'Linear SVM'
    },
    {
        id: 'knn',
        name: 'KNearest Neighbors'
    }
];

const defaultFeatures: Feature[] = [
    {
        id: 0,
        name: 'FFT Gauss',
        active: true
    },
    {
        id: 1,
        name: 'None (Original Image)',
        active: true
    },
    {
        id: 2,
        name: 'Sobel'
    },
    {
        id: 3,
        name: 'Minimum'
    },
    {
        id: 4,
        name: 'Average'
    },
    {
        id: 5,
        name: 'Median'
    },
    {
        id: 6,
        name: 'FFT Gabor'
    },
    {
        id: 7,
        name: 'FFT Difference of Gaussians',
        active: true
    },
    {
        id: 8,
        name: 'Membrane Projections',
        active: true
    },
    {
        id: 9,
        name: 'Maximum'
    },
    {
        id: 10,
        name: 'Variance'
    },
    {
        id: 11,
        name: 'Local Binary Pattern'
    }
];

interface Feature {
    id: number,
    name: string,
    active?: boolean;
}

interface Classifier {
    id: string;
    name: string;
}

interface SuperpixelSegmentationState {
    classifierParams: Map<String, any>;
    classifier: string;
}

const SuperpixelSegmentationModuleCard: React.FC = () => {



    function onApply() {

    }

    function onPreview() {

    }

    function renderSelectOptionClassifier( classifier: Classifier ) {
        return (
            <IonSelectOption key={classifier.id}>
                { classifier.name }
            </IonSelectOption>
        );
    }

    function renderCheckboxFeature(feature: Feature) {
        return (
            <IonItem key={feature.id}>
                <IonLabel><small>{feature.name}</small></IonLabel>
                <IonCheckbox checked={feature.active}/>
            </IonItem>
        );
    }

    return (
        <ModuleCard name="Superpixel Segmentation" onApply={onApply} onPreview={onPreview}>

            <ModuleCardItem name="Superpixel Segmentation Parameters">
                <ModuleCardItem name="Feature Extraction Parameters">
                    <IonList>
                        { defaultFeatures.map(renderCheckboxFeature) }
                    </IonList>
                    <IonItemDivider/>
                </ModuleCardItem>

                <ModuleCardItem name="Superpixel Feature Pooling">
                    <IonItem>
                        <IonLabel>Minimum</IonLabel>
                        <IonCheckbox></IonCheckbox>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Maximum</IonLabel>
                        <IonCheckbox></IonCheckbox>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Mean</IonLabel>
                        <IonCheckbox></IonCheckbox>
                    </IonItem>

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
                        <IonSelect interface="popover">
                            { classifiers.map(renderSelectOptionClassifier)  }
                        </IonSelect>
                    </IonItem>
                </ModuleCardItem>
            </ModuleCardItem>

        </ModuleCard>
    );
};

export default SuperpixelSegmentationModuleCard;
