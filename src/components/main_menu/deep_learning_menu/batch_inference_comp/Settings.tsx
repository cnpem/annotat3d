import {PatchesInterface, SelectInterface} from "./BatchInferenceInterfaces";
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
import {type} from "os";

const typeMachine: SelectInterface[] = [
    {
        key: 0,
        value: "local",
        label: "Local"
    },
    {
        key: 1,
        value: "tepui",
        label: "Tepui"
    }
];

interface SettingsInterface {
    patches: PatchesInterface,
    onPatches: (patches: PatchesInterface) => void,
}

const Settings: React.FC<SettingsInterface> = ({patches, onPatches}) => {
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
                                <IonSelect interface={"popover"}>
                                    {typeMachine.map((type) => {
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
                            <IonItem>
                                {/*Inference Batch menu*/}
                                <IonRow>
                                    <IonCol>
                                        <IonLabel>Inference Batch Size</IonLabel>
                                        <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                                            <IonInput
                                                type="number"
                                                max={"999"}
                                                min={"0"}
                                                value={patches.volumePadding[0]}
                                                onIonChange={(e: CustomEvent) => {
                                                    if (e.detail.value <= 999) {
                                                        onPatches({
                                                            ...patches,
                                                            volumePadding: [parseInt(e.detail.value!, 10), patches.volumePadding[1], patches.volumePadding[2]]
                                                        })
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