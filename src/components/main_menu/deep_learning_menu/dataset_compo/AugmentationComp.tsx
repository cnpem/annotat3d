import React from "react";
import {
    IonAccordion,
    IonAccordionGroup,
    IonCheckbox,
    IonIcon,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList
} from "@ionic/react";
import {construct} from "ionicons/icons";
import {AugmentationInterface} from "./DatasetInterfaces";

interface CheckedElements {
    checkedVector: AugmentationInterface[];
    onCheckedVector: (index: number) => void;
}

/**
 * Component that hold all the Argumentation options
 */
const Augmentation: React.FC<CheckedElements> = ({checkedVector, onCheckedVector}) => {

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
                        <IonLabel>Augment with Vertical Flip</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[0].isChecked}
                            onIonChange={() => onCheckedVector(0)}/>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Horizontal Flip menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Horizontal Flip</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>Augment with Horizontal Flip</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[1].isChecked}
                            onIonChange={() => onCheckedVector(1)}/>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Rotate 90 Degrees menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Rotate 90 Degrees</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>Augment with Vertical Flip</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[2].isChecked}
                            onIonChange={() => onCheckedVector(2)}/>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
            {/*Rotate -90 Degrees menu option*/}
            <IonAccordion>
                <IonItem slot={"header"}>
                    <IonIcon slot={"start"} icon={construct}/>
                    <IonLabel><small>Rotate -90 Degrees</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>Augment with Rotate -90 Degrees</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[3].isChecked}
                            onIonChange={() => onCheckedVector(3)}/>
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
                        <IonLabel>Augment with Contrast</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[4].isChecked}
                            onIonChange={() => onCheckedVector(4)}/>
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
                        <IonLabel>Augment with Linear Contrast</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[5].isChecked}
                            onIonChange={() => onCheckedVector(5)}/>
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
                        <IonLabel>Augment with Dropout</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[6].isChecked}
                            onIonChange={() => onCheckedVector(6)}/>
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
                        <IonLabel>Augment with Gaussian Blur</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[7].isChecked}
                            onIonChange={() => onCheckedVector(7)}/>
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
                        <IonLabel>Augment with Average Blur</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[8].isChecked}
                            onIonChange={() => onCheckedVector(8)}/>
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
                        <IonLabel>Augment with Additive Poisson</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[9].isChecked}
                            onIonChange={() => onCheckedVector(9)}/>
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
                        <IonLabel>Augment with Elastic Deformation</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[10].isChecked}
                            onIonChange={() => onCheckedVector(10)}/>
                    </IonItem>
                    <IonItemDivider/>
                </IonList>
            </IonAccordion>
        </IonAccordionGroup>
    );
}

export default Augmentation;
