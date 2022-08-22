import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonInput, IonItem, IonLabel, IonList, IonRow, IonTextarea } from "@ionic/react";
import {  useState } from "react";
import { sfetch } from "../../../../utils/simplerequest";

/**
 *
 * IonAccordion element that represents the Dataset component of the Network Module.
 */
 const DatasetComp: React.FC = () => {
    const [importDatasetPath, setImportDatasetPath] = useState<string>('')

    const [datasetInfoText, setDatasetInfoText] = useState<string>('')

    const onClickImportDataset = () => {
        console.log('NetworkComp Import Dataset readFile path:', importDatasetPath)

        const args = {'path': '/home/brunocarlos_lnls/work/images/dataset_augmented.h5'};
        
        sfetch('POST', `/import_dataset`, JSON.stringify(args), 'json')
        .then((info: string) => {
            setDatasetInfoText(info);
            // dispatches
        })
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
                        placeholder={'absolute/path/to/dataset.h5'}
                        onIonChange={(e: CustomEvent) => {
                            setImportDatasetPath(e.detail.value as string)
                        }}
                    />
                    <IonButton
                        slot={'end'}
                        size={'default'}
                        color={'tertiary'}
                        onClick={onClickImportDataset}
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