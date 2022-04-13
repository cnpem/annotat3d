import {IonLabel, IonSegment, IonSegmentButton, SegmentChangeEventDetail} from "@ionic/react";
import React, {Fragment} from "react";
import {useStorageState} from "react-storage-hooks";
import ProcessingMenu from "./ProcessingMenu";
import SideMenuAnnot from "./SideMenuAnnot";
import SideMenuVis from "./SideMenuVis";

interface SideMenuProps {
    hideMenu: boolean
}

const menuChoices = ['visualization', 'annotation', 'processing'] as const;
const menus = [ <SideMenuVis/>, <SideMenuAnnot/>, <ProcessingMenu/> ];

type InputMenuChoicesType = typeof menuChoices[number];

const ToolsMenu: React.FC<SideMenuProps> = (props: SideMenuProps) => {

    const [menuOp, setMenuOp] = useStorageState<InputMenuChoicesType>(sessionStorage, "toolsMenu", "visualization");

    const selectMenuOp = (e: CustomEvent<SegmentChangeEventDetail>) => {
        setMenuOp(e.detail.value as InputMenuChoicesType);
    };

    const renderSegmentButton = (choice: InputMenuChoicesType) => {
        return (
            <IonSegmentButton value={choice}>
                <IonLabel>{choice}</IonLabel>
            </IonSegmentButton>
        );
    }

    const renderMenu = (choice: InputMenuChoicesType, idx: number) => {
        return (
            <div hidden={menuOp!==choice}>{ menus[idx] }</div>
        );
    }

    const ShowMenu:React.FC = () => {
        return(
            <Fragment>
                <IonSegment value={menuOp} onIonChange={selectMenuOp}>
                    { menuChoices.map(renderSegmentButton) }
                </IonSegment>
                { menuChoices.map(renderMenu) }
            </Fragment>
        );
    }

    return(
        <React.Fragment>
            {props.hideMenu && <ShowMenu/>}
        </React.Fragment>

    );

}

export default ToolsMenu;
