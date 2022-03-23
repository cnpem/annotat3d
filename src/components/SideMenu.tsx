import React, {useState} from "react";
import {ImageShapeInterface} from "./TypeScriptFiles/Interfaces/ImageShapeInterface";
import InputMenu from "./InputMenu";
import SideMenuAnnot from "./SideMenuAnnot";
import SideMenuVis from "./SideMenuVis";

interface SideMenuInterface{
    hideMenu: boolean
}

const SideMenu:React.FC<SideMenuInterface> = (props) => {

    const [menuOp, setMenuOp] = useState<"Visualization" | "Annotation">("Annotation");
    const [imageSlice, setImageSlice] = useState<ImageShapeInterface>({x: 200, y: 200, z: 5000});

    const selectImageSlice = (image: ImageShapeInterface) => {
        setImageSlice(image);
    }

    const selectMenuOp = (op: "Visualization" | "Annotation") => {
        setMenuOp(op);
    }

    const ShowMenu:React.FC = () => {
        return(
            <React.Fragment>
                <InputMenu selectedVal={menuOp} onSelectedVal={selectMenuOp}/>
                {
                    (menuOp === "Annotation") ?
                        <SideMenuAnnot imageSlice={imageSlice} onImageSlice={selectImageSlice}/>
                     : 
                        <SideMenuVis/>
                    
                }
            </React.Fragment>
        );
    }

    return(
        <React.Fragment>
            {props.hideMenu && <ShowMenu/>}
        </React.Fragment>

    );

}

export default SideMenu;
