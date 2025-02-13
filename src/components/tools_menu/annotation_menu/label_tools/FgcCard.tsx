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
} from '@ionic/react';
import { helpCircle } from 'ionicons/icons';
import { sfetch } from '../../../../utils/simplerequest';
import { dispatch } from '../../../../utils/eventbus';
import LoadingComponent from '../../utils/LoadingComponent';

interface FGCCardProps {
    isVisible: boolean;
}

const FgcCard: React.FC<FGCCardProps> = ({ isVisible }) => {
    const [algorithm, setAlgorithm] = useState<string>('kmeans');
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingCompPS, setShowLoadingCompPS] = useState<boolean>(false);
    const [markerID, setMarkerId] = useState<number>(-1);

    const [anchorFinder, setAnchorFinder] = useState<string>('kmeans');
    const [isAnchorFinderOpen, setIsAnchorFinderOpen] = useState(false);

    const [numPhases, setNumPhases] = useState<number>(3);
    const [numRepresentativePoints, setNumRepresentativePoints] = useState<number>(5);
    const [numIterations, setNumIterations] = useState<number>(100);
    const [regularization, setRegularization] = useState<number>(1);
    const [smoothRegularization, setSmoothRegularization] = useState<number>(0.5);
    const [windowSize, setWindowSize] = useState<number>(3);
    const [tolerance, setTolerance] = useState<number>(0.01);

    const [selectedDimension, setSelectedDimension] = useState<'2D' | '3D'>('2D');
    const [canContinue, setCanContinue] = useState<boolean>(false);
    const [useWholeImage, setUseWholeImage] = useState<boolean>(false);

    const [popover, setPopover] = useState<any>(null);

    if (!isVisible) return null;

    const handleApply = async () => {
        if (!canContinue) {
            setCanContinue(true);
            return;
        }

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
            windowSize,
            tolerance,
            useWholeImage,
            dimension: selectedDimension.toLowerCase(),
            current_thresh_marker: markerID,
            current_slice: sliceValue,
            current_axis: sliceName,
            label: selectedLabel,
        };

        try {
            console.log('Sending data to backend:', data);
            const result = await sfetch('POST', '/fgc_apply/image', JSON.stringify(data), 'json');
            console.log('Backend response:', result);

            if (selectedDimension === '2D') {
                dispatch('annotationChanged', null);
            } else dispatch('labelChanged', '');

            setShowLoadingCompPS(true);
        } catch (error) {
            console.error('Error applying watershed:', error);
            const typedError = error as Error;
            setShowLoadingCompPS(false);
            dispatch('watershedError', { error: typedError.message });
        }
        setShowLoadingCompPS(false);
    };

    const openPopover = (event: any, info: string) => {
        setPopover({ event, info });
    };

    const closePopover = () => {
        setPopover(null);
    };

    return (
        <IonCard style={{ display: isVisible ? 'block' : 'none' }}>
            <IonCardContent>
                <IonList>
                    <LoadingComponent openLoadingWindow={showLoadingCompPS} loadingText={loadingMsg} />

                    <IonItem button onClick={() => setIsAnchorFinderOpen(!isAnchorFinderOpen)}>
                        <IonLabel>Anchor Finder</IonLabel>
                        <IonButton
                            slot="end"
                            fill="clear"
                            onClick={(e) =>
                                openPopover(
                                    e,
                                    'Anchor Finder: Determines the method used to select anchor points. "Random" selects anchor points randomly, while "K-Means" uses the K-Means algorithm for better representation of the dataset.'
                                )
                            }
                        >
                            <IonIcon icon={helpCircle} />
                        </IonButton>
                    </IonItem>
                    {isAnchorFinderOpen && (
                        <>
                            {/* Separate Use Whole Image Toggle */}
                            <IonItem>
                                <IonLabel>Use Whole Image</IonLabel>
                                <IonToggle
                                    checked={useWholeImage}
                                    onIonChange={(e) => setUseWholeImage(e.detail.checked)}
                                />
                                <IonButton
                                    slot="end"
                                    fill="clear"
                                    onClick={(e) =>
                                        openPopover(
                                            e,
                                            'Use Whole Image: When enabled, the algorithm will process the entire image instead of specific slices or regions.'
                                        )
                                    }
                                >
                                    <IonIcon icon={helpCircle} />
                                </IonButton>
                            </IonItem>
                        </>
                    )}

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
                                openPopover(
                                    e,
                                    'Number of Phases: Specifies the number of distinct phases or stages the algorithm will use during the graph construction for clustering.'
                                )
                            }
                        >
                            <IonIcon icon={helpCircle} />
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
                                openPopover(
                                    e,
                                    'Number of Representative Points: Defines how many anchor points are selected from the dataset to represent the underlying data distribution.'
                                )
                            }
                        >
                            <IonIcon icon={helpCircle} />
                        </IonButton>
                    </IonItem>

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
                                openPopover(
                                    e,
                                    'Number of Iterations: Sets the maximum number of iterations the algorithm will perform when refining the anchor graph.'
                                )
                            }
                        >
                            <IonIcon icon={helpCircle} />
                        </IonButton>
                    </IonItem>

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
                            onClick={(e) =>
                                openPopover(
                                    e,
                                    'Regularization: Introduces a penalty term to the objective function to prevent overfitting by smoothing the graph.'
                                )
                            }
                        >
                            <IonIcon icon={helpCircle} />
                        </IonButton>
                    </IonItem>

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
                                openPopover(
                                    e,
                                    'Smooth Regularization: Controls the level of smoothness applied to the graph. A higher value results in a smoother graph.'
                                )
                            }
                        >
                            <IonIcon icon={helpCircle} />
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
                            onClick={(e) =>
                                openPopover(
                                    e,
                                    'Window Size: Determines the size of the window used during processing. Larger window sizes include more neighbors in the computation.'
                                )
                            }
                        >
                            <IonIcon icon={helpCircle} />
                        </IonButton>
                    </IonItem>

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
                                    'Tolerance for Convergence: Defines the threshold for convergence. The algorithm stops when the change between iterations is less than this value.'
                                )
                            }
                        >
                            <IonIcon icon={helpCircle} />
                        </IonButton>
                    </IonItem>
                </IonList>

                <IonButton expand="block" onClick={handleApply}>
                    Generate Annotations
                </IonButton>
            </IonCardContent>
        </IonCard>
    );
};

export default FgcCard;
