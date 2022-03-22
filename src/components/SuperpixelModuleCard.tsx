

import { IonCard, IonCardTitle, IonCardHeader, IonCardSubtitle, IonCardContent, IonButton, IonAccordion, IonAccordionGroup, IonTitle, IonItem, IonItemDivider, IonLabel, IonList, IonInput, IonGrid, IonRow, IonSelect, IonSelectOption, IonSpinner, useIonLoading, IonContent } from '@ionic/react';
import {Fragment, useState} from 'react';

const moduleName = "Superpixel Module";

interface SuperpixelState {
    compactness: number;
    seedsSpacing: number;
    method: string;
}

const SuperpixelModuleCard: React.FC = () => {

    const [value, setValue] = useState<SuperpixelState>({
        compactness: 100,
        seedsSpacing: 2,
        method: 'waterpixel'
    });

    return (
        <IonCard>
            <IonCardHeader color="primary">
                <IonCardTitle>
                    { moduleName }
                </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <IonCard>
                    <IonAccordionGroup>
                        <IonAccordion>
                            <IonItem button slot="header">
                                <IonLabel color="primary">Superpixel parameters</IonLabel>
                            </IonItem>
                            <IonGrid slot="content">
                                <IonRow>
                                    <IonItem>
                                        <IonLabel position="floating">method</IonLabel>
                                        <IonSelect interface="alert"
                                            value={ value.method }
                                            onIonChange={ (e) => { setValue({...value, method: e.detail.value}); }  }>
                                            <IonSelectOption>slic</IonSelectOption>
                                            <IonSelectOption>waterpixel</IonSelectOption>
                                        </IonSelect>
                                    </IonItem>
                                </IonRow>
                                <IonRow>
                                    <IonItem>
                                        <IonLabel position="floating">seeds distance</IonLabel>
                                        <IonInput min={2} max={32} type="number"
                                            value={ value.seedsSpacing }
                                            onIonChange={ (e) => { setValue({ ...value, seedsSpacing: +e.detail.value! })  } }>
                                        </IonInput>
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel position="floating">compactness</IonLabel>
                                        <IonInput min={1} max={99999} type="number"
                                            value={ value.compactness }
                                            onIonChange = { (e) => { setValue({ ...value, compactness: +e.detail.value!  }) } }>
                                        </IonInput>
                                    </IonItem>
                                </IonRow>
                            </IonGrid>
                        </IonAccordion>
                    </IonAccordionGroup>
                </IonCard>

                {
                    JSON.stringify(value)
                }

                <div style = { { "display": "flex", "justifyContent": "flex-end" } }>
                    <IonButton color="primary">Apply</IonButton>
                </div>
            </IonCardContent>
        </IonCard>

    );
};

export default SuperpixelModuleCard;
