import { IonButtons, IonContent, IonFooter, IonHeader, IonInput, IonMenuButton, IonPage, IonTitle, IonToolbar, IonSelect, IonSelectOption } from '@ionic/react';
import { useParams } from 'react-router';
import './Page.css';
import CanvasContainer from '../components/CanvasContainer';
import React, {useState} from 'react';



const Page: React.FC = () => {
  const { name } = useParams<{ name: string; }>();

  const [sliceXY, setSliceXY] = useState<number>(0)

  return (
    <IonPage>
      <IonHeader>

        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonMenuButton/>
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
          <IonInput type="number" value={sliceXY} onIonChange={(e) => { setSliceXY(+e.detail.value!) } } />
          <CanvasContainer z={sliceXY}/>
      </IonContent>

    <IonFooter>
        <span>{0}</span>
    </IonFooter>

    </IonPage>
  );
};

export default Page;
