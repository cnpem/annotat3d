import React, { useState, useRef, useEffect } from 'react';
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonCardHeader,
    IonLabel,
    IonNote,
} from '@ionic/react';
import {
    waterOutline,
    removeCircleOutline,
    pricetagsOutline,
    gitCompareOutline,
    colorFillOutline,
    gridOutline,
} from 'ionicons/icons';
import './PaintToolbar.css'; // Ensure this path is correct
import lassoCursor from '../../../../public/lasso_cursor.svg';
import snakesCursor from '../../../../public/snakes_cursor.svg';
import thresholdIcon from '../../../../public/threshold_icon.svg';

import MagicWandCard from './MagicWandCard'; // Ensure this path is correct
import ThresholdCard from './ThresholdCard'; // Ensure this path is correct
import MorphologyCard from './MorphologyCard'; // Ensure this path is correct
import ActiveContourCard from './ActiveContourCard'; // Ensure this path is correct

import WatershedCard from './WatershedCard'; // Ensure this path is correct
import RemoveIslandsCard from './RemoveIslandsCard';
import QuantificationCard from './QuantificationCard'; // Ensure QuantificationCard is imported
import ObjectSeparationCard from './ObjectSeparationCard'; // Import the ObjectSeparationCard
import { dispatch } from '../../../../utils/eventbus';

const PaintToolbar: React.FC = () => {
    const [activeCard, setActiveCard] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleButtonClick = (cardType: string) => {
        setActiveCard(activeCard === cardType ? null : cardType);
    };

    useEffect(() => {
        if (activeCard && contentRef.current) {
            contentRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
        if (activeCard === 'lasso') {
            dispatch('ChangeStateBrush', 'lasso');
        } else if (!(activeCard === 'snakes' || activeCard === 'magicWand')) {
            dispatch('ChangeStateBrush', 'draw_brush');
        }
    }, [activeCard]);

    return (
        <IonCardContent className="paint-toolbar" scroll-y="false">
            <IonCardHeader>
                <IonLabel
                    style={{
                        fontWeight: 700,
                        fontSize: '1.2rem',
                        textAlign: 'center',
                        display: 'block',
                        color: 'white',
                        background:
                            'linear-gradient(135deg,rgba(60, 130, 252, 0.85),rgba(130, 177, 252, 0.85)' /* Smooth gradient */,
                        padding: '0.5rem 1rem' /* Adds padding */,
                        borderRadius: '16px' /* Rounded edges */,
                        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' /* Soft shadow */,
                        letterSpacing: '1px' /* Spacing for a clean look */,
                    }}
                >
                    Label Tools
                </IonLabel>
            </IonCardHeader>
            <IonGrid fixed={true}>
                <IonRow>
                    <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('magicWand')} title="Magic Wand">
                            <IonIcon icon={colorFillOutline} />
                        </IonButton>
                        <IonNote className="small-note">Magic Wand</IonNote>
                    </IonCol>
                    <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('lasso')} title="Lasso Tool">
                            <IonIcon size="medium" src={lassoCursor} />
                        </IonButton>
                        <IonNote className="small-note">Lasso Tool</IonNote>
                    </IonCol>
                    <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('snakes')} title="Snakes Tool">
                            <IonIcon src={snakesCursor} />
                        </IonButton>
                        <IonNote className="small-note">Snakes Tool</IonNote>
                    </IonCol>
                </IonRow>
                <IonRow>
                    <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('threshold')} title="Threshold">
                            <IonIcon src={thresholdIcon} />
                        </IonButton>
                        <IonNote className="small-note">Threshold</IonNote>
                    </IonCol>
                    <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('morphology')} title="Morphology">
                            <IonIcon icon={gridOutline} />
                        </IonButton>
                        <IonNote className="small-note">Morphology</IonNote>
                    </IonCol>
                    <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('removeIsland')} title="Remove Islands">
                            <IonIcon icon={removeCircleOutline} />
                        </IonButton>
                        <IonNote className="small-note">Trim Islands</IonNote>
                    </IonCol>
                </IonRow>
                <IonRow>
                    <IonCol className="ion-text-center"></IonCol>
                    <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('quantification')} title="Quantification">
                            <IonIcon icon={pricetagsOutline} />
                        </IonButton>
                        <IonNote className="small-note">Quantification</IonNote>
                    </IonCol>
                    <IonCol className="ion-text-center"></IonCol>
                    {/*                     <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('objectSeparation')} title="Object Separation">
                            <IonIcon icon={gitCompareOutline} />
                        </IonButton>
                        <IonNote className="small-note">Split</IonNote>
                    </IonCol>
                    <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('watershed')} title="Watershed">
                            <IonIcon icon={waterOutline} />
                        </IonButton>
                        <IonNote className="small-note">Watershed</IonNote>
                    </IonCol> */}
                </IonRow>
            </IonGrid>

            <div ref={contentRef}>
                <div className={activeCard === 'magicWand' ? 'visible' : 'hidden'}>
                    <MagicWandCard isVisible={activeCard === 'magicWand'} />
                </div>

                <div className={activeCard === 'lasso' ? 'visible' : 'hidden'}>
                    <IonCard></IonCard>
                </div>

                <div className={activeCard === 'snakes' ? 'visible' : 'hidden'}>
                    <ActiveContourCard isVisible={activeCard === 'snakes'} />
                </div>

                <div className={activeCard === 'morphology' ? 'visible' : 'hidden'}>
                    <MorphologyCard isVisible={activeCard === 'morphology'} />
                </div>

                <div className={activeCard === 'watershed' ? 'visible' : 'hidden'}>
                    <WatershedCard isVisible={activeCard === 'watershed'} />
                </div>

                <div className={activeCard === 'threshold' ? 'visible' : 'hidden'}>
                    <ThresholdCard isVisible={activeCard === 'threshold'} />
                </div>

                <div className={activeCard === 'removeIsland' ? 'visible' : 'hidden'}>
                    <RemoveIslandsCard isVisible={activeCard === 'removeIsland'} />
                </div>

                <div className={activeCard === 'quantification' ? 'visible' : 'hidden'}>
                    <QuantificationCard isVisible={activeCard === 'quantification'} />
                </div>

                <div className={activeCard === 'objectSeparation' ? 'visible' : 'hidden'}>
                    <ObjectSeparationCard isVisible={activeCard === 'objectSeparation'} />
                </div>
            </div>
        </IonCardContent>
    );
};

export default PaintToolbar;
