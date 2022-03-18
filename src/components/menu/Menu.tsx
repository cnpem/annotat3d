import {
    IonContent,
    IonMenu,
    IonHeader,
    IonSearchbar, IonTitle,
    IonToolbar, IonAccordionGroup
} from '@ionic/react';

import {useLocation} from 'react-router-dom';
import '../styles/Menu.css';

import ThemeToggle from "./ThemeToggle";
import File from "./file/File";
import Colormap from "./Colormap";
import Classification from "./Classification";
import DeepLearning from "./DeepLearning";
import Remote from "./Remote";

import React, {useState} from "react";

/**
 * Menu component
 * @constructor
 */
const Menu: React.FC = () => {
    useLocation();
    /**
     * Search bar state
     */
    // TODO: make real search over menu items
    const [searchText, setSearchText] = useState('');

    return (
        <IonMenu contentId="main" type="overlay" swipeGesture={true}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle size={"large"} className={"ion-text-center"}>Annotat3D</IonTitle>
                    <IonTitle size={"small"} className={"menu-subtitle ion-text-center"}>web version 1.0.0</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonToolbar>
                <IonSearchbar value={searchText} onIonChange={e => setSearchText(e.detail.value!)}></IonSearchbar>
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
            <ThemeToggle/>
        </IonMenu>
    );
};

export default Menu;
