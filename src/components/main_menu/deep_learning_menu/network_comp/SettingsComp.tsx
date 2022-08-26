import { IonContent, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption } from "@ionic/react";
import { useState } from "react";
import { useEventBus } from "../../../../utils/eventbus"; //needs changing the payload

/**
 *
 * Element that represents the Dataset component of the Network Module.
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

    // useEventBus('workspaceLoaded', (isDisabled: boolean) => {
    //     if (isDisabled) {
    //         // sfetch here
    //         console.log('workspaceLoaded > fetch max gpus');
    //         setMaxGPUs(4);
    //     };
    // });

    function selectOptionGPU(GPUval: {id: number, label: string}) {
        const isDisabled : boolean = (GPUval.id > maxGPUs); 
        return (
            <IonSelectOption value={GPUval.id} disabled={isDisabled}>{GPUval.label}</IonSelectOption>
        );
    }

    return (
        <small>
            <IonContent>
                <IonItem>
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
            </IonContent>
        </small>
    )
}

export default SettingsComp