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

    /* This hook ensures that when the activeCard state changes, 
    the page scrolls to the new content. The effect triggers the scrollIntoView method, 
    which scrolls the page to the start of the new content area.

    CSS Classes for Visibility and div: By toggling between visible and hidden CSS classes, 
    the solution maintains the scroll position without jumping back up when the content changes. 
    The hidden content is not removed from the DOM, preventing the page from scrolling back up.
    */
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
                        <IonButton onClick={() => handleButtonClick('labeling')} title="Object individualization">
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
                    <IonCard>
                        <IonCardContent>
                            <IonList>
                                <IonItem button>Watershed Option 1</IonItem>
                                <IonItem button>Watershed Option 2</IonItem>
                                <IonItem button>Watershed Option 3</IonItem>
                            </IonList>
                        </IonCardContent>
                    </IonCard>
                </div>

                <div className={activeCard === 'threshold' ? 'visible' : 'hidden'}>
                    <ThresholdCard isVisible={activeCard === 'magicWand'} />
                </div>

                <div className={activeCard === 'removeIsland' ? 'visible' : 'hidden'}>
                    <IonCard>
                        <IonCardContent>
                            <IonList>
                                <IonItem button>Remove Island Option 1</IonItem>
                                <IonItem button>Remove Island Option 2</IonItem>
                                <IonItem button>Remove Island Option 3</IonItem>
                            </IonList>
                        </IonCardContent>
                    </IonCard>
                </div>

                <div className={activeCard === 'labeling' ? 'visible' : 'hidden'}>
                    <IonCard>
                        <IonCardContent>
                            <IonList>
                                <IonItem button>Labeling Option 1</IonItem>
                                <IonItem button>Labeling Option 2</IonItem>
                                <IonItem button>Labeling Option 3</IonItem>
                            </IonList>
                        </IonCardContent>
                    </IonCard>
                </div>

                <div className={activeCard === 'objectSeparation' ? 'visible' : 'hidden'}>
                    <IonCard>
                        <IonCardContent>
                            <IonList>
                                <IonItem button>Object Separation Option 1</IonItem>
                                <IonItem button>Object Separation Option 2</IonItem>
                                <IonItem button>Object Separation Option 3</IonItem>
                            </IonList>
                        </IonCardContent>
                    </IonCard>
                </div>
            </div>
        </IonCardContent>
    );
};

export default PaintToolbar;
