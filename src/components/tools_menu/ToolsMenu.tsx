import {IonCard, IonCardContent, IonLabel, IonSegment, IonSegmentButton, SegmentChangeEventDetail} from "@ionic/react";
import React, {Fragment, useEffect, useState} from "react";
import {useStorageState} from "react-storage-hooks";
import { useEventBus } from "../../utils/eventbus";
import { sfetch } from "../../utils/simplerequest";
import { ImageShapeInterface } from "./ImageShapeInterface";
import ProcessingMenu from "./ProcessingMenu";
import SideMenuAnnot from "./SideMenuAnnot";
import SideMenuVis from "./SideMenuVis";
import SlicesMenu from "./SlicesMenu";

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

    const [imageShape, setImageShape] = useState<ImageShapeInterface>({
        x: 0, y: 0, z: 0
    });

    useEffect(() => {
        sfetch('POST', '/get_image_info/image', '', 'json')
        .then((imgInfo) => {
            console.log('image info: ', imgInfo);
            setImageShape({
                x: imgInfo.shape[2],
                y: imgInfo.shape[1],
                z: imgInfo.shape[0]
            });
        });
    }, [setImageShape]);

    useEventBus('ImageLoaded', (imgInfo) => {
        setImageShape({
            x: imgInfo.imageShape[2],
            y: imgInfo.imageShape[1],
            z: imgInfo.imageShape[0]
        });
    })

    return(
        <React.Fragment>
            <IonCard>
                <IonCardContent>
                    <SlicesMenu imageShape={imageShape}/>   
                </IonCardContent>
            </IonCard>
            {props.hideMenu && <ShowMenu/>}
        </React.Fragment>

    );

}

export default ToolsMenu;
