import React from 'react';
import { documentOutline, documentSharp } from 'ionicons/icons';
import { IonAccordion, IonIcon, IonItem, IonLabel, IonList } from '@ionic/react';

import { MenuItem } from '../MenuItems';
import FileLoadDialog from './FileLoadDialog';
import FileSaveDialog from './FileSaveDialog';

/**
 * File I/O component
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
    return (
        <IonAccordion>
            <IonItem slot={'header'}>
                <IonIcon slot={'start'} ios={items.iosIcon} md={items.mdIcon} />
                <IonLabel>{items.title}</IonLabel>
            </IonItem>
            <IonList slot={'content'}>
                <FileLoadDialog name={items.subItems[0]} />
                <FileSaveDialog name={items.subItems[1]} />
            </IonList>
        </IonAccordion>
    );
};

export default File;
