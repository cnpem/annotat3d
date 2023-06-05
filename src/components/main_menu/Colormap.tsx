import React, { useState } from 'react';
import { MenuItem } from './MenuItems';
import { colorPaletteOutline, colorPaletteSharp } from 'ionicons/icons';
import { IonAccordion, IonIcon, IonItem, IonLabel, IonList, IonRadioGroup, IonRadio, IonChip } from '@ionic/react';

/**
 * Colormap selector component
 * TODO : Need to implement the color map here later
 */
const Colormap: React.FC = () => {
    /**
     * colormap list
     */
    const items: MenuItem = {
        title: 'Colormap',
        subItems: ['Grey', 'Viridis', 'Hot', 'Cool', 'Spring', 'Summer', 'Ice'],
        iosIcon: colorPaletteOutline,
        mdIcon: colorPaletteSharp,
    };

    const [selected, setSelected] = useState<string>('Grey');

    return (
        <IonAccordion disabled={true}>
            <IonItem slot={'header'}>
                <IonIcon slot={'start'} ios={items.iosIcon} md={items.mdIcon} />
                <IonLabel>
                    {items.title}{' '}
                    <IonChip hidden={!selected} color="tertiary">
                        {selected}
                    </IonChip>{' '}
                </IonLabel>
            </IonItem>
            <IonList slot={'content'}>
                <IonRadioGroup value={selected} onIonChange={(e) => setSelected(e.detail.value)}>
                    {items.subItems.map((subItem) => {
                        return (
                            <IonItem slot={'content'} key={'_'}>
                                <IonLabel>{subItem}</IonLabel>
                                <IonRadio slot={'end'} value={subItem}></IonRadio>
                            </IonItem>
                        );
                    })}
                </IonRadioGroup>
            </IonList>
        </IonAccordion>
    );
};

export default Colormap;
