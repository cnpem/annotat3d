import { IonApp, IonContent, IonMenu, IonRouterOutlet, IonSpinner, IonSplitPane, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Menu from './components/main_menu/Menu';
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
import ToolsMenu from './components/tools_menu/ToolsMenu';
import { useEffect, useState } from 'react';
import { sfetch } from './utils/simplerequest';
import { dispatch } from './utils/eventbus';

setupIonicReact();

const LoadingComponent: React.FC<{ hidden?: boolean }> = ({ hidden }) => {
    return (
        <IonContent hidden={hidden}>
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <IonSpinner
                    color="primary"
                    name="bubbles"
                    duration={1500}
                    style={{ transform: 'scale(5)' }}
                ></IonSpinner>
            </div>
        </IonContent>
    );
};

/**
 * Main function that does all the functions callouts
 */
const App: React.FC = () => {
    //a sanity check is sent to check if the backend
    //is up every TEST_INTERVAL milliseconds
    const TEST_INTERVAL = 1000;

    const [loadedBackend, setLoadedBackend] = useState<boolean>(false);

    function loopBackendTest() {
        console.log('loop backend test');
        sfetch('POST', '/test')
            .then(() => {
                setLoadedBackend(true);
                dispatch('LoadFiles', null);
            })
            .catch(() => {
                setLoadedBackend(false);
                setTimeout(loopBackendTest, TEST_INTERVAL);
            });
    }

    useEffect(() => {
        loopBackendTest();
    }, []);

    return (
        <IonApp>
            <LoadingComponent hidden={loadedBackend} />
            <IonReactRouter>
                <Menu />
                <IonSplitPane hidden={!loadedBackend} contentId="main" when="(orientation: landscape)">
                    <IonMenu
                        side="end"
                        menuId="custom"
                        id="custom"
                        contentId="main"
                        onIonWillClose={(e) => console.log(e)}
                    >
                        <IonContent>
                            <ToolsMenu hideMenu={true} />
                        </IonContent>
                    </IonMenu>

                    <IonRouterOutlet id="main">
                        <Page />
                    </IonRouterOutlet>
                </IonSplitPane>
            </IonReactRouter>
        </IonApp>
    );
};

export default App;
