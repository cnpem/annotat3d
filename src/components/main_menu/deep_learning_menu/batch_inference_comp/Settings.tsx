import {
    BatchInference, CudaDeviceGPU,
    PatchesInterface,
    type_machine, typeMachine,
    typePartition
} from "./BatchInferenceInterfaces";
import {
    IonAccordion,
    IonAccordionGroup, IonCheckbox,
    IonCol,
    IonContent, IonGrid,
    IonInput,
    IonItem, IonItemDivider,
    IonLabel,
    IonList,
    IonRow, IonSelect, IonSelectOption
} from "@ionic/react";
import React, {Fragment} from "react";

/**
 * Component to create the remove devices in TEPUI
 */
const RemoteDevicesComp: React.FC = () => {
    return (
        <Fragment>
            <IonLabel>Partition</IonLabel>
            <IonSelect
                interface={"popover"}>
                {typePartition.map((type) => {
                    return (
                        <IonSelectOption
                            key={type.key}
                            value={type.value}>{type.label}</IonSelectOption>
                    );
                })}
            </IonSelect>
        </Fragment>
    );
}

interface CudaDeviceInterface {
    cudaDevices: CudaDeviceGPU[],
    onCudaDevices: (index: number) => void,
}

/**
 * Function that creates the table with the gpu components
 * @param cudaDevices {CudaDeviceGPU[]} - vector of objects that contains all the CUDA devices
 * @param onCudaDevices {(index: number) => void} - setter for cudaDevices
 */
const CudaDevicesComp: React.FC<CudaDeviceInterface> = ({cudaDevices, onCudaDevices}) => {
    return (
        <IonGrid>
            {/*CUDA devices*/}
            <IonLabel>CUDA devices</IonLabel>
            <IonRow>
                <IonCol>
                    <IonItem disabled={cudaDevices[0].isDisabled}>
                        <IonLabel>{cudaDevices[0].label}</IonLabel>
                        <IonCheckbox
                            checked={cudaDevices[0].isChecked}
                            onIonChange={() => onCudaDevices(0)}/>
                    </IonItem>
                </IonCol>
                <IonCol>
                    <IonItem disabled={cudaDevices[1].isDisabled}>
                        <IonLabel>{cudaDevices[1].label}</IonLabel>
                        <IonCheckbox
                            checked={cudaDevices[1].isChecked}
                            onIonChange={() => onCudaDevices(1)}/>
                    </IonItem>
                </IonCol>
                <IonCol>
                    <IonItem disabled={cudaDevices[2].isDisabled}>
                        <IonLabel>{cudaDevices[2].label}</IonLabel>
                        <IonCheckbox
                            checked={cudaDevices[2].isChecked}
                            onIonChange={() => onCudaDevices(2)}/>
                    </IonItem>
                </IonCol>
                <IonCol>
                    <IonItem disabled={cudaDevices[3].isDisabled}>
                        <IonLabel>{cudaDevices[3].label}</IonLabel>
                        <IonCheckbox
                            checked={cudaDevices[3].isChecked}
                            onIonChange={() => onCudaDevices(3)}/>
                    </IonItem>
                </IonCol>
            </IonRow>
            <IonRow>
                <IonCol>
                    <IonItem disabled={cudaDevices[4].isDisabled}>
                        <IonLabel>{cudaDevices[4].label}</IonLabel>
                        <IonCheckbox
                            checked={cudaDevices[4].isChecked}
                            onIonChange={() => onCudaDevices(4)}/>
                    </IonItem>
                </IonCol>
                <IonCol>
                    <IonItem disabled={cudaDevices[5].isDisabled}>
                        <IonLabel>{cudaDevices[5].label}</IonLabel>
                        <IonCheckbox
                            checked={cudaDevices[5].isChecked}
                            onIonChange={() => onCudaDevices(5)}/>
                    </IonItem>
                </IonCol>
                <IonCol>
                    <IonItem disabled={cudaDevices[6].isDisabled}>
                        <IonLabel>{cudaDevices[6].label}</IonLabel>
                        <IonCheckbox
                            checked={cudaDevices[6].isChecked}
                            onIonChange={() => onCudaDevices(6)}/>
                    </IonItem>
                </IonCol>
                <IonCol>
                    <IonItem disabled={cudaDevices[7].isDisabled}>
                        <IonLabel>{cudaDevices[7].label}</IonLabel>
                        <IonCheckbox
                            checked={cudaDevices[7].isChecked}
                            onIonChange={() => onCudaDevices(7)}/>
                    </IonItem>
                </IonCol>
            </IonRow>
        </IonGrid>
    );
}

interface SettingsInterface {
    patches: PatchesInterface,
    onPatches: (patches: PatchesInterface) => void,

    machine: type_machine,
    onMachine: (machine: type_machine) => void,

    batch: BatchInference,
    onBatch: (batch: BatchInference) => void,

    cudaDevices: CudaDeviceGPU[],
    onCudaDevices: (index: number) => void,
}

/**
 * Component that create the settings menu
 * @param patches {PatchesInterface} - object that contains the patches in settings
 * @param onPatches {(patches: PatchesInterface) => void} - setter for patches
 * @param machine {type_machine} - variable that contains if the machine is local or remote (TEPUI)
 * @param onMachine {(machine: type_machine) => void} - setter for machine
 * @param batch {BatchInference} - object that contains the batch value
 * @param onBatch {(batch: BatchInference) => void} - setter for batch
 * @param cudaDevices {CudaDeviceGPU[]} - vector of objects that contains all the CUDA devices
 * @param onCudaDevices {(index: number) => void} - setter for cudaDevices
 */
const Settings: React.FC<SettingsInterface> = ({
                                                   patches,
                                                   onPatches,
                                                   machine,
                                                   onMachine,
                                                   batch,
                                                   onBatch,
                                                   cudaDevices,
                                                   onCudaDevices
                                               }) => {
    return (
        <small>
            <IonContent scrollEvents={true}>
                <IonAccordionGroup multiple={true}>
                    {/*System menu*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>System</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <IonItem>
                                <IonLabel>Machine</IonLabel>
                                <IonSelect
                                    interface={"popover"}
                                    onIonChange={(e: CustomEvent) => onMachine(e.detail.value as type_machine)}>
                                    {typeMachine.map((type) => {
                                        return (
                                            <IonSelectOption
                                                key={type.key}
                                                value={type.value}>{type.label}</IonSelectOption>
                                        );
                                    })}
                                </IonSelect>
                            </IonItem>
                            <IonItem>
                                {(machine === "local") ? <CudaDevicesComp
                                    cudaDevices={cudaDevices} onCudaDevices={onCudaDevices}/> : <RemoteDevicesComp/>}
                            </IonItem>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Patches menu*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Patches</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            {/*Volume Padding option*/}
                            <IonItem>
                                <IonRow>
                                    <IonCol>
                                        <IonLabel>Volume Padding (X, Y, Z)</IonLabel>
                                        <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                                            <IonInput
                                                type="number"
                                                max={"999"}
                                                min={"0"}
                                                value={patches.volumePadding[0]}
                                                placeholder="X"
                                                onIonChange={(e: CustomEvent) => {
                                                    if (e.detail.value <= 999) {
                                                        onPatches({
                                                            ...patches,
                                                            volumePadding: [parseInt(e.detail.value!, 10), patches.volumePadding[1], patches.volumePadding[2]]
                                                        })
                                                    }
                                                }}
                                            />
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                max={"999"}
                                                value={patches.volumePadding[1]}
                                                placeholder="Y"
                                                onIonChange={(e: CustomEvent) => {
                                                    if (e.detail.value <= 999) {
                                                        onPatches({
                                                            ...patches,
                                                            volumePadding: [patches.volumePadding[0], parseInt(e.detail.value!, 10), patches.volumePadding[2]]
                                                        });
                                                    }
                                                }}
                                            />
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                max={"999"}
                                                value={patches.volumePadding[2]}
                                                placeholder="Z"
                                                onIonChange={(e: CustomEvent) => {
                                                    if (e.detail.value <= 999) {
                                                        onPatches({
                                                            ...patches,
                                                            volumePadding: [patches.volumePadding[0], patches.volumePadding[1], parseInt(e.detail.value!, 10)]
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonItem>
                            {/*Patch Border option*/}
                            <IonItem>
                                <IonRow>
                                    <IonCol>
                                        <IonLabel>Patch Border</IonLabel>
                                        <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                max={"999"}
                                                value={patches.patchBolder[0]}
                                                placeholder="X"
                                                onIonChange={(e: CustomEvent) => {
                                                    if (e.detail.value <= 999) {
                                                        onPatches({
                                                            ...patches,
                                                            patchBolder: [parseInt(e.detail.value!, 10), patches.patchBolder[1], patches.patchBolder[2]]
                                                        });
                                                    }
                                                }}
                                            />
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                max={"999"}
                                                value={patches.patchBolder[1]}
                                                placeholder="Y"
                                                onIonChange={(e: CustomEvent) => {
                                                    if (e.detail.value <= 999) {
                                                        onPatches({
                                                            ...patches,
                                                            patchBolder: [patches.patchBolder[0], parseInt(e.detail.value!, 10), patches.patchBolder[2]]
                                                        });
                                                    }
                                                }}
                                            />
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                value={patches.patchBolder[2]}
                                                placeholder="Z"
                                                onIonChange={(e: CustomEvent) => {
                                                    if (e.detail.value <= 999) {
                                                        onPatches({
                                                            ...patches,
                                                            patchBolder: [patches.patchBolder[0], patches.patchBolder[1], parseInt(e.detail.value!, 10)]
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonItem>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Batch menu*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Batch</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <IonItem disabled={batch.isDisabled}>
                                {/*Inference Batch menu*/}
                                <IonRow>
                                    <IonCol>
                                        <IonLabel>Inference Batch Size</IonLabel>
                                        <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                                            <IonInput
                                                type="number"
                                                max={"99"}
                                                min={"0"}
                                                value={batch.value}
                                                onIonChange={(e: CustomEvent) => {
                                                    if (e.detail.value <= 99) {
                                                        onBatch({
                                                            value: e.detail.value as number,
                                                            isDisabled: batch.isDisabled
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonItem>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                </IonAccordionGroup>
            </IonContent>
        </small>
    );
}

export default Settings;