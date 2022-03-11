import {
    IonIcon,
    IonLabel,
    IonToggle
} from '@ionic/react';
import {moonOutline, moonSharp} from "ionicons/icons";

const ThemeToggle: React.FC = () => {
    const toggleDarkModeHandler = () => {
    document.body.classList.toggle("dark");
  };
    return (
        <>
            <IonIcon slot="start" ios={moonOutline} md={moonSharp}/>
            <IonLabel>&nbsp;&nbsp;Come to the Dark Side</IonLabel>
            <IonToggle id="darkMode" slot="end" onIonChange={toggleDarkModeHandler}/>
        </>
    );
};

export default ThemeToggle;