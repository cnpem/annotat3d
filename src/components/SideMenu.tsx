import React, {useState} from "react";
import {ImagePropsInterface} from "./TypeScriptFiles/Interfaces/ImagePropsInterface";
import InputMenu from "./InputMenu";
import SideMenuAnnot from "./SideMenuAnnot";
import SideMenuVis from "./SideMenuVis";

const SideMenu:React.FC = () => {

    const [menuOp, setMenuOp] = useState<"Visualization" | "Annotation">("Visualization");
    const [imageSlice, setImageSlice] = useState<ImagePropsInterface>({x: 200, y: 200, z: 5000});

    const selectImageSlice = (image: ImagePropsInterface) => {
        setImageSlice(image);
    }

    const selectMenuOp = (op: "Visualization" | "Annotation") => {
        setMenuOp(op);
    }

    return(
        <React.Fragment>
            <InputMenu selectVal={menuOp} onSelectVal={selectMenuOp}/>
            {menuOp === "Annotation" ? <SideMenuAnnot imageSlice={imageSlice} onImageSlice={selectImageSlice}/> : <SideMenuVis imageSlice={imageSlice} onImageSlice={selectImageSlice}/>}
        </React.Fragment>

    );

}

export default SideMenu;