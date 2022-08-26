import {
    PatchesInterface
} from "./BatchInferenceInterfaces";
import {
    IonAccordion,
    IonAccordionGroup, IonCheckbox,
    IonCol,
    IonContent,
    IonInput,
    IonItem, IonItemDivider,
    IonLabel,
    IonList,
    IonRow
} from "@ionic/react";
import React from "react";
import { SelectInterface } from "../Utils/WorkspaceInterfaces";

interface SettingsInterface {
    patches: PatchesInterface,
    onPatches: (patches: PatchesInterface) => void,

    isInferenceOpChecked: boolean,
    onIsInferenceOpChecked: (checked: boolean) => void,

    availableGpus: SelectInterface[]
}

/**
 * Component that create the settings menu
 * @param patches {PatchesInterface} - object that contains the patches in settings
 * @param onPatches {(patches: PatchesInterface) => void} - setter for patches
 * @param isInferenceOpChecked {boolean} - variable to use as a flog to activate the inference
 * @param onIsInferenceOpChecked {(checked: boolean) => void} - setter for isInferenceOpChecked
 * @param availableGpus {SelectInterface[]} - vector of SelectInterface that contains all the available gpus to use for inference
 */
const Settings: React.FC<SettingsInterface> = ({
                                                   patches,
                                                   onPatches,
                                                   isInferenceOpChecked,
                                                   onIsInferenceOpChecked,
                                                   availableGpus
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
                                <IonLabel>Available GPU's</IonLabel>
                                <IonList>
                                    {availableGpus.map((gpu) => {
                                        return (
                                            <IonItem
                                                key={gpu.key}>{gpu.value}</IonItem>
                                        );
                                    })}
                                </IonList>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Inference Optimization</IonLabel>
                                <IonCheckbox
                                    checked={isInferenceOpChecked}
                                    onIonChange={() => onIsInferenceOpChecked(!isInferenceOpChecked)}/>
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
                                                value={patches.patchBorder[0]}
                                                placeholder="X"
                                                onIonChange={(e: CustomEvent) => {
                                                    if (e.detail.value <= 999) {
                                                        onPatches({
                                                            ...patches,
                                                            patchBorder: [parseInt(e.detail.value!, 10), patches.patchBorder[1], patches.patchBorder[2]]
                                                        });
                                                    }
                                                }}
                                            />
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                max={"999"}
                                                value={patches.patchBorder[1]}
                                                placeholder="Y"
                                                onIonChange={(e: CustomEvent) => {
                                                    if (e.detail.value <= 999) {
                                                        onPatches({
                                                            ...patches,
                                                            patchBorder: [patches.patchBorder[0], parseInt(e.detail.value!, 10), patches.patchBorder[2]]
                                                        });
                                                    }
                                                }}
                                            />
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                value={patches.patchBorder[2]}
                                                placeholder="Z"
                                                onIonChange={(e: CustomEvent) => {
                                                    if (e.detail.value <= 999) {
                                                        onPatches({
                                                            ...patches,
                                                            patchBorder: [patches.patchBorder[0], patches.patchBorder[1], parseInt(e.detail.value!, 10)]
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