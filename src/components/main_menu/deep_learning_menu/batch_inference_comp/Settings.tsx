import {
    BatchInference, gpu_partition,
    PatchesInterface,
    typePartition
} from "./BatchInferenceInterfaces";
import {
    IonAccordion,
    IonAccordionGroup,
    IonCol,
    IonContent,
    IonInput,
    IonItem, IonItemDivider,
    IonLabel,
    IonList,
    IonRow, IonSelect, IonSelectOption
} from "@ionic/react";
import React from "react";

interface SettingsInterface {
    patches: PatchesInterface,
    onPatches: (patches: PatchesInterface) => void,

    tepuiGPU: gpu_partition,
    onTepuiGPU: (gpu: gpu_partition) => void,

    batch: BatchInference,
    onBatch: (batch: BatchInference) => void,
}

/**
 * Component that create the settings menu
 * @param patches {PatchesInterface} - object that contains the patches in settings
 * @param onPatches {(patches: PatchesInterface) => void} - setter for patches
 * @param batch {BatchInference} - object that contains the batch value
 * @param onBatch {(batch: BatchInference) => void} - setter for batch
 */
const Settings: React.FC<SettingsInterface> = ({
                                                   patches,
                                                   onPatches,
                                                   tepuiGPU,
                                                   onTepuiGPU,
                                                   batch,
                                                   onBatch
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
                                <IonLabel>Remote GPU's</IonLabel>
                                <IonSelect
                                    interface={"popover"}
                                    value={tepuiGPU}
                                    onIonChange={(e: CustomEvent) =>
                                        onTepuiGPU(e.detail.value as gpu_partition)}>
                                    {typePartition.map((type) => {
                                        return (
                                            <IonSelectOption
                                                key={type.key}
                                                value={type.value}>{type.label}</IonSelectOption>
                                        );
                                    })}
                                </IonSelect>
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