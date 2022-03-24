import {
    IonApp,
    IonContent,
    IonLabel,
    IonMenu,
    IonRouterOutlet,
    IonSplitPane,
    setupIonicReact
} from '@ionic/react';
import {IonReactRouter} from '@ionic/react-router';
import {Redirect, Route} from 'react-router-dom';
import Menu from './components/menu/Menu';
import Page from './pages/Page';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import SideMenu from './components/SideMenu';

setupIonicReact();

/**
 * Main function that does all the functions callouts
 */
const App: React.FC = () => {

    return (
        <IonApp>
            <IonReactRouter>
                <Menu/>

                <IonSplitPane contentId="main">
                    <IonMenu side="end" menuId="custom" id="custom"
                        contentId="main"
                        onIonWillClose={ (e) => console.log(e) }>
                        <IonContent>
                            <SideMenu hideMenu={true}/>
                        </IonContent>
                    </IonMenu>

                    <IonRouterOutlet id="main">
                        <Page/>
                    </IonRouterOutlet>
                </IonSplitPane>

            </IonReactRouter>
        </IonApp>
    );

};

export default App;
