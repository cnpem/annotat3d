import React, {useState} from "react";
import {MenuItem} from "./MenuItems";
import {colorPaletteOutline, colorPaletteSharp} from "ionicons/icons";
import {IonAccordion, IonIcon, IonItem, IonLabel, IonList, IonRadioGroup, IonRadio, IonItemDivider} from "@ionic/react";

const Colormap : React.FC = () => {
    const items : MenuItem = {
        title: 'Colormap',
        subItems: [
            'Viridis',
            'Grey',
            'Hot',
            'Cool',
            'Spring',
            'Summer',
            'Ice'
        ],
        iosIcon: colorPaletteOutline,
        mdIcon: colorPaletteSharp
    };

    const [selected, setSelected] = useState<string>('Grey');

    return (
        <IonAccordion>
            <IonItem slot={"header"}>
                <IonIcon slot={"start"} ios={items.iosIcon} md={items.mdIcon}/>
                <IonLabel>{items.title}</IonLabel>
            </IonItem>
            <IonList slot={"content"}>
                <IonRadioGroup value={selected} onIonChange={e => setSelected(e.detail.value)}>
                    {items.subItems.map((subItem) => {
                        return (
                            <IonItem>
                                <IonLabel>{subItem}</IonLabel>
                                <IonRadio slot={"end"} value={subItem}></IonRadio>
                            </IonItem>
                        );
                    })}
                </IonRadioGroup>
                <IonItemDivider>Your Selection</IonItemDivider>
                <IonItem>{selected ?? '(none selected)'}</IonItem>
            </IonList>
        </IonAccordion>
    );
};

export default Colormap;