import React, {useState} from "react";
import {ImagePropsInterface} from "./TypeScriptFiles/Interfaces/ImagePropsInterface";
import InputMenu from "./InputMenu";
import SideMenuAnnot from "./SideMenuAnnot";

const SideMenu:React.FC = () => {

    const [menuOp, setMenuOp] = useState<"Visualization" | "Annotation">("Visualization");
    const [imageSlice, setImageSlice] = useState<ImagePropsInterface>({x: 200, y: 200, z: 200});

    const selectImageSlice = (image: ImagePropsInterface) => {
        setImageSlice(image);
    }

    const selectMenuOp = (op: "Visualization" | "Annotation") => {
        setMenuOp(op);
    }

    return(
        <React.Fragment>
            <InputMenu selectVal={menuOp} onSelectVal={selectMenuOp}/>
            <SideMenuAnnot imageSlice={imageSlice} onImageSlice={selectImageSlice}/>
        </React.Fragment>

    );

}

export default SideMenu;