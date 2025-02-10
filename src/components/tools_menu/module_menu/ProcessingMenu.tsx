import React, { useState } from 'react';
import { IonAccordionGroup, IonAccordion, IonItem, IonLabel } from '@ionic/react';
import SmoothingMenu from './SmoothingMenu';
import SegmentationMenu from './SegmentationMenu';

const ProcessingMenu: React.FC = () => {
    // Set the default expanded accordion to null (none is open)
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

    const handleAccordionChange = (event: CustomEvent) => {
        // event.detail.value will contain the value of the currently active accordion, or null if none are open.
        setActiveAccordion(event.detail.value);
    };

    return (
        <IonAccordionGroup value={activeAccordion} onIonChange={handleAccordionChange} multiple={false}>
            <IonAccordion value="smoothing">
                <IonItem slot="header">
                    <IonLabel>Smoothing</IonLabel>
                </IonItem>
                <div slot="content">
                    <SmoothingMenu />
                </div>
            </IonAccordion>
            <IonAccordion value="segmentation">
                <IonItem slot="header">
                    <IonLabel>Segmentation</IonLabel>
                </IonItem>
                <div slot="content">
                    <SegmentationMenu />
                </div>
            </IonAccordion>
        </IonAccordionGroup>
    );
};

export default ProcessingMenu;
