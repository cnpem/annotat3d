

import { IonCard, IonCardTitle, IonCardHeader, IonCardSubtitle, IonCardContent, IonButton, IonAccordion, IonAccordionGroup, IonTitle, IonItem, IonItemDivider, IonLabel, IonList, IonInput, IonGrid, IonRow, IonSelect, IonSelectOption, IonSpinner, useIonLoading, IonContent, IonIcon, IonFooter, IonHeader, IonChip, IonToolbar } from '@ionic/react';
import {arrowDown} from 'ionicons/icons';
import {Fragment, useState} from 'react';
import {sfetch} from '../../utils/simplerequest';
import {ModuleCard, ModuleCardItem} from './ModuleCard';
import {dispatch} from '../../utils/eventbus';

interface SuperpixelState {
    compactness: number;
    seedsSpacing: number;
    method: string;
}

const SuperpixelModuleCard: React.FC = () => {

    const [superpixelParams, setSuperpixelParams] = useState<SuperpixelState>({
        compactness: 1000,
        seedsSpacing: 4,
        method: 'waterpixel'
    });

    const [disabled, setDisabled] = useState<boolean>(false);

    function onApply() {
        setDisabled(true);
        const params = {
            superpixel_type: superpixelParams.method,
            seed_spacing: superpixelParams.seedsSpacing,
            compactness: superpixelParams.compactness
        };
        sfetch('POST', '/superpixel', JSON.stringify(params))
        .then(() => { 
            console.log('computed superpixel ok');
            dispatch('superpixelChanged', {});
        })
        .finally(() => {
            setDisabled(false);
        });
    }

    return (
        <ModuleCard name="Superpixel" onApply={onApply} disabled={disabled}>

            <ModuleCardItem name="Superpixel Parameters">
                <IonItem>
                    <IonLabel position="floating">method</IonLabel>
                    <IonSelect interface="popover"
                        value={ superpixelParams.method }
                        onIonChange={ (e) => { setSuperpixelParams({...superpixelParams, method: e.detail.value}); }  }>
                        <IonSelectOption>slic</IonSelectOption>
                        <IonSelectOption>waterpixel</IonSelectOption>
                    </IonSelect>
                </IonItem>
                <IonItem>
                    <IonLabel position="floating">seeds distance</IonLabel>
                    <IonInput min={2} max={32} type="number"
                        value={ superpixelParams.seedsSpacing }
                        onIonChange={ (e) => { setSuperpixelParams({ ...superpixelParams, seedsSpacing: +e.detail.value! })  } }>
                    </IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel position="floating">compactness</IonLabel>
                    <IonInput min={1} max={99999} type="number"
                        value={ superpixelParams.compactness }
                        onIonChange = { (e) => { setSuperpixelParams({ ...superpixelParams, compactness: +e.detail.value!  }) } }>
                    </IonInput>
                </IonItem>
            </ModuleCardItem>
            <div>{JSON.stringify(superpixelParams)}</div>
        </ModuleCard>

    );
};

export default SuperpixelModuleCard;
