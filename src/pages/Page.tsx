import React, {useState} from "react";
import {
    IonButton, IonButtons, IonContent,
    IonFooter, IonHeader, IonIcon,
    IonMenuButton, IonPage, IonTitle,
    IonToolbar, IonSelectOption, IonSelect,
    IonMenuToggle
} from '@ionic/react';
import {useParams} from 'react-router';
import './Page.css';

import CanvasContainer from '../components/CanvasContainer';
import {build} from "ionicons/icons";

/**
 * Module that contains the initial page of Annotat3D web
 * @tutorial the variable name is used as the main site title
 * @constructor
 * @return returns the React file to create the site /inbox
 */
const Page: React.FC = () => {
    const { name } = useParams<{ name: string; }>();

    const [sliceXY,] = useState<number>(0)

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
                    <div style={ {"display": "flex"} }>
                        <IonTitle>{name}</IonTitle>
                        <IonSelect interface="popover" placeholder="Segmentation Module">
                            <IonSelectOption value="superpixel">Superpixel Segmentation</IonSelectOption>
                            <IonSelectOption value="pixel">Pixel Segmentation</IonSelectOption>
                            <IonSelectOption value="edit">Edit Labels</IonSelectOption>
                        </IonSelect>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">{name}</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <CanvasContainer z={sliceXY}/>
            </IonContent>

            <IonFooter>
                <span>{0}</span>
            </IonFooter>
        </IonPage>
    );
};

export default Page;
