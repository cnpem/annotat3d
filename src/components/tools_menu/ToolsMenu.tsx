import {IonButton, IonItem, IonLabel, IonSegment, IonSegmentButton} from "@ionic/react";
import React, {Fragment, useState} from "react";
import {ImageShapeInterface} from "./ImageShapeInterface";
import { ModuleCard, ModuleCardItem }from "./ModuleCard";
import SideMenuAnnot from "./SideMenuAnnot";
import SideMenuVis from "./SideMenuVis";
import SuperpixelModuleCard from "./SuperpixelModuleCard";
import SuperpixelSegmentationModuleCard from "./SuperpixelSegmentationModuleCard";

interface SideMenuProps {
    hideMenu: boolean
}

type InputMenuChoicesType = "Visualization" | "Annotation" | "Processing";

const ToolsMenu: React.FC<SideMenuProps> = (props: SideMenuProps) => {

    const [menuOp, setMenuOp] = useState<InputMenuChoicesType>("Annotation");
    const [imageSlice, setImageSlice] = useState<ImageShapeInterface>({x: 200, y: 200, z: 5000});

    const selectImageSlice = (image: ImageShapeInterface) => {
        setImageSlice(image);
    };

    const selectMenuOp = (op: InputMenuChoicesType) => {
        setMenuOp(op);
    };

    const activeItemRender = () => {
        switch(menuOp) {
            case 'Annotation':
                return <SideMenuAnnot imageSlice={imageSlice} onImageSlice={selectImageSlice}/>
            case 'Visualization':
                return <SideMenuVis/>
            case 'Processing':
                return (
                    <Fragment>
                        <SuperpixelModuleCard/>
                        <SuperpixelSegmentationModuleCard/>
                    </Fragment>
            );
        }
    };

    const ShowMenu:React.FC = () => {
        return(
            <div>
                <InputMenu selectedVal={menuOp} onSelectedVal={selectMenuOp}/>
                { activeItemRender() }
            </div>
        );
    }

    return(
        <React.Fragment>
            {props.hideMenu && <ShowMenu/>}
        </React.Fragment>

    );

}

interface InputMenuInterface{
    selectedVal: InputMenuChoicesType;
    onSelectedVal: (val: InputMenuChoicesType) => void;
}

const InputMenu: React.FC<InputMenuInterface> = (props) => {

    const inputChangeHandler = (e: CustomEvent) => {
        props.onSelectedVal(e.detail.value);
    }

    return(
        <IonSegment value={props.selectedVal} onIonChange={inputChangeHandler}>
            <IonSegmentButton value={"Annotation"}>
                <IonLabel>Annotation</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value={"Visualization"}>
                <IonLabel>Visualization</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value={"Processing"}>
                <IonLabel>Processing</IonLabel>
            </IonSegmentButton>
        </IonSegment>
    );

}

export default ToolsMenu;
