import './Network.css'
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonItem, IonLabel, IonPopover, IonRow, IonToggle } from "@ionic/react";
import { useEffect, useState } from "react";
import { sfetch } from "../../../../utils/simplerequest";





const TrainingComp: React.FC = () => {
    const [logText, setLogText] = useState<string>('');
    const [logMode, setLogMode] = useState<boolean>(false);
    const [hostMode, setHostMode] = useState<boolean>(true);

    const timer : number = 1000;


    /** Updates the logText variable using fetch to a backend function if logMode is active. */
    useEffect(() => {
        console.log('on useEffect');

        const handlerOnLogMode = () => {
            console.log('reading log: ');
            sfetch("POST", '/read_log', JSON.stringify(''), 'text')
            .then(
                (msg) => {
                    console.log(msg);
                    if (msg === 'done training') {
                        setLogMode(false)
                    }
                    setLogText(logText+msg+'\n');
                }
            );
        }

        if (logMode) {
            const interval = setInterval(() => handlerOnLogMode(), timer);
            console.log('TrainingComp: updating log.');
            return () => {
                clearInterval(interval);
            };
        }
    }, [logMode, logText]);


    const handlerOnTrainButton = () => {
        setLogMode(true)
        sfetch("POST", '/dummy_training', JSON.stringify(''), 'text')
        .then(
            (msg: string) => {
                console.log(msg);
            }
        );
    };

    const handlerOnFinetuneButton = () => {
        // console.log(e.detail.value);
        console.log('Disabling logMode');
        setLogMode(false);
        setLogText('');
    };    

    return (
        <small>
            <IonContent>
                <IonRow className={'ion-row-justify-content-end'}>
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
                </IonRow>
                <IonRow>
                    <IonCard className={'card-display-terminal'}>
                        <IonCardHeader>
                            <IonCardTitle>
                                <small>Log</small>
                            </IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            {logText}
                        </IonCardContent>
                    </IonCard>
                </IonRow>
                
            </IonContent>
        </small>
    );
}

export default TrainingComp