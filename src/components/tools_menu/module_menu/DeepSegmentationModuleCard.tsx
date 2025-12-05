import { IonItem, IonLabel, IonInput, IonList, IonNote, IonPopover, useIonToast, IonToggle } from '@ionic/react';
import React, { useRef, useState } from 'react';
import { sfetch } from '../../../utils/simplerequest';
import { currentEventValue, dispatch } from '../../../utils/eventbus';

import LoadingComponent from '../utils/LoadingComponent';
import ErrorWindowComp from '../../main_menu/file/utils/ErrorWindowComp';
import { ModuleCard, ModuleCardItem } from './ModuleCard';
import { LabelInterface } from '../annotation_menu/label_table/LabelInterface';
import { useStorageState } from 'react-storage-hooks';

interface DeepSegmentationModuleCardProps {
    availableLabels: LabelInterface[];
}

const DeepSegmentationModuleCard: React.FC<DeepSegmentationModuleCardProps> = ({ availableLabels }) => {
    // --- training params ---
    const [epochs, setEpochs] = useState(200);
    const [learningRate, setLearningRate] = useState(1e-4);

    // --- selection state ---
    const [selectedLabels, setSelectedLabels] = useStorageState<number[]>(localStorage, 'labelsSelected', []);
    const [multiAxis, setMultiAxis] = useState(true);

    const [continueTraining, setContinueTraining] = useState(true);
    const [dataAug, setDataAug] = useState(true);
    // --- popover state for custom selector ---
    const [labelsPopoverOpen, setLabelsPopoverOpen] = useState(false);
    const popoverEvent = useRef<MouseEvent | undefined>(undefined);

    // --- ui state ---
    const [showLoading, setShowLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [showError, setShowError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [showToast] = useIonToast();
    const timeToast = 2000;

    const [extraContent, setExtraContent] = useState<React.ReactNode>(null);

    // -------------------------------------------------------------
    // HELPERS: custom selector (popover)
    // -------------------------------------------------------------
    function openLabelsPopover(e: React.MouseEvent | CustomEvent) {
        popoverEvent.current = (e as any).nativeEvent || undefined;
        setLabelsPopoverOpen(true);
    }

    function toggleLabel(id: number) {
        // if selecting the same label again → deselect it
        if (selectedLabels.length === 1 && selectedLabels[0] === id) {
            setSelectedLabels([]);
            return;
        }

        // Selecting one label → replace everything with that one
        setSelectedLabels([id]);
    }

    function selectAllOrNone() {
        const allIds = availableLabels.map((l) => l.id);

        // If all already selected → clear selection
        if (selectedLabels.length === allIds.length) {
            setSelectedLabels([]);
        } else {
            setSelectedLabels(allIds);
        }
    }
    // -------------------------------------------------------------
    // TRAIN BUTTON
    // -------------------------------------------------------------
    function onTrain() {
        if (selectedLabels.length === 0) {
            setShowError(true);
            setErrorMsg('Select at least one label.');
            return;
        }

        setLoadingMsg('Starting TensorBoard...');
        setShowLoading(true);

        sfetch('POST', '/pre_trained_deep_learning/init', JSON.stringify({ logDir: null }), 'json')
            .then((resp: any) => {
                const url = String(resp.tensorboard_url);

                console.log('TensorBoard URL:', url);

                setLoadingMsg('Training Deep Learning Model...');

                setExtraContent(
                    <button
                        style={{
                            padding: '6px 14px',
                            fontSize: '14px',
                            borderRadius: '6px',
                            backgroundColor: '#3880ff',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        onClick={() => window.open(url, '_blank')}
                    >
                        Open TensorBoard
                    </button>
                );

                return sfetch(
                    'POST',
                    '/pre_trained_deep_learning/train',
                    JSON.stringify({
                        epochs,
                        lr: learningRate,
                        selectedLabels,
                        continueTraining,
                        dataAug,
                    }),
                    'json'
                );
            })
            .then(() => {
                void showToast('Training finished ✅', timeToast);
            })
            .catch((error: any) => {
                setShowError(true);
                setErrorMsg(error?.error_msg || 'Training failed');
            })
            .finally(() => {
                setShowLoading(false);
                setExtraContent(null);
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
                setErrorMsg(error?.error_msg || 'Preview failed');
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

        const payload = { multiAxis };

        sfetch('POST', '/pre_trained_deep_learning/execute', JSON.stringify(payload), 'json')
            .then(() => {
                dispatch('labelChanged', '');
                void showToast('Volume segmentation done ✅', timeToast);
            })
            .catch((error: any) => {
                setShowError(true);
                setErrorMsg(error?.error_msg || 'Segmentation failed');
            })
            .finally(() => {
                setShowLoading(false);
            });
    }

    // -------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------
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
            {/* --- Training Parameters --- */}
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

                <IonItem>
                    <IonLabel>Data augmentation</IonLabel>
                    <IonToggle checked={dataAug} onIonChange={(e) => setDataAug(e.detail.checked)} />
                </IonItem>

                <IonNote style={{ marginLeft: '16px' }}>
                    {dataAug ? 'Random augmentations enabled' : 'No augmentation applied'}
                </IonNote>

                <IonItem>
                    <IonLabel>Continue training</IonLabel>
                    <IonToggle checked={continueTraining} onIonChange={(e) => setContinueTraining(e.detail.checked)} />
                </IonItem>

                <IonNote style={{ marginLeft: '16px' }}>
                    {continueTraining ? 'Continue training from previous weights' : 'Train from zero (fresh start)'}
                </IonNote>
            </ModuleCardItem>

            {/* --- Advanced Options --- */}
            <ModuleCardItem name="Advanced Options">
                {/* Multi-axis toggle (not locked) */}
                <IonItem>
                    <IonLabel>Inference in Multi-Axis</IonLabel>
                    <IonToggle checked={multiAxis} onIonChange={(e) => setMultiAxis(e.detail.checked)} />
                </IonItem>

                <IonNote style={{ marginLeft: '16px' }}>Multi-axis inference improves segmentation robustness.</IonNote>
            </ModuleCardItem>

            {/* --- Output Labels --- */}
            <ModuleCardItem name="Output Labels (select annotation classes)">
                {/* Closed “selector” row (click to open popover) */}
                <IonItem button onClick={openLabelsPopover}>
                    <IonLabel>
                        {selectedLabels.length === 0 && 'Select labels'}
                        {selectedLabels.length === availableLabels.length && 'All labels selected'}
                        {selectedLabels.length === 1 &&
                            availableLabels.find((l) => l.id === selectedLabels[0])?.labelName}
                    </IonLabel>
                </IonItem>

                {/* Custom Popover with colored items */}
                <IonPopover
                    isOpen={labelsPopoverOpen}
                    event={popoverEvent.current}
                    onDidDismiss={() => setLabelsPopoverOpen(false)}
                    className="labels-popover" // keep the class if you want to style globally too
                >
                    <IonList style={{ minWidth: '260px' }}>
                        {/* Select All / Unselect All */}
                        <IonItem button onClick={selectAllOrNone}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div
                                    style={{
                                        width: 15,
                                        height: 15,
                                        borderRadius: 4,
                                        background: '#888',
                                    }}
                                />
                                <IonLabel>
                                    {selectedLabels.length === availableLabels.length ? 'Unselect All' : 'Select All'}
                                </IonLabel>
                            </div>
                        </IonItem>

                        {/* Actual labels */}
                        {availableLabels.map((label) => {
                            const isSelected = selectedLabels.includes(label.id);
                            const color = `rgb(${label.color[0]}, ${label.color[1]}, ${label.color[2]})`;
                            return (
                                <IonItem key={label.id} button onClick={() => toggleLabel(label.id)} detail={false}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div
                                            className="round-bar"
                                            style={{
                                                width: 15,
                                                height: 15,
                                                borderRadius: 4,
                                                background: color,
                                                opacity: isSelected ? 1 : 0.35,
                                            }}
                                        />
                                        <IonLabel style={{ fontWeight: isSelected ? 600 : 400 }}>
                                            {label.labelName}
                                        </IonLabel>
                                    </div>
                                </IonItem>
                            );
                        })}
                    </IonList>
                </IonPopover>

                <IonNote>Select a label. Selecting All labels selects every label.</IonNote>
            </ModuleCardItem>

            {/* --- Error & Loading --- */}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg="Deep Segmentation Error"
                onErrorMsg={setErrorMsg}
                errorFlag={showError}
                onErrorFlag={setShowError}
            />

            <LoadingComponent openLoadingWindow={showLoading} loadingText={loadingMsg} extraContent={extraContent} />
        </ModuleCard>
    );
};

export default DeepSegmentationModuleCard;
