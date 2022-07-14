import React, {Fragment, useEffect, useRef} from "react";
import {
    IonAccordion,
    IonAccordionGroup,
    IonCheckbox, IonContent,
    IonInput,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList, IonRange
} from "@ionic/react";
import {AugmentationInterface, IonRangeElement} from "./DatasetInterfaces";
import {isEqual} from "lodash";
import {sfetch} from "../../../../utils/simplerequest";

interface CheckedElements {
    checkedVector: AugmentationInterface[];
    onCheckedVector: (index: number) => void;

    ionRangeVec: IonRangeElement[];
    onIonRangeVec: (newRangeVal: { lower: number, upper: number }, index: number) => void;
}

interface MenuContentRangeInterface {
    index: number
    ionRangeVec: IonRangeElement[];
    onIonRangeVec: (newRangeVal: { lower: number, upper: number }, index: number) => void;
}

interface BackendPayload {
    ionRangeId: number,
    ionNameMenu: string,
    ionRangeName: string,
    actualRangeVal: {
        lower: number,
        upper: number,
    }
}

/**
 * Internal component that create the range content for each menu in Argumentation menu
 * @param {IonRangeElement[]} ionRangeVec - vector that contains the ion-range objects
 * @param {(newRangeVal: number, index: number) => void} onIonRangeVec - setter for ionRangeVec
 * @param {number} index - number that represents the element index to use
 */
const MenuContentRange: React.FC<MenuContentRangeInterface> = ({ionRangeVec, onIonRangeVec, index}) => {

    const contrastRangeRef = useRef<HTMLIonRangeElement | null>(null);
    /**
     * This useEffect is important to always update the ion-range every time he changes
     */
    useEffect(() => {
        if (contrastRangeRef) {
            if (!isEqual(contrastRangeRef.current!.value, ionRangeVec[index].actualRangeVal)) {
                setTimeout(() => {
                    contrastRangeRef.current!.value = ionRangeVec[index].actualRangeVal;
                }, 20);
            }
        }
    });

    const feedBackend = (index: number, value: { lower: number, upper: number }, ionRangeElement: IonRangeElement) => {
        const backendPayload: BackendPayload = {
            ionRangeId: ionRangeElement.ionRangeId,
            ionNameMenu: ionRangeElement.ionNameMenu,
            ionRangeName: ionRangeElement.ionRangeName,
            actualRangeVal: ionRangeElement.actualRangeVal
        }
        console.log("payload content for ion-range");
        console.table(backendPayload);
        sfetch("POST", "/set_augment_ion_range", JSON.stringify(backendPayload), "json").then(
            () => {
                onIonRangeVec(value, index);
            }
        );

    }

    return (
        <Fragment>
            <IonItem>
                <IonRange
                    dualKnobs={true}
                    ref={contrastRangeRef}
                    name={ionRangeVec[index].ionNameMenu + ionRangeVec[index].ionRangeId}
                    min={ionRangeVec[index].ionRangeLimit.minRange}
                    max={ionRangeVec[index].ionRangeLimit.maxRange}
                    debounce={300}
                    step={0.01}
                    onIonKnobMoveEnd={(e: CustomEvent) => {
                        console.log("value in ion-range : ", e.detail.value);
                        onIonRangeVec(e.detail.value as { lower: number, upper: number }, index);
                    }}/>
            </IonItem>
            <IonItem>
                <IonInput
                    type={"number"}
                    max={ionRangeVec[index].ionRangeLimit.maxRange}
                    clearInput={true}
                    value={Math.round(ionRangeVec[index].actualRangeVal.lower * 100) / 100}
                    step={"0.01"}
                    onIonChange={(e: CustomEvent) => {
                        const value = {
                            lower: e.detail.value,
                            upper: ionRangeVec[index].actualRangeVal.upper
                        } as { lower: number, upper: number };
                        feedBackend(index, value, ionRangeVec[index]);
                    }}/>
                <IonInput
                    type={"number"}
                    max={ionRangeVec[index].ionRangeLimit.maxRange}
                    clearInput={true}
                    value={Math.round(ionRangeVec[index].actualRangeVal.upper * 100) / 100}
                    step={"0.01"}
                    onIonChange={(e: CustomEvent) => {
                        const value = {
                            lower: ionRangeVec[index].actualRangeVal.lower,
                            upper: e.detail.value
                        } as { lower: number, upper: number };
                        feedBackend(index, value, ionRangeVec[index]);
                    }}/>
            </IonItem>
        </Fragment>
    );
}

// TODO : Create a component like this to create the canvas for this component
// const CanvasPopupComp: React.FC<CanvasPopupInterface> = ({trigger}) => {
//     const [sliceInfo, setSliceInfo] = useState<SliceInfoInterface>({axis: 'XY', slice: 0});
//     const [sliceValue, setSliceValue] = useState<number>(0);
//     const [sliceName, setSliceName] = useState<slice_name>("XY");
//     const maxValSlider: Record<slice_name, number> = {
//         'XY': 100,
//         'XZ': 100,
//         'YZ': 100,
//     };
//
//     const handleSliceValue = (e: CustomEvent) => {
//         console.log("opa, bão ?")
//         setSliceValue(+e.detail.value);
//         const payload: SliceInfoInterface = {
//             axis: sliceName,
//             slice: +e.detail.value
//         };
//     }
//
//     const handleSliceName = (e: CustomEvent) => {
//         const curSliceName = e.detail.value as slice_name;
//         setSliceName(curSliceName);
//         const maxSliceValue = maxValSlider[curSliceName];
//         if (sliceValue > maxSliceValue) {
//             setSliceValue(maxSliceValue);
//         }
//
//         const payload: SliceInfoInterface = {
//             axis: e.detail.value,
//             slice: sliceValue
//         };
//
//     }
//
//     // Maybe i'll use this later
//     // useEventBus('sliceChanged', (payload: SliceInfoInterface) => {
//     //     setSliceInfo(payload);
//     //     sfetch('POST', '/close_image/future')
//     //     .then(() => {
//     //         dispatch('futureChanged', null)
//     //     });
//     // });
//
//     return (
//         <IonPopover
//             trigger={trigger}
//             className={"preview-popover"}>
//             <IonContent>
//                 <IonItem>
//                     <PreviewContainer
//                         slice={sliceInfo.slice}
//                         axis={sliceInfo.axis}/>
//                     <IonItemDivider/>
//                     <PreviewContainer
//                         slice={sliceInfo.slice}
//                         axis={sliceInfo.axis}/>
//                 </IonItem>
//                 <IonRange/>
//             </IonContent>
//         </IonPopover>
//     );
// }

/**
 * TODO : need to create a info card for each argumentation preview
 * Component that hold all the Argumentation options
 */
const AugmentationComp: React.FC<CheckedElements> = ({checkedVector, onCheckedVector, ionRangeVec, onIonRangeVec}) => {

    const sendBackendCheckedList = (index: number, checkedElement: AugmentationInterface, checked: boolean) => {
        onCheckedVector(index);
        const backendPayload: { checked_element: AugmentationInterface } = {
            checked_element: {
                checkedId: checkedElement.checkedId,
                augmentationOption: checkedElement.augmentationOption,
                isChecked: checked
            }
        };
        console.log("dispatch : ", backendPayload.checked_element);
        sfetch("POST", "/set_augment_list", JSON.stringify(backendPayload), "json").then(
            (bla: AugmentationInterface) => {
                console.log("After the dispatch");
                console.table(bla);
            }
        )

    }

    return (
        <small>
            <IonContent
                scrollEvents={true}>
                <IonAccordionGroup multiple={true}>
                    {/*Argumentation menu option*/}
                    {/*Vertical Flip menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Vertical Flip</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <IonItem>
                                <IonLabel>Augment with Vertical Flip</IonLabel>
                                <IonCheckbox
                                    checked={checkedVector[0].isChecked}
                                    onIonChange={(e: CustomEvent) => sendBackendCheckedList(0,
                                        checkedVector[0], e.detail.checked as boolean)}/>
                            </IonItem>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Horizontal Flip menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
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
                                index={0}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Linear Contrast menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
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
                                <IonLabel>{ionRangeVec[1].ionRangeName}</IonLabel>
                            </IonItem>
                            <MenuContentRange
                                ionRangeVec={ionRangeVec}
                                onIonRangeVec={onIonRangeVec}
                                index={1}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Dropout menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
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
                                <IonLabel>{ionRangeVec[2].ionRangeName}</IonLabel>
                            </IonItem>
                            <MenuContentRange
                                ionRangeVec={ionRangeVec}
                                onIonRangeVec={onIonRangeVec}
                                index={2}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Gaussian Blur menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
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
                                <IonLabel>{ionRangeVec[3].ionRangeName}</IonLabel>
                            </IonItem>
                            <MenuContentRange
                                ionRangeVec={ionRangeVec}
                                onIonRangeVec={onIonRangeVec}
                                index={3}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Average Blur menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
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
                                <IonLabel>{ionRangeVec[4].ionRangeName}</IonLabel>
                            </IonItem>
                            <MenuContentRange
                                ionRangeVec={ionRangeVec}
                                onIonRangeVec={onIonRangeVec}
                                index={4}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Additive Poisson menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
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
                                <IonLabel>{ionRangeVec[5].ionRangeName}</IonLabel>
                            </IonItem>
                            <MenuContentRange
                                ionRangeVec={ionRangeVec}
                                onIonRangeVec={onIonRangeVec}
                                index={5}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Elastic Deformation menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Elastic Deformation</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <IonItem>
                                <IonLabel>Augment with Elastic Deformation</IonLabel>
                                <IonCheckbox
                                    checked={checkedVector[10].isChecked}
                                    onIonChange={() => onCheckedVector(10)}/>
                            </IonItem>
                            <IonItem>
                                <IonLabel>{ionRangeVec[6].ionRangeName}</IonLabel>
                            </IonItem>
                            <MenuContentRange
                                ionRangeVec={ionRangeVec}
                                onIonRangeVec={onIonRangeVec}
                                index={6}/>
                            <IonItem>
                                <IonLabel>{ionRangeVec[7].ionRangeName}</IonLabel>
                            </IonItem>
                            <MenuContentRange
                                ionRangeVec={ionRangeVec}
                                onIonRangeVec={onIonRangeVec}
                                index={7}/>
                            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                            </div>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                </IonAccordionGroup>
            </IonContent>
        </small>
    );
}

export default AugmentationComp;