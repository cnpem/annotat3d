import React from "react";
import {SideMenuVizInterface} from "./TypeScriptFiles/Interfaces/SideMenuVizInterface";
import {IonCard, IonCardContent, IonContent} from "@ionic/react";

const SideMenuVis: React.FC<SideMenuVizInterface> = (args) => {

    return(
        <React.Fragment>
            <IonContent>
                <IonCard>
                    <IonCard>
                        <IonCardContent>
                            Não se importe aqui, to só testando aqui
                        </IonCardContent>
                    </IonCard>
                </IonCard>
            </IonContent>
        </React.Fragment>
    );
}

export default SideMenuVis;