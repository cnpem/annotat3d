

import { IonCard, IonCardTitle, IonCardHeader, IonCardSubtitle, IonCardContent, IonButton, IonAccordion, IonAccordionGroup, IonTitle, IonItem, IonItemDivider, IonLabel, IonList, IonInput, IonGrid, IonRow, IonSelect, IonSelectOption, IonSpinner, useIonLoading, IonContent, IonIcon, IonFooter, IonHeader, IonChip, IonToolbar } from '@ionic/react';
import {arrowDown} from 'ionicons/icons';
import {Fragment, useState} from 'react';
import {sfetch} from '../../utils/simplerequest';
import {ModuleCard, ModuleCardItem} from './ModuleCard';
import {dispatch} from '../../utils/eventbus';
import {useStorageState} from 'react-storage-hooks';

interface SuperpixelState {
    compactness: number;
    seedsSpacing: number;
    method: string;
}

const SuperpixelModuleCard: React.FC = () => {

    const [value, setValue] = useStorageState<SuperpixelState>(localStorage, 'superpixelParams', {
        compactness: 1000,
        seedsSpacing: 4,
        method: 'waterpixel'
    });

    const [disabled, setDisabled] = useState<boolean>(false);

    function onApply() {
        setDisabled(true);
        const params = {
            superpixel_type: value.method,
            seed_spacing: value.seedsSpacing,
            compactness: value.compactness
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
                        value={ value.method }
                        onIonChange={ (e) => { setValue({...value, method: e.detail.value}); }  }>
                        <IonSelectOption>slic</IonSelectOption>
                        <IonSelectOption>waterpixel</IonSelectOption>
                    </IonSelect>
                </IonItem>
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
            </ModuleCardItem>
        </ModuleCard>

    );
};

export default SuperpixelModuleCard;
