import {useState} from 'react';
import {IonMenu, IonItem, IonContent, IonLabel, IonButton} from '@ionic/react';

const MenuTools: React.FC = () => {
    return (
        <IonItem>
            <IonContent>
                <IonButton>OK</IonButton>
                <IonLabel>Hue</IonLabel>
            </IonContent>
        </IonItem>
    );
};

export default MenuTools;
