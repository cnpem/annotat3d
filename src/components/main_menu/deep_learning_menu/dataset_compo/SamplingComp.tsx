import React from "react";
import {
    IonAccordion,
    IonAccordionGroup, IonCol,
    IonContent,
    IonIcon, IonInput,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList, IonRow
} from "@ionic/react";
import {construct} from "ionicons/icons";
import {useStorageState} from "react-storage-hooks";

interface SamplingInterface {
    nClasses: number,
    sampleSize: number,
    patchSize: Array<number>;
}

/**
 * Component that hold all the Sampling options
 */
const SamplingComp: React.FC = () => {

    const [sampleElement, setSampleElement] = useStorageState<SamplingInterface>(sessionStorage, "sampleElement", {
        nClasses: 2,
        sampleSize: 100,
        patchSize: [256, 256, 1],
    });

    return (
        <small>
            <IonContent
                scrollEvents={true}
                onIonScrollStart={() => {
                }}
                onIonScroll={() => {
                }}
                onIonScrollEnd={() => {
                }}>
                <IonAccordionGroup multiple={true}>
                    {/*Sampling menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
                            <IonLabel><small>Data</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <IonItem>
                                <IonLabel>bla ?</IonLabel>
                            </IonItem>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Label menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
                            <IonLabel><small>Label</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <IonItem>
                                <IonLabel>bla ?</IonLabel>
                            </IonItem>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Weight menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
                            <IonLabel><small>Weight</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <IonItem>
                                <IonLabel>bla ?</IonLabel>
                            </IonItem>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Sampling menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
                            <IonLabel><small>Sampling</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            {/*# Classes*/}
                            <IonItem>
                                <IonRow>
                                    <IonCol>
                                        <IonLabel># Classes</IonLabel>
                                        <div style={{display: "flex", justifyContent: "flex-start"}}>
                                            <IonInput
                                                type={"number"}
                                                min={"0"} value={sampleElement.nClasses}
                                                onIonChange={(e: CustomEvent) => {
                                                    setSampleElement({
                                                        ...sampleElement,
                                                        nClasses: parseInt(e.detail.value!, 10)
                                                    })
                                                }}/>
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonItem>
                            {/*Sample Size*/}
                            <IonItem>
                                <IonRow>
                                    <IonCol>
                                        <IonLabel>Sample Size</IonLabel>
                                        <div style={{display: "flex", justifyContent: "flex-start"}}>
                                            <IonInput
                                                type={"number"}
                                                min={"0"} value={sampleElement.sampleSize}
                                                onIonChange={(e: CustomEvent) => {
                                                    setSampleElement({
                                                        ...sampleElement,
                                                        sampleSize: parseInt(e.detail.value!, 10)
                                                    })
                                                }}/>
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonItem>
                            {/*Patch Size*/}
                            <IonItem>
                                <IonRow>
                                    <IonCol>
                                        <IonLabel>Patch Size</IonLabel>
                                        <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                value={sampleElement.patchSize[0]}
                                                placeholder="X"
                                                onIonChange={(e: CustomEvent) => setSampleElement({
                                                    ...sampleElement,
                                                    patchSize: [parseInt(e.detail.value!, 10), sampleElement.patchSize[1], sampleElement.patchSize[2]]
                                                })}
                                            />
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                value={sampleElement.patchSize[1]}
                                                placeholder="Y"
                                                onIonChange={(e: CustomEvent) => setSampleElement({
                                                    ...sampleElement,
                                                    patchSize: [sampleElement.patchSize[0], parseInt(e.detail.value!, 10), sampleElement.patchSize[2]]
                                                })}
                                            />
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                value={sampleElement.patchSize[2]}
                                                placeholder="Z"
                                                onIonChange={(e: CustomEvent) => setSampleElement({
                                                    ...sampleElement,
                                                    patchSize: [sampleElement.patchSize[0], sampleElement.patchSize[1], parseInt(e.detail.value!, 10)]
                                                })}
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

export default SamplingComp;