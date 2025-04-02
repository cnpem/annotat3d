import React, { useState, useRef, useEffect } from 'react';
import {
    IonButton,
    IonCardContent,
    IonCardHeader,
    IonLabel,
    IonNote,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonCard,
} from '@ionic/react';
import {
    waterOutline,
    removeCircleOutline,
    pricetagsOutline,
    gitCompareOutline,
    colorFillOutline,
    gridOutline,
    gitNetworkOutline,
} from 'ionicons/icons';
import './PaintToolbar.css';
import lassoCursor from '../../../../public/lasso_cursor.svg';
import snakesCursor from '../../../../public/snakes_cursor.svg';
import thresholdIcon from '../../../../public/threshold_icon.svg';

import MagicWandCard from './MagicWandCard';
import ThresholdCard from './ThresholdCard';
import MorphologyCard from './MorphologyCard';
import ActiveContourCard from './ActiveContourCard';
import WatershedCard from './WatershedCard';
import RemoveIslandsCard from './RemoveIslandsCard';
import QuantificationCard from './QuantificationCard';
import FgcCard from './FgcCard'; // Ensure FgcCard is imported
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
                        background: 'linear-gradient(135deg,rgba(60, 130, 252, 0.85),rgba(130, 177, 252, 0.85))',
                        margin: '0 1.5rem',
                        borderRadius: '16px',
                        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                        letterSpacing: '1px',
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
                    <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('watershed')} title="Watershed">
                            <IonIcon icon={waterOutline} />
                        </IonButton>
                        <IonNote className="small-note">Watershed</IonNote>
                    </IonCol>
                    <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('quantification')} title="Quantification">
                            <IonIcon icon={pricetagsOutline} />
                        </IonButton>
                        <IonNote className="small-note">Quantification</IonNote>
                    </IonCol>
                    <IonCol className="ion-text-center">
                        <IonButton onClick={() => handleButtonClick('fgc')} title="Fgc Tool">
                            <IonIcon icon={gitNetworkOutline} />
                        </IonButton>
                        <IonNote className="small-note">Fgc Tool</IonNote>
                    </IonCol>
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

                <div className={activeCard === 'fgc' ? 'visible' : 'hidden'}>
                    <FgcCard isVisible={activeCard === 'fgc'} />
                </div>
            </div>
        </IonCardContent>
    );
};

export default PaintToolbar;
