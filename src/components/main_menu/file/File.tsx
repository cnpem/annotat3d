import React, { useState, useEffect } from 'react';
import { documentOutline, documentSharp } from 'ionicons/icons';
import { IonAccordion, IonIcon, IonItem, IonLabel, IonList } from '@ionic/react';

import { MenuItem } from '../MenuItems';
import FileLoadDialog from './FileLoadDialog';
import FileSaveDialog from './FileSaveDialog';
import { sfetch } from '../../../utils/simplerequest';
import { useEventBus } from '../../../utils/eventbus';

import ComponentList from './ComponentList';

/**
 * File I/O and active components display
 * @constructor
 */
const File: React.FC = () => {
    /**
     * file items
     */
    const items: MenuItem = {
        title: 'Files',
        subItems: ['Load Files', 'Save Files'],
        iosIcon: documentOutline,
        mdIcon: documentSharp,
    };

    // State to track active components
    const [activeComponents, setActiveComponents] = useState<string[]>([]);

    // checking with the backend might be redundant, but is a safe method
    const checkActiveComponents = () => {
        void sfetch('POST', '/get_open_images', '', 'json').then((response: string[]) => {
            setActiveComponents(response);
            console.log(activeComponents);
        });
    };

    // event Bus to track label, image and superpixel changes
    useEventBus('LabelLoaded', () => {
        checkActiveComponents();
    });
    useEventBus('superpixelChanged', () => {
        checkActiveComponents();
    });
    useEventBus('ImageLoaded', () => {
        checkActiveComponents();
    });
    //Is there really a need to check annotation? Since it will be active when image is loaded
    useEventBus('annotationChanged', () => {
        checkActiveComponents();
    });
    useEventBus('labelChanged', () => {
        checkActiveComponents();
    });
    return (
        <IonAccordion>
            <IonItem slot={'header'}>
                <IonIcon slot={'start'} ios={items.iosIcon} md={items.mdIcon} />
                <IonLabel>{items.title}</IonLabel>
            </IonItem>
            <IonList slot={'content'}>
                {/* Wrap ComponentList in a div with a margin-bottom */}
                <div style={{ marginBottom: '8px' }}>
                    <ComponentList components_active={activeComponents} />
                </div>{' '}
                <FileLoadDialog name={items.subItems[0]} />
                <FileSaveDialog name={items.subItems[1]} />
            </IonList>
        </IonAccordion>
    );
};

export default File;
