import {
    IonIcon,
    IonLabel,
    IonToggle, IonToolbar
} from '@ionic/react';
import {moonOutline, moonSharp} from "ionicons/icons";

/**
 * Toggle Dark Mode component
 * @constructor
 */
const ThemeToggle: React.FC = () => {
    /**
     * Toggle event handler
     */
    const toggleDarkModeHandler = () => {
    document.body.classList.toggle("dark");
  };
    return (
        <IonToolbar style={{"--padding-start": "25px"}}>
            <IonIcon slot="start" ios={moonOutline} md={moonSharp}/>
            <IonLabel>&nbsp;&nbsp;Come to the Dark Side</IonLabel>
            <IonToggle id="darkMode" slot="end" onIonChange={toggleDarkModeHandler}/>
        </IonToolbar>
    );
};

export default ThemeToggle;