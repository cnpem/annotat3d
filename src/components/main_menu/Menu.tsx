import {
    IonContent,
    IonMenu,
    IonHeader,
    IonSearchbar, IonToolbar, IonAccordionGroup, IonCard, IonCardTitle, IonCardSubtitle
} from '@ionic/react';

import {useLocation} from 'react-router-dom';
import './Menu.css';

import ThemeToggle from "./ThemeToggle";
import File from "./file/File";
import Colormap from "./Colormap";
import Classification from "./classification/Classification";
import DeepLearning from "./deep_learning_menu/DeepLearning";
import Remote from "./Remote";

import React, {useState} from "react";
import About from './About';
import People from './People';

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
        <IonMenu contentId="main" type="overlay" side="start">
            <IonHeader>
                <IonToolbar>
                    <IonCard color="primary" style={ {padding: '1em', fontFamily: 'monospace'} }>
                        <IonCardTitle className={"ion-text-center"}><big>Annotat3D</big></IonCardTitle>
                    <IonCardSubtitle className={"ion-text-center"}>web version 1.0.0</IonCardSubtitle>
                        </IonCard>
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
                    <About />
                    <People />
                </IonAccordionGroup>
            </IonContent>
            <ThemeToggle/>
        </IonMenu>
    );
};

export default Menu;
