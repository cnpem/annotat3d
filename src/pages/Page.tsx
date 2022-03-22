import React, {useState} from "react";
import {
    IonButton, IonButtons, IonContent,
    IonFooter, IonHeader, IonIcon,
    IonMenuButton, IonPage, IonTitle, IonToolbar
} from '@ionic/react';
import {useParams} from 'react-router';
import './Page.css';

/*Components imports*/
import SideMenuAnnot from "../components/SideMenuAnnot";
import SideMenu from "../components/SideMenu";
import {buildOutline} from "ionicons/icons";

/**
 * Module that contains the initial page of Annotat3D web
 * @tutorial the variable name is used as the main site title
 * @constructor
 * @return returns the React file to create the site /inbox
 */
const Page: React.FC = () => {

    const {name} = useParams<{name: string}>();
    const [showEditOp, setShowEditOp] = useState<boolean>(true);

    const handleEditOp = () => {
        setShowEditOp(!showEditOp);
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                        <IonMenuButton/>
                        <IonButton onClick={handleEditOp}>
                            <IonIcon icon={buildOutline}/>
                        </IonButton>
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

                <SideMenu hideMenu={showEditOp}/>
            </IonContent>

            <IonFooter>
                <span>My Footer</span>
            </IonFooter>

        </IonPage>
    );
};

export default Page;
