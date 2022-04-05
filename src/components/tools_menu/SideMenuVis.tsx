import React, {useState} from "react";
import {IonCard, IonCardContent, IonRange, IonIcon} from "@ionic/react";
import {moon, sunny} from "ionicons/icons";
import {dispatch} from "../../utils/eventbus";

const SideMenuVis: React.FC = () => {

    const [contrast, setContrast] = useState({
        lower: 10,
        upper: 90
    });
    return(
        <React.Fragment>
            <IonCard>
                <IonCardContent>
                    <IonRange pin={true} debounce={300}
                        value={ {lower: contrast.lower, upper: contrast.upper} } dualKnobs={true} onIonChange={ (e) => {
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
