import React, {useState} from "react";
import {IonCard, IonItemDivider, IonList} from "@ionic/react";
import SlicesSubMenu from "./SlicesSubMenu";
import ClippingPlane from "./ClippingPlane";
import OutputsVis from "./OutputsVis";
import LabelTable from "./LabelTable";
import {LabelProp} from "./TypeScriptFiles/Interfaces/LabelsInterface";

/**
 * Component that creates the lateral bar menu
 * @todo i need to create another slicer fro the viz menu
 * @todo i need to make this component more small
 * @constructor
 * @return this function return a list of all lateral components
 */
const SideMenuAnnot: React.FC = () => {

    const [sliceXY, setSliceXY] = useState<number>(0);
    const [sliceXZ, setSliceXZ] = useState<number>(0);
    const [sliceYZ, setSliceYZ] = useState<number>(0);
    const [clipPlane, setClipPlane] = useState<number>(0);
    const [sliceAxis, setSliceAxis] = useState<string>("XY");
    const [presentVal, setPresentVal] = useState<string>("Original");
    const [labelList, setLabelList] = useState<LabelProp[]>([]);

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

    const selectLabelList = (labelVec: LabelProp[]) => {
        setLabelList(labelVec);
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
                <LabelTable labelList={labelList} onLabelList={selectLabelList}/>
            </IonList>
        </IonCard>
    )

};

export default SideMenuAnnot;