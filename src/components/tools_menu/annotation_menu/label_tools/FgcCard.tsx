/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useState } from 'react';
import {
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonRadioGroup,
    IonRadio,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    IonPopover,
    IonIcon,
    IonContent,
    IonToggle,
    IonCheckbox,
    IonSelect,
    IonSelectOption,
    IonAccordion,
    IonAccordionGroup,
    IonItemDivider,
} from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';
import { sfetch } from '../../../../utils/simplerequest';
import { dispatch } from '../../../../utils/eventbus';
import LoadingComponent from '../../utils/LoadingComponent';

interface FGCCardProps {
    isVisible: boolean;
}
const featureOptions = ['Intensity', 'Texture', 'Edges', 'Superpixel'];
const metricsOptions = [
    'euclidean',
    'cityblock',
    'cosine',
    'canberra',
    'correlation',
    'chebyshev',
    'jensenshannon',
    'braycurtis',
];

const FgcCard: React.FC<FGCCardProps> = ({ isVisible }) => {
    const [algorithm, setAlgorithm] = useState<string>('kmeans');
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingCompPS, setShowLoadingCompPS] = useState<boolean>(false);
    const [markerID, setMarkerId] = useState<number>(-1);

    const [anchorFinder, setAnchorFinder] = useState<string>('kmeans');
    const [isAnchorFinderOpen, setIsAnchorFinderOpen] = useState(false);

    const [numPhases, setNumPhases] = useState<number>(3);
    const [numRepresentativePoints, setNumRepresentativePoints] = useState<number>(5);
    const [numIterations, setNumIterations] = useState<number>(10);
    const [regularization, setRegularization] = useState<number>(1);
    const [labelregularization, setLabelRegularization] = useState<number>(0);
    const [smoothRegularization, setSmoothRegularization] = useState<number>(0.5);
    const [windowSize, setWindowSize] = useState<number>(3);
    const [tolerance, setTolerance] = useState<number>(0.01);

    const [selectedDimension, setSelectedDimension] = useState<'2D' | '3D'>('2D');
    const [canContinue, setCanContinue] = useState<boolean>(true);
    const [useWholeImage, setUseWholeImage] = useState<boolean>(true);

    const [multiScaleNum, setMultiScaleNum] = useState<number>(3);
    const [sigmaMin, setSigmaMin] = useState<number>(1);
    const [sigmaMax, setSigmaMax] = useState<number>(3);

    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['Intensity']);
    const [selectedMetric, setSelectedMetric] = useState<'euclidean'>('euclidean');
    const [popover, setPopover] = useState<any>(null);
    const [stopProcess, setStopProcess] = useState<boolean>(false);

    if (!isVisible) return null;

    const handleApply = async () => {
        if (!canContinue) {
            setCanContinue(true);
            return;
        }

        setStopProcess(false); // Reset stop flag

        const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10);
        const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"');

        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);
        const data = {
            algorithm,
            anchorFinder,
            numPhases,
            numRepresentativePoints,
            numIterations,
            regularization,
            smoothRegularization,
            labelregularization,
            windowSize,
            tolerance,
            useWholeImage,
            selectedFeatures,
            selectedMetric,
            multiScaleNum,
            sigmaMax,
            sigmaMin,
            dimension: selectedDimension.toLowerCase(),
            current_thresh_marker: markerID,
            current_slice: sliceValue,
            current_axis: sliceName,
            label: selectedLabel,
        };

        try {
            console.log('Sending data to backend:', data);
            setShowLoadingCompPS(true);
            const result = await sfetch('POST', '/fgc_apply/image', JSON.stringify(data), 'json');
            console.log('Backend response:', result);
        } catch (error) {
            console.error('Error applying fgc:', error);
            const typedError = error as Error;
            setShowLoadingCompPS(false);
            dispatch('fgcError', { error: typedError.message });
        }
        setShowLoadingCompPS(false);
        dispatch('annotationChanged', null);
    };

    const openPopover = (event: any, info: string) => {
        setPopover({ event, info });
    };

    const closePopover = () => {
        setPopover(null);
    };

    const handleStop = () => {
        setStopProcess(true);
        setShowLoadingCompPS(false);
    };

    const handleFeatureChange = (feature: string) => {
        setSelectedFeatures((prev) =>
            prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
        );
    };

    return (
        <IonCard style={{ display: isVisible ? 'block' : 'none' }}>
            <IonCardContent>
                <LoadingComponent openLoadingWindow={showLoadingCompPS} loadingText={loadingMsg} />
                <IonList>
                    <IonItem>
                        <IonLabel position="floating">Number of Phases</IonLabel>
                        <IonInput
                            type="number"
                            value={numPhases}
                            onIonChange={(e) => setNumPhases(parseInt(e.detail.value!, 10))}
                        />
                        <IonButton
                            slot="end"
                            fill="clear"
                            onClick={(e) =>
                                openPopover(e, 'Number of Phases: Specifies the number of resulting phases...')
                            }
                        >
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                    </IonItem>

                    <IonItem>
                        <IonLabel position="floating">Number of Representative Points</IonLabel>
                        <IonInput
                            type="number"
                            value={numRepresentativePoints}
                            onIonChange={(e) => setNumRepresentativePoints(parseInt(e.detail.value!, 10))}
                        />
                        <IonButton
                            slot="end"
                            fill="clear"
                            onClick={(e) =>
                                openPopover(e, 'Number of Representative Points: Defines how many anchor points...')
                            }
                        >
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                    </IonItem>
                </IonList>

                {/* Features stay outside */}
                <IonItem>
                    <IonLabel>Features</IonLabel>
                </IonItem>
                <IonGrid>
                    <IonRow>
                        {featureOptions.map((feature) => {
                            const isSelected = selectedFeatures.includes(feature);
                            return (
                                <IonCol size="6" key={feature}>
                                    <IonButton
                                        expand="block"
                                        fill={isSelected ? 'solid' : 'outline'}
                                        color={isSelected ? 'success' : 'medium'}
                                        onClick={() => handleFeatureChange(feature)}
                                        style={{ borderRadius: '20px', textTransform: 'none' }}
                                    >
                                        {feature}
                                    </IonButton>
                                </IonCol>
                            );
                        })}
                    </IonRow>
                </IonGrid>

                {/* Advanced Options Accordion */}
                <IonAccordionGroup>
                    <IonAccordion value="advanced">
                        <IonItem slot="header">
                            <IonLabel>Advanced Options</IonLabel>
                        </IonItem>
                        <IonList slot="content">
                            <IonItem>
                                <IonLabel position="floating">Number of Scales</IonLabel>
                                <IonInput
                                    type="number"
                                    value={multiScaleNum}
                                    onIonChange={(e) => setMultiScaleNum(parseInt(e.detail.value!, 10))}
                                />
                            </IonItem>

                            <IonItem>
                                <IonLabel position="floating">Sigma Min</IonLabel>
                                <IonInput
                                    type="number"
                                    value={sigmaMin}
                                    onIonChange={(e) => setSigmaMin(parseInt(e.detail.value!, 10))}
                                />
                            </IonItem>

                            <IonItem>
                                <IonLabel position="floating">Sigma Max</IonLabel>
                                <IonInput
                                    type="number"
                                    value={sigmaMax}
                                    onIonChange={(e) => setSigmaMax(parseInt(e.detail.value!, 10))}
                                />
                            </IonItem>
                            {/* Number of Iterations */}
                            <IonItem>
                                <IonLabel position="floating">Number of Iterations</IonLabel>
                                <IonInput
                                    type="number"
                                    value={numIterations}
                                    onIonChange={(e) => setNumIterations(parseInt(e.detail.value!, 10))}
                                />
                                <IonButton
                                    slot="end"
                                    fill="clear"
                                    onClick={(e) =>
                                        openPopover(e, 'Number of Iterations: Sets the maximum number of iterations...')
                                    }
                                >
                                    <IonIcon icon={informationCircleOutline} />
                                </IonButton>
                            </IonItem>

                            {/* Regularization */}
                            <IonItem>
                                <IonLabel position="floating">Regularization</IonLabel>
                                <IonInput
                                    type="number"
                                    value={regularization}
                                    onIonChange={(e) => setRegularization(parseFloat(e.detail.value!))}
                                />
                                <IonButton
                                    slot="end"
                                    fill="clear"
                                    onClick={(e) => openPopover(e, 'Regularization: Prevents degenerate embeddings...')}
                                >
                                    <IonIcon icon={informationCircleOutline} />
                                </IonButton>
                            </IonItem>

                            {/* Smooth Regularization */}
                            <IonItem>
                                <IonLabel position="floating">Smooth Regularization</IonLabel>
                                <IonInput
                                    type="number"
                                    value={smoothRegularization}
                                    onIonChange={(e) => setSmoothRegularization(parseFloat(e.detail.value!))}
                                />
                                <IonButton
                                    slot="end"
                                    fill="clear"
                                    onClick={(e) =>
                                        openPopover(e, 'Smooth Regularization: Improves smooth transitions...')
                                    }
                                >
                                    <IonIcon icon={informationCircleOutline} />
                                </IonButton>
                            </IonItem>

                            {/* Window Size */}
                            <IonItem>
                                <IonLabel position="floating">Window Size</IonLabel>
                                <IonInput
                                    type="number"
                                    value={windowSize}
                                    onIonChange={(e) => setWindowSize(parseInt(e.detail.value!, 10))}
                                />
                                <IonButton
                                    slot="end"
                                    fill="clear"
                                    onClick={(e) => openPopover(e, 'Window Size: Controls spatial influence...')}
                                >
                                    <IonIcon icon={informationCircleOutline} />
                                </IonButton>
                            </IonItem>

                            {/* Tolerance */}
                            <IonItem>
                                <IonLabel position="floating">Tolerance for Convergence</IonLabel>
                                <IonInput
                                    type="number"
                                    value={tolerance}
                                    onIonChange={(e) => setTolerance(parseFloat(e.detail.value!))}
                                />
                                <IonButton
                                    slot="end"
                                    fill="clear"
                                    onClick={(e) =>
                                        openPopover(
                                            e,
                                            'Tolerance for Convergence: Defines the threshold for convergence...'
                                        )
                                    }
                                >
                                    <IonIcon icon={informationCircleOutline} />
                                </IonButton>
                            </IonItem>

                            {/* Metric (moved inside Advanced Options) */}
                            <IonItem>
                                <IonLabel>Metric</IonLabel>
                                <IonSelect
                                    interface="popover"
                                    placeholder="Select metric"
                                    value={selectedMetric}
                                    onIonChange={(e) => setSelectedMetric(e.detail.value)}
                                >
                                    {metricsOptions.map((metric) => (
                                        <IonSelectOption key={metric} value={metric}>
                                            {metric}
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                        </IonList>
                    </IonAccordion>
                </IonAccordionGroup>

                <IonButton expand="block" onClick={handleApply}>
                    Generate Annotations
                </IonButton>

                <IonPopover isOpen={!!popover} event={popover?.event} onDidDismiss={closePopover}>
                    <IonContent className="ion-padding">{popover?.info}</IonContent>
                </IonPopover>
            </IonCardContent>
        </IonCard>
    );
};

export default FgcCard;
