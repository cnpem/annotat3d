import React from "react";
import {IonAccordion, IonAccordionGroup, IonIcon, IonItem, IonLabel} from "@ionic/react";
import {construct} from "ionicons/icons";

/**
 * Component that hold all the Sampling options
 */
const SamplingComp: React.FC = () => {
    return (
        <IonAccordionGroup multiple={true}>
            {/*Sampling menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Data</small></IonLabel>
                </IonItem>
            </IonAccordion>
            {/*Label menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Label</small></IonLabel>
                </IonItem>
            </IonAccordion>
            {/*Weight menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Weight</small></IonLabel>
                </IonItem>
            </IonAccordion>
            {/*Sampling menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Sampling</small></IonLabel>
                </IonItem>
            </IonAccordion>
        </IonAccordionGroup>
    );
}

export default SamplingComp;