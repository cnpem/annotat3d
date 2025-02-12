import React from 'react';
import {
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
    // If available, you can import AccordionGroupCustomEvent from '@ionic/react'
} from '@ionic/react';
import SmoothingMenu from './SmoothingMenu';
import SegmentationMenu from './SegmentationMenu';
import { dispatch } from '../../../utils/eventbus';

const ProcessingMenu: React.FC = () => {
    // Using a standard CustomEvent type for the accordion change event.
    // Adjust the type if your Ionic version exports AccordionGroupCustomEvent.
    const accordionGroupChange = (event: CustomEvent<{ value: string | undefined }>) => {
        const selectedValue = event.detail.value;
        if (selectedValue === 'smoothing') {
            dispatch('canvasModeChanged', 'imaging');
            console.log('Smoothing Module changed to:', 'imaging');
        } else if (selectedValue === 'segmentation') {
            dispatch('canvasModeChanged', 'drawing');
            console.log('Smoothing Module changed to:', 'drawing');
        }
    };

    return (
        <IonAccordionGroup onIonChange={accordionGroupChange}>
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
