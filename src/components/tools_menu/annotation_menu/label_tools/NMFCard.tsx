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
import { informationCircleOutline } from 'ionicons/icons';
import { sfetch } from '../../../../utils/simplerequest';
import { dispatch } from '../../../../utils/eventbus';
import LoadingComponent from '../../utils/LoadingComponent';

interface NMFCardProps {
    isVisible: boolean;
}

const NMFCard: React.FC<NMFCardProps> = ({ isVisible }) => {
    const [algorithm, setAlgorithm] = useState<string>('kmeans');
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingCompPS, setShowLoadingCompPS] = useState<boolean>(false);
    const [markerID, setMarkerId] = useState<number>(-1);

    const [anchorFinder, setAnchorFinder] = useState<string>('kmeans');
    const [isAnchorFinderOpen, setIsAnchorFinderOpen] = useState(false);

    const [numPhases, setNumPhases] = useState<number>(3);
    const [numRepresentativePoints, setNumRepresentativePoints] = useState<number>(5);
    const [numIterations, setNumIterations] = useState<number>(10);
    const [regularization, setRegularization] = useState<number>(0.00001);
    const [graphRegularization, setGraphRegularization] = useState<number>(0.5);
    const [windowSize, setWindowSize] = useState<number>(15);
    const [tolerance, setTolerance] = useState<number>(0.01);

    const [selectedDimension, setSelectedDimension] = useState<'2D' | '3D'>('2D');
    const [canContinue, setCanContinue] = useState<boolean>(true);
    const [useWholeImage, setUseWholeImage] = useState<boolean>(true);

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
            graphRegularization,
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
            setShowLoadingCompPS(true);
            const result = await sfetch('POST', '/nmf_apply/image', JSON.stringify(data), 'json');
            console.log('Backend response:', result);
        } catch (error) {
            console.error('Error applying nmf:', error);
            const typedError = error as Error;
            setShowLoadingCompPS(false);
            dispatch('watershedError', { error: typedError.message });
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

    return (
        <IonCard style={{ display: isVisible ? 'block' : 'none' }}>
            <IonCardContent>
                <IonList>
                    <LoadingComponent openLoadingWindow={showLoadingCompPS} loadingText={loadingMsg} />

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
                                    'Number of Phases: Specifies the number of resulting phases (Due to its nature, the algorithm will not maintain the original annotations in the current slice).'
                                )
                            }
                        >
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                    </IonItem>

                    <IonItem>
                        <IonLabel position="floating">Number of atoms</IonLabel>
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
                                    'Number of atoms: Defines how many atoms/basis are selected from the dataset to represent the underlying data distribution.'
                                )
                            }
                        >
                            <IonIcon icon={informationCircleOutline} />
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
                                    'Number of Iterations: Sets the maximum number of iterations during the optimization.'
                                )
                            }
                        >
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                    </IonItem>

                    <IonItem>
                        <IonLabel position="floating">Sparsity Regularization</IonLabel>
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
                                    'Sparsity Regularization: Improves the sparsity of the embedding, using the p=1/2 norm.'
                                )
                            }
                        >
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                    </IonItem>

                    <IonItem>
                        <IonLabel position="floating">Graph Regularization</IonLabel>
                        <IonInput
                            type="number"
                            value={graphRegularization}
                            onIonChange={(e) => setGraphRegularization(parseFloat(e.detail.value!))}
                        />
                        <IonButton
                            slot="end"
                            fill="clear"
                            onClick={(e) =>
                                openPopover(
                                    e,
                                    'Graph Regularization: Improves the embedding, using trace minimization.'
                                )
                            }
                        >
                            <IonIcon icon={informationCircleOutline} />
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
                            <IonIcon icon={informationCircleOutline} />
                        </IonButton>
                    </IonItem>
                </IonList>

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

export default NMFCard;
