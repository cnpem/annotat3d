import React, {useState} from "react";
import {IonCard, IonItemDivider, IonList} from "@ionic/react";
import LabelTable from "./LabelTable";
import {LabelProp} from "./TypeScriptFiles/Interfaces/LabelsInterface";
import SlicesMenu from "./SlicesMenu";
import {ImagePropsInterface} from "./TypeScriptFiles/Interfaces/ImagePropsInterface";

/**
 * Component that creates the lateral bar menu
 * @todo i need to create another slicer fro the viz menu
 * @todo i need to make this component more small
 * @constructor
 * @return this function return a list of all lateral components
 */
const SideMenuAnnot: React.FC = () => {

    const [imageSlice, setImageSlice] = useState<ImagePropsInterface>({x: 200, y: 200, z: 200});
    const [labelList, setLabelList] = useState<LabelProp[]>([]);

    const selectImageSlice = (image: ImagePropsInterface) => {
        setImageSlice(image);
    }

    const selectLabelList = (labelVec: LabelProp[]) => {
        setLabelList(labelVec);
    }

    return(
        <IonCard>
            <IonList>
                <SlicesMenu imageProps={imageSlice} onImageProps={selectImageSlice}/>
                <IonItemDivider/>
                <LabelTable labelList={labelList} onLabelList={selectLabelList}/>
            </IonList>
        </IonCard>
    )

};

export default SideMenuAnnot;