// src/components/ModuleCards/DeepSegmentationModuleCard.tsx

import { IonItem, IonLabel, IonInput, IonList, IonSelect, IonSelectOption, IonNote, useIonToast } from '@ionic/react';

import React, { useState } from 'react';
import { sfetch } from '../../../utils/simplerequest';
import { currentEventValue, dispatch } from '../../../utils/eventbus';

import LoadingComponent from '../utils/LoadingComponent';
import ErrorWindowComp from '../../main_menu/file/utils/ErrorWindowComp';
import { ModuleCard, ModuleCardItem } from './ModuleCard';
import { LabelInterface } from '../annotation_menu/label_table/LabelInterface';
import './DeepSegmentationModuleCard.css';

interface DeepSegmentationModuleCardProps {
    availableLabels: LabelInterface[];
}

const ALL_LABELS_KEY = -1; // Use a special number to represent "ALL"

const DeepSegmentationModuleCard: React.FC<DeepSegmentationModuleCardProps> = ({ availableLabels }) => {
    const [epochs, setEpochs] = useState(200);
    const [learningRate, setLearningRate] = useState(1e-4);
    const [selectedLabels, setSelectedLabels] = useState<number[]>([]);

    const [showLoading, setShowLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');

    const [showError, setShowError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [showToast] = useIonToast();
    const timeToast = 2000;

    // -------------------------------------------------------------
    // TRAIN BUTTON
    // -------------------------------------------------------------
    function onTrain() {
        if (selectedLabels.length === 0) {
            setShowError(true);
            setErrorMsg('Select at least one label.');
            return;
        }

        setLoadingMsg('Training Deep Learning model...');
        setShowLoading(true);

        const body = {
            epochs,
            lr: learningRate,
            selectedLabels,
        };
        console.log('Selected Labels', selectedLabels);

        sfetch('POST', '/pre_trained_deep_learning/train', JSON.stringify(body), 'json')
            .then(() => {
                void showToast('Deep Learning training complete ✅', timeToast);
            })
            .catch((error: any) => {
                setShowError(true);
                setErrorMsg(error.error_msg || 'Training failed');
            })
            .finally(() => {
                setShowLoading(false);
            });
    }

    // -------------------------------------------------------------
    // PREVIEW (slice)
    // -------------------------------------------------------------
    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as { slice: number; axis: string };

        setLoadingMsg('Generating preview...');
        setShowLoading(true);

        sfetch('POST', '/pre_trained_deep_learning/preview', JSON.stringify(curSlice), 'json')
            .then(() => {
                dispatch('labelChanged', '');
                void showToast('Preview complete ✅', timeToast);
            })
            .catch((error: any) => {
                setShowError(true);
                setErrorMsg(error.error_msg || 'Preview failed');
            })
            .finally(() => {
                setShowLoading(false);
            });
    }

    // -------------------------------------------------------------
    // EXECUTE (full volume)
    // -------------------------------------------------------------
    function onApply() {
        setLoadingMsg('Segmenting entire volume...');
        setShowLoading(true);

        sfetch('POST', '/pre_trained_deep_learning/execute', '')
            .then(() => {
                dispatch('labelChanged', '');
                void showToast('Volume segmentation done ✅', timeToast);
            })
            .catch((error: any) => {
                setShowError(true);
                setErrorMsg(error.error_msg || 'Segmentation failed');
            })
            .finally(() => {
                setShowLoading(false);
            });
    }

    return (
        <ModuleCard
            name="Deep Learning Segmentation"
            onOther={onTrain}
            onPreview={onPreview}
            onApply={onApply}
            OtherName="Train"
            PreviewName="Preview (slice)"
            ApplyName="Run full volume"
        >
            <ModuleCardItem name="Training Parameters">
                <IonItem>
                    <IonLabel position="stacked">Epochs</IonLabel>
                    <IonInput
                        type="number"
                        value={epochs}
                        onIonChange={(e) => setEpochs(parseInt(e.detail.value!, 10))}
                    />
                </IonItem>

                <IonItem>
                    <IonLabel position="stacked">Learning Rate</IonLabel>
                    <IonInput
                        type="number"
                        value={learningRate}
                        onIonChange={(e) => setLearningRate(parseFloat(e.detail.value!))}
                    />
                </IonItem>
            </ModuleCardItem>
            <ModuleCardItem name="Output Labels (select annotation classes)">
                <IonList>
                    <IonSelect
                        interface="popover"
                        interfaceOptions={{ cssClass: 'labels-popover' }}
                        value={selectedLabels.length === availableLabels.length ? ALL_LABELS_KEY : selectedLabels}
                        onIonChange={(e) => {
                            const value = e.detail.value;
                            const allIds = availableLabels.map((lbl) => lbl.id);

                            if (value === ALL_LABELS_KEY) {
                                const selectingAll = selectedLabels.length !== allIds.length;
                                setSelectedLabels(selectingAll ? allIds : []);
                                return;
                            }

                            const newLabel = Number(value);
                            if (!selectedLabels.includes(newLabel)) {
                                setSelectedLabels([...selectedLabels, newLabel]);
                            }
                        }}
                    >
                        <IonSelectOption value={ALL_LABELS_KEY}>All labels</IonSelectOption>

                        {availableLabels.map((lbl) => {
                            const squareColor = `rgb(${lbl.color[0]}, ${lbl.color[1]}, ${lbl.color[2]})`;
                            return (
                                <IonSelectOption
                                    key={lbl.id}
                                    value={lbl.id}
                                    className="option-square"
                                    style={{ ['--square-color' as any]: squareColor }}
                                >
                                    {lbl.labelName}
                                </IonSelectOption>
                            );
                        })}
                    </IonSelect>
                </IonList>

                <IonNote>Select a label. Selecting All labels selects every label.</IonNote>
            </ModuleCardItem>

            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg="Deep Segmentation Error"
                onErrorMsg={setErrorMsg}
                errorFlag={showError}
                onErrorFlag={setShowError}
            />

            <LoadingComponent openLoadingWindow={showLoading} loadingText={loadingMsg} />
        </ModuleCard>
    );
};

export default DeepSegmentationModuleCard;
