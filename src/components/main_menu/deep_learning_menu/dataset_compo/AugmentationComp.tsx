import React, {Fragment} from "react";
import {
    IonAccordion,
    IonAccordionGroup,
    IonCheckbox,
    IonIcon, IonInput,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList, IonRange
} from "@ionic/react";
import {construct} from "ionicons/icons";
import {AugmentationInterface, IonRangeElement} from "./DatasetInterfaces";

interface CheckedElements {
    checkedVector: AugmentationInterface[];
    onCheckedVector: (index: number) => void;

    ionRangeVec: IonRangeElement[];
    onIonRangeVec: (newRangeVal: number, index: number) => void;
}

interface MenuContentRangeInterface {
    indexMin: number
    indexMax: number
    ionRangeVec: IonRangeElement[];
    onIonRangeVec: (newRangeVal: number, index: number) => void;
}

/**
 * Internal component that create the range content for each menu in Argumentation menu
 * @param {IonRangeElement[]} ionRangeVec - vector that contains the ion-range objects
 * @param {(newRangeVal: number, index: number) => void} onIonRangeVec - setter for ionRangeVec
 * @param {number} indexMin - number that represents the first index of ion-range
 * @param {number} indexMax - number that represents the second index of ion-range
 */
const MenuContentRange: React.FC<MenuContentRangeInterface> = ({ionRangeVec, onIonRangeVec, indexMin, indexMax}) => {

    return (
        <Fragment>
            <IonItem>
                <IonLabel>Min</IonLabel>
                <IonRange
                    min={ionRangeVec[indexMin].ionRangeLimit.minRange}
                    max={ionRangeVec[indexMin].ionRangeLimit.maxRange}
                    value={ionRangeVec[indexMin].actualRangeVal}
                    step={0.01}
                    onIonChange={(e: CustomEvent) => {
                        onIonRangeVec(e.detail.value, indexMin)
                    }}/>
                <IonLabel>Max</IonLabel>
                <IonRange
                    min={ionRangeVec[indexMax].ionRangeLimit.minRange}
                    max={ionRangeVec[indexMax].ionRangeLimit.maxRange}
                    value={ionRangeVec[indexMax].actualRangeVal}
                    step={0.01}
                    onIonChange={(e: CustomEvent) => {
                        onIonRangeVec(e.detail.value, indexMax)
                    }}/>
            </IonItem>
            <IonItem>
                <IonInput
                    type={"number"}
                    min={ionRangeVec[indexMin].ionRangeLimit.minRange}
                    max={ionRangeVec[indexMin].ionRangeLimit.maxRange}
                    clearInput value={Math.round(ionRangeVec[indexMin].actualRangeVal * 100) / 100}
                    onIonChange={(e: CustomEvent) => onIonRangeVec(e.detail.value, indexMin)}/>
                <IonInput
                    type={"number"}
                    min={ionRangeVec[indexMax].ionRangeLimit.minRange}
                    max={ionRangeVec[indexMax].ionRangeLimit.maxRange}
                    clearInput value={Math.round(ionRangeVec[indexMax].actualRangeVal * 100) / 100}
                    onIonChange={(e: CustomEvent) => onIonRangeVec(e.detail.value, indexMax)}/>
            </IonItem>
        </Fragment>
    );
}

/**
 * Component that hold all the Argumentation options
 */
const Augmentation: React.FC<CheckedElements> = ({checkedVector, onCheckedVector, ionRangeVec, onIonRangeVec}) => {
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
                    <IonLabel><small>Contrast</small></IonLabel>
                </IonItem>
                <IonList slot={"content"}>
                    <IonItem>
                        <IonLabel>Augment with Contrast</IonLabel>
                        <IonCheckbox
                            checked={checkedVector[4].isChecked}
                            onIonChange={() => onCheckedVector(4)}/>
                    </IonItem>
                    <IonItem>
                        <IonLabel>{ionRangeVec[0].ionRangeName}</IonLabel>
                    </IonItem>
                    <MenuContentRange
                        ionRangeVec={ionRangeVec}
                        onIonRangeVec={onIonRangeVec}
                        indexMin={0} indexMax={1}/>
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
                    <IonItem>
                        <IonLabel>{ionRangeVec[2].ionRangeName}</IonLabel>
                    </IonItem>
                    <MenuContentRange
                        ionRangeVec={ionRangeVec}
                        onIonRangeVec={onIonRangeVec}
                        indexMin={2} indexMax={3}/>
                    <IonItemDivider/>
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
                    <IonItem>
                        <IonLabel>{ionRangeVec[4].ionRangeName}</IonLabel>
                    </IonItem>
                    <MenuContentRange
                        ionRangeVec={ionRangeVec}
                        onIonRangeVec={onIonRangeVec}
                        indexMin={4} indexMax={5}/>
                    <IonItemDivider/>
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
                    <IonItem>
                        <IonLabel>{ionRangeVec[6].ionRangeName}</IonLabel>
                    </IonItem>
                    <MenuContentRange
                        ionRangeVec={ionRangeVec}
                        onIonRangeVec={onIonRangeVec}
                        indexMin={6} indexMax={7}/>
                    <IonItemDivider/>
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
                    <IonItem>
                        <IonLabel>{ionRangeVec[8].ionRangeName}</IonLabel>
                    </IonItem>
                    <MenuContentRange
                        ionRangeVec={ionRangeVec}
                        onIonRangeVec={onIonRangeVec}
                        indexMin={8} indexMax={9}/>
                    <IonItemDivider/>
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
                    <IonItem>
                        <IonLabel>{ionRangeVec[10].ionRangeName}</IonLabel>
                    </IonItem>
                    <MenuContentRange
                        ionRangeVec={ionRangeVec}
                        onIonRangeVec={onIonRangeVec}
                        indexMin={10} indexMax={11}/>
                    <IonItemDivider/>
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
