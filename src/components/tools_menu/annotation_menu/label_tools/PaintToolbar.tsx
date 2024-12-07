import React, { useState, useRef, useEffect } from 'react';
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonCardHeader,
} from '@ionic/react';
import {
    createOutline,
    colorFilterOutline,
    constructOutline,
    waterOutline,
    funnelOutline,
    removeCircleOutline,
    pricetagsOutline,
    gitCompareOutline,
    colorFillOutline,
} from 'ionicons/icons';
import './PaintToolbar.css'; // Ensure this path is correct
import lassoCursor from '../../../../public/lasso_cursor.svg';

import MagicWandCard from './MagicWandCard'; // Ensure this path is correct
import ThresholdCard from './ThresholdCard'; // Ensure this path is correct
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
        if (cardType === 'lasso') {
            dispatch('ChangeStateBrush', 'lasso');
        } else {
            dispatch('ChangeStateBrush', 'draw_brush');
        }
    };

    useEffect(() => {
        if (activeCard && contentRef.current) {
            contentRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
    }, [activeCard]);

    return (
        <IonCardContent className="paint-toolbar" scroll-y="false">
            <IonCardHeader>
                <div style={{ fontWeight: 600, fontSize: 18, textAlign: 'center' }}>Label tools</div>
            </IonCardHeader>
            <IonGrid fixed={true}>
                <IonRow>
                    <IonCol>
                        <IonButton onClick={() => handleButtonClick('magicWand')} title="Magic Wand">
                            <IonIcon icon={colorFillOutline} />
                        </IonButton>
                    </IonCol>
                    <IonCol>
                        <IonButton onClick={() => handleButtonClick('lasso')} title="Lasso tool">
                            <IonIcon size="medium" src={lassoCursor} />
                        </IonButton>
                    </IonCol>
                    <IonCol>
                        <IonButton onClick={() => handleButtonClick('snakes')} title="Snakes tool">
                            <IonIcon icon={colorFilterOutline} />
                        </IonButton>
                    </IonCol>
                </IonRow>
                <IonRow>
                    <IonCol>
                        <IonButton onClick={() => handleButtonClick('threshold')} title="Threshold">
                            <IonIcon icon={funnelOutline} />
                        </IonButton>
                    </IonCol>
                    <IonCol>
                        <IonButton onClick={() => handleButtonClick('morphology')} title="Morphology">
                            <IonIcon icon={constructOutline} />
                        </IonButton>
                    </IonCol>
                    <IonCol>
                        <IonButton onClick={() => handleButtonClick('watershed')} title="Watershed">
                            <IonIcon icon={waterOutline} />
                        </IonButton>
                    </IonCol>
                </IonRow>
                <IonRow>
                    <IonCol>
                        <IonButton onClick={() => handleButtonClick('removeIsland')} title="Remove Islands">
                            <IonIcon icon={removeCircleOutline} />
                        </IonButton>
                    </IonCol>
                    <IonCol>
                        <IonButton onClick={() => handleButtonClick('quantification')} title="Quantification">
                            <IonIcon icon={pricetagsOutline} />
                        </IonButton>
                    </IonCol>
                    <IonCol>
                        <IonButton onClick={() => handleButtonClick('objectSeparation')} title="Object separation">
                            <IonIcon icon={gitCompareOutline} />
                        </IonButton>
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
                    <IonCard>
                        <IonCardContent>
                            <IonList>
                                <IonItem button>Snakes Option 1</IonItem>
                                <IonItem button>Snakes Option 2</IonItem>
                                <IonItem button>Snakes Option 3</IonItem>
                            </IonList>
                        </IonCardContent>
                    </IonCard>
                </div>

                <div className={activeCard === 'morphology' ? 'visible' : 'hidden'}>
                    <IonCard>
                        <IonCardContent>
                            <IonList>
                                <IonItem button>Morphology Option 1</IonItem>
                                <IonItem button>Morphology Option 2</IonItem>
                                <IonItem button>Morphology Option 3</IonItem>
                            </IonList>
                        </IonCardContent>
                    </IonCard>
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
