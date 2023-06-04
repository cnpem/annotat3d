import { IonIcon, IonLabel, IonToggle, IonToolbar } from '@ionic/react';
import { moonOutline, moonSharp } from 'ionicons/icons';
import { useEffect } from 'react';
import { useStorageState } from 'react-storage-hooks';
import { dispatch } from '../../utils/eventbus';

/**
 * Toggle Dark Mode component
 * @constructor
 */
const ThemeToggle: React.FC = () => {
    const [darkMode, setDarkMode] = useStorageState<boolean>(localStorage, 'darkMode', false);

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        dispatch('toggleMode', darkMode);
    }, [darkMode]);

    return (
        <IonToolbar style={{ '--padding-start': '25px' }}>
            <IonIcon slot="start" ios={moonOutline} md={moonSharp} />
            <IonLabel>&nbsp;&nbsp;Dark Theme</IonLabel>
            <IonToggle checked={darkMode} id="darkMode" slot="end" onIonChange={(e) => setDarkMode(e.detail.checked)} />
        </IonToolbar>
    );
};

export default ThemeToggle;
