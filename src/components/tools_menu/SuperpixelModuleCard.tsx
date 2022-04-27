import { IonItem, IonLabel, IonInput, IonSelect, IonSelectOption } from '@ionic/react';
import {sfetch} from '../../utils/simplerequest';
import {ModuleCard, ModuleCardItem} from './ModuleCard';
import {dispatch, useEventBus} from '../../utils/eventbus';
import {useStorageState} from 'react-storage-hooks';
import LoadingComponent from "./LoadingComponent";
import {useState} from "react";

interface SuperpixelState {
    compactness: number;
    seedsSpacing: number;
    method: string;
}

const SuperpixelModuleCard: React.FC = () => {

    const [superpixelParams, setSuperpixelParams] = useStorageState<SuperpixelState>(localStorage, 'superpixelParams', {
        compactness: 1000,
        seedsSpacing: 4,
        method: 'waterpixels'
    });

    const [disabled, setDisabled] = useStorageState<boolean>(sessionStorage, "ActivateComponents", false);
    const [activateLoading, setActivateLoading] = useState<boolean>(false);

    useEventBus("ActivateComponents", (activateMenu) => {
        setDisabled(activateMenu);
    })

    function onApply() {
        setDisabled(true);
        setActivateLoading(true);
        const params = {
            superpixel_type: superpixelParams.method,
            seed_spacing: superpixelParams.seedsSpacing,
            compactness: superpixelParams.compactness
        };
        sfetch('POST', '/superpixel', JSON.stringify(params))
        .then(() => {
            dispatch('superpixelChanged', {});
        })
        .finally(() => {
            setDisabled(false);
            setActivateLoading(false);
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
                        <IonSelectOption>waterpixels</IonSelectOption>
                        <IonSelectOption value="waterpixels3d">waterpixels 3D</IonSelectOption>
                        <IonSelectOption disabled>slic</IonSelectOption>
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
                <LoadingComponent
                        openLoadingWindow={activateLoading}
                        loadingText={"Generating superpixel"}/>
            </ModuleCardItem>
        </ModuleCard>

    );
};

export default SuperpixelModuleCard;
