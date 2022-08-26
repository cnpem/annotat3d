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
    IonRow
} from '@ionic/react'
import { useState } from 'react'
import { sfetch } from '../../../../utils/simplerequest'

/**
 *
 * Element that represents the Import Network component of the Network Module.
 */
const NetworkComp: React.FC = () => {
    const [importNetworkPath, setImportNetworkPath] = useState<string>('')
    const [importNetworkName, setImportNetworkName] = useState<string>('')

    const [networkInfoText, setNetworkInfoText] = useState<string>('')

    const onClickImportNetwork = () => {
        console.log('I clicked:')
        // setNetworkInfoText('this is temporary');
        const newNetworkInputInfo = {
            path: importNetworkPath,
            name: importNetworkName
        }

        sfetch('POST', `/import_network`, JSON.stringify(newNetworkInputInfo), 'json')
        .then((networkdisplayInfo: string) => {
            setNetworkInfoText(networkdisplayInfo);
            // dispatches
        })
        // .catch((error: ErrorInterface) => {
            // console.log('error while trying to add an image')
            // console.log(error.error_msg);
            // setErrorMsg(error.error_msg);
            // setShowErrorWindow(true);
        // })
    }

    return (
        <small>
            <IonContent>
                <IonItem>
                    <IonLabel position={'fixed'}>
                        <small>New Network Path</small>
                    </IonLabel>
                    <IonInput
                        value={importNetworkPath}
                        placeholder={'/Absolute/Path/to/New/Network.model.tar.gz'}
                        onIonChange={(e: CustomEvent) => {
                            setImportNetworkPath(e.detail.value as string)
                        }}
                    />
                </IonItem>
                <IonItem>
                    <IonLabel position={'fixed'}>
                        <small>New Network Name</small>
                    </IonLabel>
                    <IonInput
                        value={importNetworkName}
                        placeholder={'NewNetworkName'}
                        onIonChange={(e: CustomEvent) => {
                            setImportNetworkName(e.detail.value as string)
                        }}
                    />
                    <IonButton
                        slot={'end'}
                        size={'default'}
                        color={'tertiary'}
                        onClick={onClickImportNetwork}
                    >
                        Import Network
                    </IonButton>
                </IonItem>
                <IonRow>
                    <IonCard className={'card-display-terminal'}>
                        <IonCardHeader>
                            <IonCardTitle>
                                <small>Network Info</small>
                            </IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            {networkInfoText}
                        </IonCardContent>
                    </IonCard>
                </IonRow>
            </IonContent>
        </small>
    )
}

export default NetworkComp
