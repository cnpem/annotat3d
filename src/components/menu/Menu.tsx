import {
    IonContent,
    IonMenu,
    IonHeader,
    IonSearchbar, IonTitle,
    IonToolbar, IonAccordionGroup
} from '@ionic/react';

import {useLocation} from 'react-router-dom';
import './Menu.css';

import ThemeToggle from "./ThemeToggle";
import File from "./File";
import Colormap from "./Colormap";
import Classification from "./Classification";
import DeepLearning from "./DeepLearning";
import Remote from "./Remote";

import React, {useState} from "react";

const Menu: React.FC = () => {
    useLocation();
    const [searchText, setSearchText] = useState('');

    return (
        <IonMenu contentId="main" type="overlay" swipeGesture={true} style={{'--width': '600px'}}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle size={"large"} className={"ion-text-center"}>Annotat3D</IonTitle>
                    <IonTitle style={{"--color": "grey"}} size={"small"} className={"ion-text-center"}>web version
                        1.0.0</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonToolbar>
                <IonSearchbar value={searchText} onIonChange={e => setSearchText(e.detail.value!)}></IonSearchbar>
            </IonToolbar>
            <IonToolbar style={{"--padding-start": "25px"}}>
                <ThemeToggle/>
            </IonToolbar>
            <IonContent>
                <IonAccordionGroup>
                    <File/>
                    <Colormap/>
                    <Classification/>
                    <DeepLearning/>
                    <Remote/>
                </IonAccordionGroup>
            </IonContent>
        </IonMenu>
    );
};

export default Menu;
