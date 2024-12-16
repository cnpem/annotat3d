import React, { useEffect, useState } from 'react';
import {
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonRange,
    IonGrid,
    IonRow,
    IonCol,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonText,
    IonButton,
    IonCheckbox,
} from '@ionic/react';
import '../../vis_menu/HistogramAlignment.css';
import { dispatch } from '../../../../utils/eventbus';
import { useStorageState } from 'react-storage-hooks';
import InfoPopover from '../../utils/InfoPopover'; // Reusable InfoPopover Component
import { sfetch } from '../../../../utils/simplerequest';

interface ActiveContourCardProps {
    isVisible: boolean;
}

const ActiveContourCard: React.FC<ActiveContourCardProps> = ({ isVisible }) => {
    const [method, setMethod] = useStorageState<string>(sessionStorage, 'ActiveContourMethod', 'chan-vese');

    // Shared Parameters
    const [iterations, setIterations] = useStorageState<number>(sessionStorage, 'ActiveContourIterations', 100);
    const [smoothing, setSmoothing] = useStorageState<number>(sessionStorage, 'ActiveContourSmoothing', 1);

    // Chan-Vese Specific Parameters
    const [weight, setWeight] = useStorageState<number>(sessionStorage, 'ActiveContourWeight', 1.0);

    // Geodesic Specific Parameters
    const [threshold, setThreshold] = useStorageState<number>(sessionStorage, 'GeodesicThreshold', 40);
    const [sigma, setSigma] = useStorageState<number>(sessionStorage, 'GeodesicSigma', 1);
    const [balloonForce, setBalloonForce] = useStorageState<boolean>(sessionStorage, 'BalloonForce', true);

    // New Checkboard Parameters
    const [useCheckboard, setUseCheckboard] = useState<boolean>(false);
    const [checkboardSize, setCheckboardSize] = useState<number>(3);
    const [backgroundAnnot, setBackgroundAnnot] = useState<boolean>(true);

    useEffect(() => {
        if (isVisible) {
            dispatch('ChangeStateBrush', 'snakes');
        } else {
            dispatch('ChangeStateBrush', 'draw_brush');
        }
    }, [isVisible]);

    const handleValueChange = (key: string, value: string | number | boolean) => {
        const parsedValue =
            key === 'weight' || key === 'threshold'
                ? parseFloat(value as string)
                : key === 'balloonForce'
                ? (value as boolean)
                : parseInt(value as string, 10);

        if (!isNaN(parsedValue as number) || typeof parsedValue === 'boolean') {
            switch (key) {
                case 'iterations':
                    setIterations(parsedValue as number);
                    break;
                case 'smoothing':
                    setSmoothing(parsedValue as number);
                    break;
                case 'weight':
                    setWeight(parsedValue as number);
                    break;
                case 'threshold':
                    setThreshold(parsedValue as number);
                    break;
                case 'balloonForce':
                    setBalloonForce(parsedValue as boolean);
                    break;
                case 'sigma':
                    setSigma(parsedValue as number);
                    break;
                case 'checkboardSize':
                    setCheckboardSize(parsedValue as number);
                    break;
            }
        }
    };

    const applyCheckboardLevelSet = () => {
        const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10);
        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);
        const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"');
        const params = {
            iterations,
            smoothing,
            weight,
            method,
            threshold,
            balloon_force: balloonForce,
            sigma,
            axis: sliceName,
            slice_num: sliceValue,
            label: selectedLabel,
            checkboard_size: checkboardSize,
            background: backgroundAnnot,
        };
        // Send finalization request to backend
        sfetch('POST', '/active_contour_checkboard/image', JSON.stringify(params), 'json')
            .then((finalizeReponse) => {
                console.log('Active contour finalized:', finalizeReponse);
                dispatch('annotationChanged', null); // Notify annotation changes
            })
            .catch((error) => {
                console.error('Error finalizing active contour:', error);
            });
    };

    return (
        <IonGrid slot="content">
            {/* Title */}
            <IonItem>
                <IonLabel className="ion-text-center">
                    <h2>Morphological Snakes Settings</h2>
                </IonLabel>
            </IonItem>

            {/* Method Selector */}
            <IonItem>
                <IonLabel position="stacked">Method</IonLabel>
                <IonSelect value={method} onIonChange={(e) => setMethod(e.detail.value)} interface="popover">
                    <IonSelectOption value="chan-vese">Chan-Vese</IonSelectOption>
                    <IonSelectOption value="geodesic">Geodesic</IonSelectOption>
                </IonSelect>
                <InfoPopover
                    triggerId="Methods"
                    header="Snakes"
                    content="Chan-Vese defines an energy functional for image segmentation that evaluates the content inside the curve and the entire image outside it. In contrast, the Geodesic model relies on image edges, offering greater flexibility through a broader range of parameters. Unlike Chan-Vese, it emphasizes the specific regions along the curve's path."
                />
            </IonItem>

            {/* Chan-Vese Parameters */}
            {method === 'chan-vese' && (
                <>
                    <IonItem>
                        <IonLabel>Iterations: </IonLabel>
                        <IonInput
                            type="number"
                            inputMode="numeric"
                            value={iterations}
                            onIonChange={(e: CustomEvent) => handleValueChange('iterations', e.detail.value!)}
                            placeholder="Enter number of iterations"
                        />
                        <InfoPopover
                            triggerId="chanVeseIterationsInfo"
                            header="Iterations"
                            content="More iterations allow the contour to evolve further until it reachs a maximum, usually around 150-300 iterations."
                        />
                    </IonItem>

                    <IonItem>
                        <IonText>Smoothing: </IonText>
                        <IonRange
                            min={0}
                            max={4}
                            step={1}
                            pin={true}
                            snaps={true}
                            value={smoothing}
                            onIonKnobMoveEnd={(e: CustomEvent) => handleValueChange('smoothing', e.detail.value!)}
                        />
                        <InfoPopover
                            triggerId="chanVeseSmoothingInfo"
                            header="Smoothing"
                            content="Smoothing reduces noise but can blur fine details."
                        />
                    </IonItem>

                    <IonItem>
                        <IonLabel>Weight: </IonLabel>
                        <IonInput
                            type="number"
                            inputMode="decimal"
                            value={weight}
                            onIonChange={(e: CustomEvent) => handleValueChange('weight', e.detail.value!)}
                            placeholder="Enter weight value"
                        />
                        <InfoPopover
                            triggerId="chanVeseWeightInfo"
                            header="Weight"
                            content="Determines the algorithm's focus on regions inside or outside the contour: Weight > 1 emphasizes inside pixels, Weight < 1 emphasizes outside pixels, and Weight = 1 gives equal importance to both."
                        />
                    </IonItem>

                    {/* Checkboard Settings */}
                    <IonItem>
                        <IonLabel>Use Checkboard: </IonLabel>
                        <IonToggle
                            checked={useCheckboard}
                            onIonChange={(e: CustomEvent) => setUseCheckboard(e.detail.checked)}
                        />
                        <InfoPopover
                            triggerId="checkboardInfo"
                            header="Create binary checkboard level set"
                            content="Binary checkboard level set for chan-vese, useful for segmenting backgrounds"
                        />
                    </IonItem>

                    {useCheckboard && (
                        <>
                            <IonItem>
                                <IonLabel>Checkboard Size: </IonLabel>
                                <IonInput
                                    type="number"
                                    inputMode="numeric"
                                    value={checkboardSize}
                                    onIonChange={(e: CustomEvent) =>
                                        handleValueChange('checkboardSize', e.detail.value!)
                                    }
                                    placeholder="Enter checkboard size"
                                />
                                <InfoPopover
                                    triggerId="checkboardSize"
                                    header="checkboard_size"
                                    content="Determinate the size of checkboard"
                                />
                            </IonItem>

                            <IonItem>
                                <IonLabel>Lowest intensity (Background): </IonLabel>
                                <IonCheckbox
                                    checked={backgroundAnnot}
                                    onIonChange={(e: CustomEvent) => setBackgroundAnnot(e.detail.checked)}
                                />
                                <InfoPopover
                                    triggerId="LowestCheckboard"
                                    header="Lowest Checkboard"
                                    content="Get lowest intensity mean value for the binary mask of the checkboard level set segmentation"
                                />
                            </IonItem>

                            <IonItem>
                                <IonButton onClick={applyCheckboardLevelSet}>Apply Checkboard Level Set</IonButton>
                            </IonItem>
                        </>
                    )}
                </>
            )}

            {/* Geodesic Parameters */}
            {method === 'geodesic' && (
                <>
                    <IonItem>
                        <IonLabel>Iterations: </IonLabel>
                        <IonInput
                            type="number"
                            inputMode="numeric"
                            value={iterations}
                            onIonChange={(e: CustomEvent) => handleValueChange('iterations', e.detail.value!)}
                            placeholder="Enter number of iterations"
                        />
                        <InfoPopover
                            triggerId="geodesicIterationsInfo"
                            header="Iterations"
                            content="More iterations allow the contour to evolve further until it reachs a maximum, usually around 150-300 iterations."
                        />
                    </IonItem>

                    <IonItem lines="none">
                        <IonText>Smoothing: </IonText>
                        <IonRange
                            min={0}
                            max={4}
                            step={1}
                            pin={true}
                            snaps={true}
                            value={smoothing}
                            onIonKnobMoveEnd={(e: CustomEvent) => handleValueChange('smoothing', e.detail.value!)}
                        />
                    </IonItem>

                    <IonItem>
                        <IonLabel>Threshold (%): </IonLabel>
                        <IonInput
                            type="number"
                            inputMode="decimal"
                            value={threshold}
                            onIonChange={(e: CustomEvent) =>
                                handleValueChange('threshold', parseFloat(e.detail.value!))
                            }
                            placeholder="Enter threshold value"
                            step="0.1" // Allows fractional percentage inputs
                            min="0" // Ensures input is non-negative
                            max="100" // Threshold percentage should logically be between 0 and 100
                        />
                        <InfoPopover
                            triggerId="geodesicThresholdInfo"
                            header="Threshold"
                            content="Threshold of the gaussian gradient image in percentage. Regions of the image with values below this threshold are treated as borders, halting the contour's evolution in those areas, i.e higher values leads to more halting of the contour. Typical value is around 40%."
                        />
                    </IonItem>

                    <IonItem>
                        <IonLabel>Sigma: </IonLabel>
                        <IonInput
                            type="number"
                            inputMode="decimal"
                            value={sigma.toString()}
                            onIonChange={(e: CustomEvent) => handleValueChange('sigma', e.detail.value!)}
                            placeholder="Enter threshold value"
                            step="0.5"
                        />
                        <InfoPopover
                            triggerId="geodesicSigmaInfo"
                            header="Sigma"
                            content="Sigma determines the Gaussian gradient used for edge detection in border identification. Ideally, the Sigma value should match the size of the edges."
                        />
                    </IonItem>

                    <IonItem>
                        <IonLabel>Balloon Force: </IonLabel>
                        <IonToggle
                            checked={balloonForce}
                            onIonChange={(e: CustomEvent) => handleValueChange('balloonForce', e.detail.checked)}
                        />
                        <InfoPopover
                            triggerId="geodesicBalloonInfo"
                            header="Balloon Force"
                            content="Balloon force expands or shrinks the contour. Enable for improved results in non-informative areas."
                        />
                    </IonItem>
                </>
            )}
        </IonGrid>
    );
};

export default ActiveContourCard;
