import React, {useState} from "react";
import {
    IonButton, IonButtons, IonContent,
    IonFooter, IonHeader, IonIcon,
    IonMenuButton, IonPage, IonTitle,
    IonToolbar, IonMenuToggle
} from '@ionic/react';
import {useParams} from 'react-router';
import './Page.css';

import CanvasContainer from '../components/canvas/CanvasContainer';
import {build} from "ionicons/icons";

import { dispatch, useEventBus } from '../utils/eventbus';
import { SliceInfoInterface } from "../components/tools_menu/SliceInfoInterface";
import { sfetch } from "../utils/simplerequest";

/**
 * Module that contains the initial page of Annotat3D web
 * @tutorial the variable name is used as the main site title
 * @constructor
 * @return returns the React file to create the site /inbox
 */
const Page: React.FC = () => {
    const { name } = useParams<{ name: string; }>();

    const [sliceInfo, setSliceInfo] = useState<SliceInfoInterface>({axis: 'XY', slice: 0});

    const [canvasMode, setCanvasMode] = useState<'drawing' | 'imaging'>('drawing');

    useEventBus('sliceChanged', (payload: SliceInfoInterface) => {
        setSliceInfo(payload);
        sfetch('POST', '/close_image/future')
        .then(() => {
            dispatch('futureChanged', null)
        });
        const cropShape = currentEventValue('cropShape'); 
        dispatch('cropShape', cropShape);
    });


    useEventBus('canvasModeChanged', (mode) => {
        setCanvasMode(mode);
    });

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="light">
                    <IonButtons slot="start">
                        <IonMenuButton/>
                        <IonMenuToggle menu="custom">
                            <IonButton>
                                <IonIcon size="default" icon={build}/>
                            </IonButton>
                        </IonMenuToggle>
                    </IonButtons>
                    <IonTitle>{name}</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">{name}</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <CanvasContainer canvasMode={canvasMode}
                    axis={sliceInfo.axis} slice={sliceInfo.slice}/>
            </IonContent>

            <IonFooter>
                <span>{ sliceInfo.axis + ": " + sliceInfo.slice }</span>
            </IonFooter>
        </IonPage>
    );
};

export default Page;
