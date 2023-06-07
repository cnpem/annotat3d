import { IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, useIonToast } from '@ionic/react';
import { sfetch } from '../../../utils/simplerequest';
import { ModuleCard, ModuleCardItem } from './ModuleCard';
import { dispatch, useEventBus } from '../../../utils/eventbus';
import { useStorageState } from 'react-storage-hooks';
import LoadingComponent from '../utils/LoadingComponent';
import { useState } from 'react';
import { SuperpixelType, SuperpixelState } from './SuperpixelSegInterface';

const SuperpixelModuleCard: React.FC = () => {
    const [superpixelParams, setSuperpixelParams] = useStorageState<SuperpixelState>(
        sessionStorage,
        'superpixelParams',
        {
            compactness: 1000,
            seedsSpacing: 4,
            method: 'waterpixels',
        }
    );

    const [showToast] = useIonToast();
    const timeToast = 2000;
    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', false);
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);

    useEventBus('LockComponents', (changeLockMenu) => {
        setLockMenu(changeLockMenu);
    });

    useEventBus('recalcSuperpixel', (recalc: boolean) => {
        if (recalc) {
            onApply();
            dispatch('recalcSuperpixel', false);
        }
    });

    useEventBus('setSuperpixelParams', (superpixel: SuperpixelState) => {
        setSuperpixelParams(superpixel);
        setSuperpixelParams(superpixel);
    });

    function onApply(): void {
        setLockMenu(true);
        setShowLoadingComp(true);
        const params = {
            superpixel_type: superpixelParams.method,
            seed_spacing: superpixelParams.seedsSpacing,
            compactness: superpixelParams.compactness,
            use_pixel_segmentation: false,
        };
        sfetch('POST', '/superpixel', JSON.stringify(params))
            .then(() => {
                dispatch('superpixelChanged', {});
                dispatch('superpixelParams', params);
            })
            .finally(() => {
                setLockMenu(false);
                setShowLoadingComp(false);
                void showToast('Superpixel successfully applied !', timeToast);
            });
    }

    return (
        <ModuleCard name="Superpixel" onApply={onApply} disabled={lockMenu}>
            <ModuleCardItem name="Superpixel Parameters">
                <IonItem>
                    <IonLabel position="floating">method</IonLabel>
                    <IonSelect
                        interface="popover"
                        value={superpixelParams.method}
                        onIonChange={(e: CustomEvent) => {
                            setSuperpixelParams({
                                ...superpixelParams,
                                method: e.detail.value as SuperpixelType,
                            });
                        }}
                    >
                        <IonSelectOption>waterpixels</IonSelectOption>
                        <IonSelectOption value="waterpixels3d">waterpixels 3D</IonSelectOption>
                    </IonSelect>
                </IonItem>
                <IonItem>
                    <IonLabel position="floating">seeds distance</IonLabel>
                    <IonInput
                        min={2}
                        max={32}
                        type="number"
                        value={superpixelParams.seedsSpacing}
                        onIonChange={(e: CustomEvent) => {
                            setSuperpixelParams({ ...superpixelParams, seedsSpacing: +e.detail.value! });
                        }}
                    ></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel position="floating">compactness</IonLabel>
                    <IonInput
                        min={1}
                        max={99999}
                        type="number"
                        value={superpixelParams.compactness}
                        onIonChange={(e: CustomEvent) => {
                            setSuperpixelParams({ ...superpixelParams, compactness: +e.detail.value! });
                        }}
                    ></IonInput>
                </IonItem>
                <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={'Generating superpixel'} />
            </ModuleCardItem>
        </ModuleCard>
    );
};

export default SuperpixelModuleCard;
