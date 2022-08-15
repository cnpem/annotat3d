import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonInput, IonItem, IonLabel, IonList, IonRow, IonTextarea } from "@ionic/react";
import {  useState } from "react";

/**
 *
 * IonAccordion element that represents the Dataset component of the Network Module.
 */
 const DatasetComp: React.FC = () => {
    const [importDatasetPath, setImportDatasetPath] = useState<string>('')

    const [datasetInfoText, setDatasetInfoText] = useState<string>('')

    const loadDataset = (datasetInfo: string) => {
        console.log('NetworkComp Import Dataset readFile path:', datasetInfo)
        setDatasetInfoText(
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
                <IonItem>
                    <IonLabel position={'fixed'}>
                        <small>Dataset Path</small>
                    </IonLabel>
                    <IonInput
                        value={importDatasetPath}
                        placeholder={'/path/to/dataset.h5'}
                        onIonChange={(e: CustomEvent) => {
                            setImportDatasetPath(e.detail.value as string)
                        }}
                    />
                    <IonButton
                        slot={'end'}
                        size={'default'}
                        color={'tertiary'}
                        onClick={() => {
                            loadDataset(importDatasetPath)
                        }}
                    >
                        Load Dataset
                    </IonButton>
                </IonItem>
                <IonRow>
                    <IonCard className={'card-display-terminal'}>
                        <IonCardHeader>
                            <IonCardTitle>
                                <small>Dataset Info</small>
                            </IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            {datasetInfoText}
                        </IonCardContent>
                    </IonCard>
                </IonRow>
            </IonContent>
        </small>
    )
}

export default DatasetComp