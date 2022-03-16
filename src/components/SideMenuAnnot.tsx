import React, {useState} from "react";
import {IonCard, IonItemDivider, IonList} from "@ionic/react";
import SlicesSubMenu from "./SlicesSubMenu";
import ClippingPlane from "./ClippingPlane";
import OutputsVis from "./OutputsVis";
import LabelTable from "./LabelTable";
import {LabelProp} from "./TypeScriptFiles/Interfaces/LabelsInterface";

/**
 * @todo i need to remove the slices variables later
 * @constructor
 */
const SideMenuAnnot: React.FC = () => {

    const [sliceXY, setSliceXY] = useState<number>(0);
    const [sliceXZ, setSliceXZ] = useState<number>(0);
    const [sliceYZ, setSliceYZ] = useState<number>(0);
    const [clipPlane, setClipPlane] = useState<number>(0);
    const [sliceAxis, setSliceAxis] = useState<string>("XY");
    const [presentVal, setPresentVal] = useState<string>("Original");
    const [labelList, setLabelList] = useState<LabelProp[]>([]);
    const [idGenerator, setIdGenerator] = useState<number>(0);

    const selectSliceHandlerXY = (slice: number) => {
        setSliceXY(slice);
    }

    const selectSliceHandlerXZ = (slice: number) => {
        setSliceXZ(slice);
    }

    const selectSliceHandlerYZ = (slice: number) => {
        setSliceYZ(slice);
    }

    const selectClipPlane = (plane: number) => {
        setClipPlane(plane)
    }

    const selectSliceAxis = (slice: string) => {
        setSliceAxis(slice);
    }

    const selectPresentVal = (val: string) => {
        setPresentVal(val);
    }

    const selectLabelList = (labelElement: LabelProp) => {
        setLabelList((vec) => [...vec, labelElement]);
    }

    const removeLabel = (labelId: number) => {
        setLabelList(labelList.filter(label => labelId !== label.id));
    }

    /**
     * @todo i need to implement a exception if the user tries to add more labels. I'll use this as example https://www.tektutorialshub.com/typescript/typescript-number-min-max-safe-values/
     * @param id
     */
    const incrementId = (id: number) => {
        setIdGenerator(id + 1);
    }

    return(
        <IonCard>
            <IonList>
                <SlicesSubMenu numberVal={sliceXY} onNumberVal={selectSliceHandlerXY} titleName={"Slice XY"}/>
                <SlicesSubMenu numberVal={sliceXZ} onNumberVal={selectSliceHandlerXZ} titleName={"Slice XZ"}/>
                <SlicesSubMenu numberVal={sliceYZ} onNumberVal={selectSliceHandlerYZ} titleName={"Slice YZ"}/>
                <ClippingPlane numberVal={clipPlane} onNumberVal={selectClipPlane} sliceAxis={sliceAxis} onSliceAxis={selectSliceAxis} presentVal={presentVal} onPresentVal={selectPresentVal} titleName={"Clipping Plane"}/>
                <IonItemDivider/>
                <OutputsVis sliceXY={sliceXY} sliceXZ={sliceXZ} sliceYZ={sliceYZ} clipPlane={clipPlane} sliceAxis={sliceAxis} presentVal={presentVal}/>
                <IonItemDivider/>
                <LabelTable labelList={labelList} onLabelList={selectLabelList} onRemoveLabel={removeLabel} idGenerator={idGenerator} onIdGenerator={incrementId}/>
            </IonList>
        </IonCard>
    )

};

export default SideMenuAnnot;