import React from "react";
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
                    {/*Ion Ranges*/}
                    <IonItem>
                        <IonLabel>Min</IonLabel>
                        <IonRange
                            min={ionRangeVec[0].ionRangeLimit.minRange}
                            max={ionRangeVec[0].ionRangeLimit.maxRange}
                            value={ionRangeVec[0].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 0)}}/>
                        <IonLabel>Max</IonLabel>
                        <IonRange
                            min={ionRangeVec[1].ionRangeLimit.minRange}
                            max={ionRangeVec[1].ionRangeLimit.maxRange}
                            value={ionRangeVec[1].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 1)}}/>
                    </IonItem>
                    {/*Ion Inputs*/}
                    <IonItem>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[0].ionRangeLimit.minRange}
                            max={ionRangeVec[0].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[0].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 0)}/>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[1].ionRangeLimit.minRange}
                            max={ionRangeVec[1].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[1].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 1)}/>
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
                    <IonItem>
                        <IonLabel>{ionRangeVec[2].ionRangeName}</IonLabel>
                    </IonItem>
                    {/*Ion Ranges*/}
                    <IonItem>
                        <IonLabel>Min</IonLabel>
                        <IonRange
                            min={ionRangeVec[2].ionRangeLimit.minRange}
                            max={ionRangeVec[2].ionRangeLimit.maxRange}
                            value={ionRangeVec[2].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 2)}}/>
                        <IonLabel>Max</IonLabel>
                        <IonRange
                            min={ionRangeVec[1].ionRangeLimit.minRange}
                            max={ionRangeVec[1].ionRangeLimit.maxRange}
                            value={ionRangeVec[1].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 1)}}/>
                    </IonItem>
                    {/*Ion Inputs*/}
                    <IonItem>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[2].ionRangeLimit.minRange}
                            max={ionRangeVec[2].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[0].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 2)}/>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[1].ionRangeLimit.minRange}
                            max={ionRangeVec[1].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[1].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 1)}/>
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
                    <IonItem>
                        <IonLabel>{ionRangeVec[4].ionRangeName}</IonLabel>
                    </IonItem>
                    {/*Ion Ranges*/}
                    <IonItem>
                        <IonLabel>Min</IonLabel>
                        <IonRange
                            min={ionRangeVec[4].ionRangeLimit.minRange}
                            max={ionRangeVec[4].ionRangeLimit.maxRange}
                            value={ionRangeVec[4].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 4)}}/>
                        <IonLabel>Max</IonLabel>
                        <IonRange
                            min={ionRangeVec[5].ionRangeLimit.minRange}
                            max={ionRangeVec[5].ionRangeLimit.maxRange}
                            value={ionRangeVec[5].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 5)}}/>
                    </IonItem>
                    {/*Ion Inputs*/}
                    <IonItem>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[4].ionRangeLimit.minRange}
                            max={ionRangeVec[4].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[2].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 4)}/>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[5].ionRangeLimit.minRange}
                            max={ionRangeVec[5].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[5].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 5)}/>
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
                    <IonItem>
                        <IonLabel>{ionRangeVec[6].ionRangeName}</IonLabel>
                    </IonItem>
                    {/*Ion Ranges*/}
                    <IonItem>
                        <IonLabel>Min</IonLabel>
                        <IonRange
                            min={ionRangeVec[6].ionRangeLimit.minRange}
                            max={ionRangeVec[6].ionRangeLimit.maxRange}
                            value={ionRangeVec[6].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 6)}}/>
                        <IonLabel>Max</IonLabel>
                        <IonRange
                            min={ionRangeVec[7].ionRangeLimit.minRange}
                            max={ionRangeVec[7].ionRangeLimit.maxRange}
                            value={ionRangeVec[7].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 7)}}/>
                    </IonItem>
                    {/*Ion Inputs*/}
                    <IonItem>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[6].ionRangeLimit.minRange}
                            max={ionRangeVec[6].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[2].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 6)}/>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[7].ionRangeLimit.minRange}
                            max={ionRangeVec[7].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[3].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 7)}/>
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
                    <IonItem>
                        <IonLabel>{ionRangeVec[8].ionRangeName}</IonLabel>
                    </IonItem>
                    {/*Ion Ranges*/}
                    <IonItem>
                        <IonLabel>Min</IonLabel>
                        <IonRange
                            min={ionRangeVec[8].ionRangeLimit.minRange}
                            max={ionRangeVec[8].ionRangeLimit.maxRange}
                            value={ionRangeVec[8].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 8)}}/>
                        <IonLabel>Max</IonLabel>
                        <IonRange
                            min={ionRangeVec[9].ionRangeLimit.minRange}
                            max={ionRangeVec[9].ionRangeLimit.maxRange}
                            value={ionRangeVec[9].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 9)}}/>
                    </IonItem>
                    {/*Ion Inputs*/}
                    <IonItem>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[8].ionRangeLimit.minRange}
                            max={ionRangeVec[8].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[2].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 8)}/>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[9].ionRangeLimit.minRange}
                            max={ionRangeVec[9].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[3].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 9)}/>
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
                    <IonItem>
                        <IonLabel>{ionRangeVec[10].ionRangeName}</IonLabel>
                    </IonItem>
                    {/*Ion Ranges*/}
                    <IonItem>
                        <IonLabel>Min</IonLabel>
                        <IonRange
                            min={ionRangeVec[10].ionRangeLimit.minRange}
                            max={ionRangeVec[10].ionRangeLimit.maxRange}
                            value={ionRangeVec[10].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 10)}}/>
                        <IonLabel>Max</IonLabel>
                        <IonRange
                            min={ionRangeVec[11].ionRangeLimit.minRange}
                            max={ionRangeVec[11].ionRangeLimit.maxRange}
                            value={ionRangeVec[11].actualRangeVal}
                            step={0.01}
                            onIonChange={(e: CustomEvent) => {onIonRangeVec(+e.detail.value, 11)}}/>
                    </IonItem>
                    {/*Ion Inputs*/}
                    <IonItem>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[10].ionRangeLimit.minRange}
                            max={ionRangeVec[10].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[2].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 10)}/>
                        <IonInput
                            type={"number"}
                            min={ionRangeVec[11].ionRangeLimit.minRange}
                            max={ionRangeVec[11].ionRangeLimit.maxRange}
                            clearInput value={Math.round(ionRangeVec[3].actualRangeVal * 100)/100}
                            onIonChange={(e) => onIonRangeVec(+e.detail.value!, 11)}/>
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
