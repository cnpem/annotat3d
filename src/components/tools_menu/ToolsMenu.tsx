import {IonLabel, IonSegment, IonSegmentButton} from "@ionic/react";
import React, {useState} from "react";
import ProcessingMenu from "./ProcessingMenu";
import SideMenuAnnot from "./SideMenuAnnot";
import SideMenuVis from "./SideMenuVis";

interface SideMenuProps {
    hideMenu: boolean
}

type InputMenuChoicesType = "Visualization" | "Annotation" | "Processing";

const ToolsMenu: React.FC<SideMenuProps> = (props: SideMenuProps) => {

    const [menuOp, setMenuOp] = useState<InputMenuChoicesType>("Visualization");

    const selectMenuOp = (op: InputMenuChoicesType) => {
        setMenuOp(op);
    };

    const activeItemRender = () => {
        switch(menuOp) {
            case 'Annotation':
                return <SideMenuAnnot/>
            case 'Visualization':
                return <SideMenuVis/>
            case 'Processing':
                return <ProcessingMenu />
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
            <IonSegmentButton value={"Visualization"}>
                <IonLabel>Visualization</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value={"Annotation"}>
                <IonLabel>Annotation</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value={"Processing"}>
                <IonLabel>Processing</IonLabel>
            </IonSegmentButton>
        </IonSegment>
    );

}

export default ToolsMenu;
