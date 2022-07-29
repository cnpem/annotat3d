import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonTextarea } from "@ionic/react";
import { useState } from "react";

const LogComp: React.FC = () => {
    const [logText, setLogText] = useState<string>('Set text here from backend. Who is the trigger?');

    return (
        <small>
            <IonContent>
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>
                            <small>Log</small>
                        </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <IonTextarea
                            className={'display-textarea-terminal-like-dark'}
                            value={logText}
                        />
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </small>
    );
}

export default LogComp