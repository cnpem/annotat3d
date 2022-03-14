import {
    IonButton,
    IonButtons,
    IonContent,
    IonFabButton,
    IonFooter,
    IonHeader,
    IonMenuButton,
    IonPage, IonSegmentButton,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import {useParams} from 'react-router';
import './Page.css';

const Page: React.FC = () => {

    const {name} = useParams<{ name: string; }>();

    return (
        <IonPage>
            <IonHeader>

                <IonToolbar color="light">
                    <IonButtons slot="start">
                        <IonMenuButton/>
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
            </IonContent>

        </IonPage>
    );
};

export default Page;
