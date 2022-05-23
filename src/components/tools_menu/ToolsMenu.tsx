import {IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonSegment, IonSegmentButton, IonTitle, SegmentChangeEventDetail} from "@ionic/react";
import React, {Fragment, useEffect, useState} from "react";
import {useStorageState} from "react-storage-hooks";
import { useEventBus } from "../../utils/eventbus";
import { sfetch } from "../../utils/simplerequest";
import { ImageShapeInterface } from "./ImageShapeInterface";
import ProcessingMenu from "./ProcessingMenu";
import SideMenuAnnot from "./SideMenuAnnot";
import SideMenuVis from "./SideMenuVis";
import SlicesMenu from "./SlicesMenu";

import {eyeOutline, brushOutline, colorWandOutline} from "ionicons/icons";

interface SideMenuProps {
    hideMenu: boolean
}

const menuChoicesList = [
    {
        id:'visualization',
        logo: eyeOutline
    },
    {
        id:'annotation',
        logo: brushOutline
    },
    {
        id:'processing',
        logo: colorWandOutline
    }
];

const menuChoices = ['visualization', 'annotation', 'processing'] as const;
const menus = [ <SideMenuVis/>, <SideMenuAnnot/>, <ProcessingMenu/> ];

type InputMenuChoicesType = typeof menuChoices[number];

type InputMenuChoicesListType = typeof menuChoicesList[number];

const ToolsMenu: React.FC<SideMenuProps> = (props: SideMenuProps) => {

    const [menuOp, setMenuOp] = useStorageState<InputMenuChoicesType>(sessionStorage, "toolsMenu", "visualization");

    const selectMenuOp = (e: CustomEvent<SegmentChangeEventDetail>) => {
        setMenuOp(e.detail.value as InputMenuChoicesType);
    };

    const renderSegmentButton = (choice: InputMenuChoicesListType) => {
        return (
            <IonSegmentButton value={choice.id} title={choice.id} >
                <IonIcon icon={choice.logo} /> 
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
                    { menuChoicesList.map(renderSegmentButton) }
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
            <IonCardHeader><IonLabel>Navigation</IonLabel></IonCardHeader>
                <IonCardContent>
                    <SlicesMenu imageShape={imageShape} />
                </IonCardContent>
            </IonCard>
            <IonCard>
                <IonCardHeader><IonLabel>Tools</IonLabel></IonCardHeader>
                {props.hideMenu && <ShowMenu />}
            </IonCard>
            
        </React.Fragment>

    );

}

export default ToolsMenu;
