import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {IonCard, IonCardContent, IonRange, IonIcon} from "@ionic/react";
import {moon, sunny} from "ionicons/icons";
import {dispatch} from "../../utils/eventbus";
import { useStorageState } from 'react-storage-hooks';

const SideMenuVis: React.FC = () => {

    const [contrast, setContrast] = useStorageState(localStorage, 'contrast', {
        lower: 10,
        upper: 90
    });

    const contrastRangeRef = useRef<HTMLIonRangeElement | null>(null);

    //for some weird reason, IonRange is ignoring value when using the value property,
    //so I am manually setting it.
    useEffect(() => {
        if (contrastRangeRef) {
            setTimeout(() => {
            contrastRangeRef.current!.value = {
                lower: contrast.lower,
                upper: contrast.upper
            }; 
        }, 20);
    }
    }, [contrastRangeRef]);

    return(
        <React.Fragment>
            <IonCard>
                <IonCardContent>
                    <IonRange ref={contrastRangeRef} pin={true} debounce={300}
                        dualKnobs={true} onIonChange={ (e) => {
                            if (e.detail.value) {
                                const range = e.detail.value as any;
                                setContrast(range);
                                dispatch('contrastChanged', [range.lower/100, range.upper/100]);
                            }
                        }}>
                        <IonIcon slot='start' icon={sunny}></IonIcon>
                        <IonIcon slot='end' icon={moon}></IonIcon>
                    </IonRange>
                </IonCardContent>
            </IonCard>
        </React.Fragment>
    );
}

export default SideMenuVis;
