import React, {useState} from "react";
import {IonCard, IonItemDivider, IonList} from "@ionic/react";
import LabelTable from "./LabelTable";
import {LabelProp} from "./TypeScriptFiles/Interfaces/LabelsInterface";
import SlicesMenu from "./SlicesMenu";
import {ImagePropsInterface} from "./TypeScriptFiles/Interfaces/ImagePropsInterface";
import SegmentationButtons from "./SegmentationButtons";
import {SideMenuAnnotatInterface} from "./TypeScriptFiles/Interfaces/SideMenuAnnotatInterface";

/**
 * Component that creates the lateral bar menu
 * @todo i need to create another slicer fro the viz menu
 * @todo i need to make this component more small
 * @constructor
 * @return this function return a list of all lateral components
 */
const SideMenuAnnot: React.FC<SideMenuAnnotatInterface> = (args) => {

    const [labelList, setLabelList] = useState<LabelProp[]>([]);

    const selectLabelList = (labelVec: LabelProp[]) => {
        setLabelList(labelVec);
    }

    return(
        <IonCard>
            <IonList>
                <SlicesMenu imageProps={args.imageSlice} onImageProps={args.onImageSlice}/>
                <IonItemDivider/>
                <LabelTable labelList={labelList} onLabelList={selectLabelList}/>
                <IonItemDivider/>
                <SegmentationButtons/>
            </IonList>
        </IonCard>
    )

};

export default SideMenuAnnot;