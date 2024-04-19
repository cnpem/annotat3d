import React, { Fragment, useEffect, useState } from 'react';
import { IonItem, IonLabel, IonCard, IonList, IonSelect, IonSelectOption } from '@ionic/react';
import { dispatch } from '../../../utils/eventbus';

const colorOptions = [
    'greys',
    'viridis',
    'inferno',
    'magma',
    'plasma',
    'earth',
    'electric',
    'jet',
    'hsv',
    'hot',
    'cool',
    'spring',
    'summer',
    'autumn',
    'winter',
    'bone',
    'copper',
    'YIGnBu',
    'greens',
    'YIOrRd',
    'bluered',
    'RdBu',
    'picnic',
    'rainbow',
    'portland',
    'blackbody',
    'warm',
    'cool',
    'rainbow-soft',
    'bathymetry',
    'cdom',
    'chlorophyll',
    'density',
    'freesurface-blue',
    'freesurface-red',
    'oxygen',
    'par',
    'phase',
    'salinity',
    'temperature',
    'turbidity',
    'velocity-blue',
    'velocity-green',
    'cubehelix',
];

const ColorPicker: React.FC = () => {
    const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
    useEffect(() => {
        console.log('Selected color has changed to: ', selectedColor);
        dispatch('ColorMapChanged', selectedColor);
    }, [selectedColor]);

    return (
        <Fragment>
            <IonList>
                <IonItem>
                    <IonLabel> Colormap</IonLabel>
                    <IonSelect
                        aria-label="Color Palette"
                        interface="popover"
                        placeholder="Select color palette"
                        value={selectedColor}
                        onIonChange={(e) => setSelectedColor(e.detail.value)}
                    >
                        {colorOptions.map((color) => (
                            <IonSelectOption key={color} value={color}>
                                {color}
                            </IonSelectOption>
                        ))}
                    </IonSelect>
                </IonItem>
            </IonList>
        </Fragment>
    );
};

export default ColorPicker;
