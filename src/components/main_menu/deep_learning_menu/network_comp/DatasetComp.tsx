import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonInput, IonItem, IonLabel, IonList, IonTextarea } from "@ionic/react";
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
                <IonList>
                    <IonItem slot={'header'}>
                        <IonLabel>
                            <small>Import Dataset</small>
                        </IonLabel>
                    </IonItem>
                    {/*Ion select option*/}
                    <IonList slot={'content'}>
                        {/* Select Dataset */}
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
                        <IonCard>
                            <IonCardHeader>
                                <IonCardTitle>
                                    <small>Dataset Info</small>
                                </IonCardTitle>
                            </IonCardHeader>
                            <IonCardContent>
                                <IonTextarea
                                    className={'display-textarea-terminal-like-dark'}
                                    value={datasetInfoText}
                                />
                            </IonCardContent>
                        </IonCard>
                    </IonList>
                </IonList>
            </IonContent>
        </small>
    )
}

export default DatasetComp