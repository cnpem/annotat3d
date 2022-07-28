import './Network.css'
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonText,
    IonTextarea
} from '@ionic/react'
import { useState } from 'react'

/**
 *
 * Element that represents the Import Network component of the Network Module.
 */
const NetworkComp: React.FC = () => {
    const [importNetworkPath, setImportNetworkPath] = useState<string>('')
    const [importNetworkName, setImportNetworkName] = useState<string>('')

    const [networkInfoText, setNetworkInfoText] = useState<string>('')

    const readFile = (path: string) => {
        console.log('NetworkComp Import Dataset readFile path:', path)
        setNetworkInfoText(
            'This is the:\nNetwork Info. Blablalbalbal_break\nblalbalbal blalalbla break\nladfbmdafbmadmbf: msndvuian 10'
        )

        // sfetch('POST', `???`, JSON.stringify(path), 'json').then(
        //     () => {
        //     // dispatches
        //     }).catch((error: ErrorInterface) => {
        //     console.log('error while trying to add an image')
        //     console.log(error.error_msg);
        //     setErrorMsg(error.error_msg);
        //     setShowErrorWindow(true);
        // })
    }

    return (
        <small>
            <IonContent>
                <IonList>
                    {/*Ion select option*/}
                    <IonList slot={'content'}>
                        {/* Import Network */}
                        <IonItem>
                            <IonLabel position={'fixed'}>
                                <small>Network Path</small>
                            </IonLabel>
                            <IonInput
                                value={importNetworkPath}
                                placeholder={'/Path/to/Network.model.tar.gz'}
                                onIonChange={(e: CustomEvent) => {
                                    setImportNetworkPath(e.detail.value as string)
                                }}
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position={'fixed'}>
                                <small>Network Name</small>
                            </IonLabel>
                            <IonInput
                                value={importNetworkName}
                                placeholder={'YourNetworkName'}
                                onIonChange={(e: CustomEvent) => {
                                    setImportNetworkName(e.detail.value as string)
                                }}
                            />
                            <IonButton
                                slot={'end'}
                                size={'default'}
                                color={'tertiary'}
                                onClick={() => {
                                    readFile(importNetworkPath)
                                }}
                            >
                                Import Network
                            </IonButton>
                        </IonItem>
                        <IonCard>
                            <IonCardHeader>
                                <IonCardTitle>
                                    <small>Network Info</small>
                                </IonCardTitle>
                            </IonCardHeader>
                            <IonCardContent>
                                <IonTextarea className={'display-textarea-terminal-like-dark'}>
                                    <IonText>{networkInfoText}</IonText>
                                </IonTextarea>
                            </IonCardContent>
                        </IonCard>
                    </IonList>
                </IonList>
            </IonContent>
        </small>
    )
}

export default NetworkComp
