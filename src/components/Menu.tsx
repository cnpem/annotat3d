import {
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonMenu,
    IonMenuToggle,
    IonHeader,
    IonNote, IonSearchbar, IonTitle,
    IonToggle, IonToolbar
} from '@ionic/react';

import {useLocation} from 'react-router-dom';
import {
    documentOutline,
    documentSharp,
    archiveOutline,
    archiveSharp,
    heartOutline,
    heartSharp,
    paperPlaneOutline,
    paperPlaneSharp,
    trashOutline,
    trashSharp,
    warningOutline,
    warningSharp
} from 'ionicons/icons';
import './Menu.css';

import ThemeToggle from "./ThemeToggle";
import React, {useState} from "react";

interface AppPage {
    url: string;
    iosIcon: string;
    mdIcon: string;
    title: string;
}

const appPages: AppPage[] = [
    {
        title: 'File',
        url: '/page/Inbox',
        iosIcon: documentOutline,
        mdIcon: documentSharp
    },
    {
        title: 'To IndeX \u00AE',
        url: '/page/Outbox',
        iosIcon: paperPlaneOutline,
        mdIcon: paperPlaneSharp
    },
    {
        title: 'Favorites',
        url: '/page/Favorites',
        iosIcon: heartOutline,
        mdIcon: heartSharp
    },
    {
        title: 'Archived',
        url: '/page/Archived',
        iosIcon: archiveOutline,
        mdIcon: archiveSharp
    },
    {
        title: 'Trash',
        url: '/page/Trash',
        iosIcon: trashOutline,
        mdIcon: trashSharp
    },
    {
        title: 'Spam',
        url: '/page/Spam',
        iosIcon: warningOutline,
        mdIcon: warningSharp
    }
];

const Menu: React.FC = () => {
    const location = useLocation();
    const [searchText, setSearchText] = useState('');

    const filteredPages = appPages.filter(
        (page) => {
            return(
                searchText === '' ? page : page.title.toLowerCase().includes(searchText.toLowerCase())
            );
        }
    );

    return (
        <IonMenu contentId="main" type="overlay" swipeGesture={true} style={{'--width': '500px'}}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle size={"large"} className={"ion-text-center"}>Annotat3D</IonTitle>
                    <IonTitle style={{"--color":"grey"}} size={"small"} className={"ion-text-center"}>web version 1.0.0</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonToolbar>
                <IonSearchbar value={searchText} onIonChange={e => setSearchText(e.detail.value!)}></IonSearchbar>
            </IonToolbar>
            <IonToolbar style={{"--padding-start": "25px"}}>
                <ThemeToggle/>
            </IonToolbar>
            <IonContent>
                <IonList id="inbox-list">
                    {filteredPages.map((appPage, index) => {
                        return (
                            <IonMenuToggle autoHide={false} key={index}>
                                <IonItem className={location.pathname === appPage.url ? 'selected' : ''}
                                         routerLink={appPage.url} routerDirection="none" lines="none" detail={false}>
                                    <IonIcon slot="start" ios={appPage.iosIcon} md={appPage.mdIcon}/>
                                    <IonLabel>{appPage.title}</IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                        );
                    })}
                </IonList>
            </IonContent>
        </IonMenu>
    );
};

export default Menu;
