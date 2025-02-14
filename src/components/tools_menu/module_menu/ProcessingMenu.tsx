import React, { useState } from 'react';
import { IonAccordion, IonAccordionGroup, IonItem, IonLabel } from '@ionic/react';
import SmoothingMenu from './SmoothingMenu';
import SegmentationMenu from './SegmentationMenu';
import { dispatch } from '../../../utils/eventbus';
import { useStorageState } from 'react-storage-hooks';

const ProcessingMenu: React.FC = () => {
    // Initialize state to control which accordion is open (default to "smoothing")
    const [activeAccordion, setActiveAccordion] = useStorageState<string | undefined>(
        sessionStorage,
        'processingAccordiong',
        undefined
    );

    const accordionGroupChange = (event: CustomEvent<{ value: string | undefined }>) => {
        const selectedValue = event.detail.value;

        if (selectedValue === 'smoothing') {
            dispatch('canvasModeChanged', 'imaging');
            console.log('Smoothing Module changed to:', 'imaging');
            setActiveAccordion(selectedValue); // Update state
        } else if (selectedValue === 'segmentation') {
            dispatch('canvasModeChanged', 'drawing');
            console.log('Segmentation Module changed to:', 'drawing');
            setActiveAccordion(selectedValue); // Update state
        }
    };

    return (
        // Pass the state as the controlled value for IonAccordionGroup
        <IonAccordionGroup value={activeAccordion} onIonChange={accordionGroupChange}>
            <IonAccordion value="smoothing">
                <IonItem slot="header">
                    <IonLabel>Smoothing</IonLabel>
                </IonItem>
                <div className="ion-padding" slot="content">
                    <SmoothingMenu />
                </div>
            </IonAccordion>

            <IonAccordion value="segmentation">
                <IonItem slot="header">
                    <IonLabel>Segmentation</IonLabel>
                </IonItem>
                <div className="ion-padding" slot="content">
                    <SegmentationMenu />
                </div>
            </IonAccordion>
        </IonAccordionGroup>
    );
};

export default ProcessingMenu;
