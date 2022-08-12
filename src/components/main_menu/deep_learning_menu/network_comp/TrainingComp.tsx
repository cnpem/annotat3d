import './Network.css'
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonItem, IonItemDivider, IonLabel, IonPopover, IonTextarea, IonToggle } from "@ionic/react";
import { useState } from "react";
import { sfetch } from "../../../../utils/simplerequest";

const TrainingComp: React.FC = () => {
    const [logText, setLogText] = useState<string>('');
    const [logMode, setLogMode] = useState<boolean>(false);
    const [hostMode, setHostMode] = useState<boolean>(true);

    const handlerOnTrainButton = () => {
        console.log('did i managed to get here?');
        setLogMode(true)
        sfetch("POST", "/dummy_training/10", JSON.stringify(''), "json")
        .then(
            (msg: string) => {
                console.log(msg)
                if (msg === 'done training') {
                    setLogMode(false) 
                }
            }
        );
    };

    const handlerOnFinetuneButton = () => {
        // console.log(e.detail.value);
        console.log('lets finetune?!')
    };    

    return (
        <small>
            <IonContent>

                <IonItemDivider>
                <IonItem slot={'end'}>
                    <IonItem>
                        <IonLabel>Host Mode</IonLabel>
                        <IonToggle checked={hostMode} onIonChange={e => setHostMode(e.detail.checked)} />
                    </IonItem>
                    <IonButton
                        color={'secondary'}
                        size={'default'}
                        onClick={handlerOnTrainButton}
                    >
                        Train
                    </IonButton>
                    <IonButton
                        id={"finetune"}
                        color={'secondary'}
                        size={'default'}
                        onClick={handlerOnFinetuneButton}
                    >
                        finetune
                    </IonButton>
                    <IonButton
                        id={'export-network-popover'}
                        color={'tertiary'}
                        size={'default'}
                    >
                        Export Network
                    </IonButton>
                    <IonPopover
                        trigger={'export-network-popover'}
                        side={'bottom'}
                        // className={'create-h5-popover'}
                        alignment={'end'}>

                        <IonLabel>Hello!</IonLabel>
                    </IonPopover>
                    <IonButton
                        id={'export-inference'}
                        color={'tertiary'}
                        size={'default'}
                        
                    >
                        Export Inference
                    </IonButton>
                    <IonPopover
                        trigger={'export-inference'}
                        side={'bottom'}
                        alignment={'end'}>
                        {/* className={'create-h5-popover'}> */}

                        <IonLabel>Hello2!</IonLabel>
                    </IonPopover>
                </IonItem>

                </IonItemDivider>
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

export default TrainingComp