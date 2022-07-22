import './Network.css'
import {
    IonAccordion,
    IonAccordionGroup,
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
    IonSelect,
    IonSelectOption,
    IonTextarea,
} from '@ionic/react'
import { useState } from 'react'
import { useEventBus } from '../../../../utils/eventbus'

/**
 *
 * IonAccordion element that represents the Import Network component of the Network Module.
 */
const ImportNetworkComp: React.FC = () => {
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
        <IonAccordion>
            <IonItem slot={'header'}>
                <IonLabel>
                    <small>Import Network</small>
                </IonLabel>
            </IonItem>
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
                {/* <IonItem>
                            <IonLabel><small>Network Info</small></IonLabel>
                        </IonItem> */}
                <IonCard>
                    {/* <IonLabel><small>Network Info</small></IonLabel> */}
                    <IonCardHeader>
                        <IonCardTitle>
                            <small>Network Info</small>
                        </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <IonTextarea
                            className={'display-textarea-terminal-like-dark'}
                            value={networkInfoText}
                        />
                    </IonCardContent>
                </IonCard>
            </IonList>
        </IonAccordion>
    )
}

/**
 *
 * IonAccordion element that represents the Dataset component of the Network Module.
 */
const LoadDatasetComp: React.FC = () => {
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
        <IonAccordion>
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
                {/* <IonItem>
                            <IonLabel><small>Network Info</small></IonLabel>
                        </IonItem> */}
                <IonCard>
                    {/* <IonLabel><small>Network Info</small></IonLabel> */}
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
        </IonAccordion>
    )
}

/**
 *
 * IonAccordion element that represents the Dataset component of the Network Module.
 */
const SettingsComp: React.FC = () => {
    const [curMachineMode, setCurMachineMode] = useState<string>('local');
    const [curGPUModeVal, setCurGPUModeVal] = useState<number>(2);
    const [cachePath, setCachePath] = useState<string>('/tmp');
    const [maxGPUs, setMaxGPUs] = useState<number>(4);

    const listGPUoptions  = [
        {id: 1, label: '1 GPU'}, 
        {id: 2, label: '2 GPUs'}, 
        {id: 4, label: '4 GPUs'}, 
        {id: 8, label: '8 GPUs'}, 
    ];

    useEventBus('workspaceLoaded', (isDisabled: boolean) => {
        if (isDisabled) {
            // sfetch here
            console.log('workspaceLoaded > fetch max gpus');
            setMaxGPUs(4);
        };
    });

    function selectOptionGPU(GPUval: {id: number, label: string}) {
        const isDisabled : boolean = (GPUval.id > maxGPUs); 
        return (
            <IonSelectOption value={GPUval.id} disabled={isDisabled}>{GPUval.label}</IonSelectOption>
        );
    }

    return (
        <IonAccordion>
            <IonItem slot={'header'}>
                <IonLabel>
                    <small>Hardware Settings</small>
                </IonLabel>
            </IonItem>
            {/*Ion select option*/}
            <IonList slot={'content'}>
                {/* Select Dataset */}
                <IonItem disabled={false} >
                    <IonLabel>
                        <small>Select Hardware Mode</small>
                    </IonLabel>
                    <IonSelect
                        interface='popover'
                        value={curMachineMode}
                        onIonChange={(e) => {
                            console.log(
                                'Network ... SettingsComp: Mode changed',
                                e.detail.value
                            )
                            setCurMachineMode(e.detail.value)
                        }}
                    >
                        <IonSelectOption value='local'>Local</IonSelectOption>
                        <IonSelectOption value='tepui' disabled={false}>Tepui</IonSelectOption>
                    </IonSelect>
                </IonItem>
                <IonItem>
                    <IonLabel>
                        <small>Selected GPUs</small>
                    </IonLabel>
                    <IonSelect
                        interface='popover'
                        value={curGPUModeVal}
                        onIonChange={(e) => {
                            console.log(
                                'Network ... GPU Mode changed',
                                e.detail.value
                            )
                            setCurGPUModeVal(e.detail.value)
                        }}
                    >
                        { listGPUoptions.map(selectOptionGPU) }
                    </IonSelect>
                </IonItem>
                <IonItem>
                    <IonLabel position={'fixed'}>
                        <small>Cache Path</small>
                    </IonLabel>
                    <IonInput
                        value={cachePath}
                        onIonChange={(e: CustomEvent) => {
                            setCachePath(e.detail.value as string)
                        }}
                    />
                </IonItem>
            </IonList>
        </IonAccordion>
    )
}

/**
 * Parent component that creates the list of items of the network component (NetworkComp) nested in the network module (NetworkModuleComp)
 * @returns
 */
const NetworkComp: React.FC = () => {
    return (
        <small>
            <IonContent scrollEvents={true}>
                <IonAccordionGroup multiple={true}>
                    <ImportNetworkComp />
                    <LoadDatasetComp />
                    <SettingsComp />
                </IonAccordionGroup>
            </IonContent>
        </small>
    )
}

export default NetworkComp
