import { IonContent, IonItem } from "@ionic/react";

const BoardComp: React.FC = () => {
    return (
        <small>
            <IonContent>
                <IonItem class='item-display-tensorboard'>
                    <iframe className='display-tensorboard' title='unique' src="http://localhost:6006/"/>
                </IonItem>
            </IonContent>
        </small>
    );
}

export default BoardComp