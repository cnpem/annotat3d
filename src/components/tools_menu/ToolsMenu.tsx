import {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonIcon,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    SegmentChangeEventDetail,
} from '@ionic/react';
import React, { Fragment } from 'react';
import { useStorageState } from 'react-storage-hooks';
import { ImageShapeInterface } from './utils/ImageShapeInterface';
import ProcessingMenu from './module_menu/ProcessingMenu';
import SideMenuAnnot from './annotation_menu/SideMenuAnnot';
import SideMenuVis from './vis_menu/SideMenuVis';
import SlicesMenu from './SlicesMenu';

import { eyeOutline, brushOutline, colorWandOutline } from 'ionicons/icons';
import { ImageInfoInterface } from '../main_menu/file/utils/ImageInfoInterface';
import { useEventBus } from '../../utils/eventbus';

interface SideMenuProps {
    hideMenu: boolean;
}

const menuChoicesList = [
    {
        id: 'visualization',
        logo: eyeOutline,
    },
    {
        id: 'annotation',
        logo: brushOutline,
    },
    {
        id: 'processing',
        logo: colorWandOutline,
    },
];

const ToolsMenu: React.FC<SideMenuProps> = (props: SideMenuProps) => {
    const [imageShape, setImageShape] = useStorageState<ImageShapeInterface>(sessionStorage, 'imageShape', {
        x: 0,
        y: 0,
        z: 0,
    });

    useEventBus('ImageLoaded', (imgInfo: ImageInfoInterface) => {
        console.log('ToolsMenu: useEventBus imgInfo: ', imgInfo.imageShape);
        setImageShape({
            x: imgInfo.imageShape.x,
            y: imgInfo.imageShape.y,
            z: imgInfo.imageShape.z,
        });
    });

    const toolsMenuList = [
        <SideMenuVis key="first" imageShape={imageShape} />,
        <SideMenuAnnot key="second" />,
        <ProcessingMenu key="third" />,
    ];
    const toolsMenuChoices = ['visualization', 'annotation', 'processing'] as const;

    type InputMenuChoicesType = (typeof toolsMenuChoices)[number];
    type InputMenuChoicesListType = (typeof menuChoicesList)[number];

    const [menuOp, setMenuOp] = useStorageState<InputMenuChoicesType>(sessionStorage, 'toolsMenu', 'visualization');

    const selectMenuOp = (e: CustomEvent<SegmentChangeEventDetail>) => {
        setMenuOp(e.detail.value as InputMenuChoicesType);
    };

    const renderSegmentButton = (choice: InputMenuChoicesListType) => {
        return (
            <IonSegmentButton value={choice.id} title={choice.id}>
                <IonIcon icon={choice.logo} />
            </IonSegmentButton>
        );
    };

    const renderMenu = (choice: InputMenuChoicesType, idx: number) => {
        return <div hidden={menuOp !== choice}>{toolsMenuList[idx]}</div>;
    };

    const ShowMenu: React.FC = () => {
        return (
            <Fragment>
                <IonSegment value={menuOp} onIonChange={selectMenuOp}>
                    {menuChoicesList.map(renderSegmentButton)}
                </IonSegment>
                {toolsMenuChoices.map(renderMenu)}
            </Fragment>
        );
    };

    return (
        <React.Fragment>
            <IonCard>
                <IonCardHeader>
                    <IonLabel>Navigation</IonLabel>
                </IonCardHeader>
                <IonCardContent>
                    <SlicesMenu imageShape={imageShape} />
                </IonCardContent>
            </IonCard>
            <IonCard>
                <IonCardHeader>
                    <IonLabel>Tools</IonLabel>
                </IonCardHeader>
                {props.hideMenu && <ShowMenu />}
            </IonCard>
        </React.Fragment>
    );
};

export default ToolsMenu;
