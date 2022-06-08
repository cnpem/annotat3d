import React from "react";
import {IonAccordion, IonAccordionGroup, IonIcon, IonItem, IonItemDivider, IonLabel, IonList} from "@ionic/react";
import {construct} from "ionicons/icons";

/**
 * Component that hold all the Argumentation options
 */
const ArgumentationComp: React.FC = () => {
    return (
        <IonAccordionGroup multiple={true}>
            {/*Argumentation menu option*/}
            {/*Vertical Flip menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Vertical Flip</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>bla ?</IonLabel>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Rotate 90 Degrees menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Rotate -90 Degrees</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>bla ?</IonLabel>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Rotate -90 Degrees menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Rotate 90 Degrees</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>bla ?</IonLabel>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Contrast menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Contrast Degrees</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>bla ?</IonLabel>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Linear Contrast menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Linear Contrast</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>bla ?</IonLabel>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Dropout menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Dropout</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>bla ?</IonLabel>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Gaussian Blur menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Gaussian Blur</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>bla ?</IonLabel>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Average Blur menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Average Blur</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>bla ?</IonLabel>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Additive Poisson menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Additive Poisson</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>bla ?</IonLabel>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Elastic Deformation menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Elastic Deformation</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>bla ?</IonLabel>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
        </IonAccordionGroup>
    );
}

export default ArgumentationComp;
