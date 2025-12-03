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
import React, { Fragment, useEffect } from 'react';
import { useStorageState } from 'react-storage-hooks';
import { ImageShapeInterface } from './utils/ImageShapeInterface';
import ProcessingMenu from './module_menu/ProcessingMenu';
import SideMenuAnnot from './annotation_menu/SideMenuAnnot';
import SideMenuVis from './vis_menu/SideMenuVis';
import SlicesMenu from './SlicesMenu';

import { eyeOutline, brushOutline, colorWandOutline } from 'ionicons/icons';
import { ImageInfoInterface } from '../main_menu/file/utils/ImageInfoInterface';
import { useEventBus, dispatch } from '../../utils/eventbus';
import { sfetch } from '../../utils/simplerequest';

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

    useEventBus('LockComponents', (LockComponents: boolean) => {
        void sfetch('POST', '/get_image_info/image_info', '', 'json').then((imgInfo: ImageInfoInterface) => {
            const newShape = {
                x: imgInfo.imageShape.x,
                y: imgInfo.imageShape.y,
                z: imgInfo.imageShape.z,
            };

            setImageShape((prevShape) => {
                if (JSON.stringify(prevShape) !== JSON.stringify(newShape)) {
                    console.log('Image shape updated in nav bar', newShape);
                    return newShape;
                }
                console.log('Image shape unchanged');
                return prevShape;
            });
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
    // useEffect hook for reacting to menuOp changes, change to drawing when not in processing (to show the brushs)
    useEffect(() => {
        if (menuOp !== 'processing') {
            console.log(
                'processingAccordion',
                sessionStorage.getItem('processingAccordion'),
                sessionStorage.getItem('processingAccordion') === 'smoothing'
            );

            dispatch('canvasModeChanged', 'drawing');
        } else if (
            menuOp === 'processing' &&
            JSON.parse(sessionStorage.getItem('processingAccordion') || 'null') === 'smoothing'
        ) {
            dispatch('canvasModeChanged', 'imaging');
        }
    }, [menuOp]);

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
