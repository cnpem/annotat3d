import { IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonCheckbox, useIonToast } from '@ionic/react';
import { sfetch } from '../../../utils/simplerequest';
import { ModuleCard, ModuleCardItem } from './ModuleCard';
import { dispatch, useEventBus } from '../../../utils/eventbus';
import { useStorageState } from 'react-storage-hooks';
import LoadingComponent from '../utils/LoadingComponent';
import { useState } from 'react';
import { colorFromId, defaultColormap } from '../../../utils/colormap';
import { LabelInterface } from '../annotation_menu/label_table/LabelInterface';

interface HierarchicalWatershedState {
    levels: number;
    neighborhood: number; // only 6 or 27
    labels: boolean;
}

const SuperpixelModuleCard: React.FC = () => {
    const [superpixelParams, setSuperpixelParams] = useStorageState<HierarchicalWatershedState>(
        sessionStorage,
        'superpixelParams',
        { levels: 6, neighborhood: 27, labels: false }
    );

    const [showToast] = useIonToast();
    const timeToast = 2000;
    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', false);
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);

    useEventBus('LockComponents', (changeLockMenu) => setLockMenu(changeLockMenu));

    useEventBus('recalcSuperpixel', (recalc: boolean) => {
        if (recalc) {
            onApply();
            dispatch('recalcSuperpixel', false);
        }
    });

    useEventBus('setSuperpixelParams', (params: HierarchicalWatershedState) => {
        setSuperpixelParams(params);
    });

    function onApply(): void {
        if (lockMenu) return;

        setLockMenu(true);
        setShowLoadingComp(true);

        const params = {
            levels: superpixelParams.levels,
            neighborhood: superpixelParams.neighborhood,
            labels: superpixelParams.labels,
        };

        sfetch('POST', '/superpixel', JSON.stringify(params), 'json')
            .then((result) => {
                // Case 1: we received a label vector (normal watershed output)
                if (Array.isArray(result)) {
                    const coloredLabels = result.map((label: LabelInterface) => ({
                        ...label,
                        color: colorFromId(defaultColormap, label.id),
                    }));

                    dispatch('LabelLoaded', coloredLabels);
                    dispatch('labelChanged', '');
                    console.log('Label table updated successfully after watershed.');
                } else {
                    // Case 2: no labelVec returned — still need to update frontend state
                    console.log('Superpixel completed without label output (labels = false).');
                    dispatch('LabelLoaded', []); // empty or keep last depending on your logic
                }

                // Always notify other parts of UI
                dispatch('superpixelChanged', {});
                dispatch('superpixelParams', params);
                dispatch('labelChanged', '');
            })
            .catch((err) => console.error('Error while running hierarchical watershed:', err))
            .finally(() => {
                setLockMenu(false);
                setShowLoadingComp(false);
                void showToast('Hierarchical watershed successfully applied!', timeToast);
                dispatch('labelChanged', '');
            });
    }

    return (
        <ModuleCard name="Hierarchical Watershed" onApply={onApply} disabled={lockMenu}>
            <ModuleCardItem name="Watershed Parameters">
                <IonItem>
                    <IonLabel position="floating">Levels</IonLabel>
                    <IonInput
                        min={1}
                        max={10}
                        type="number"
                        value={superpixelParams.levels}
                        onIonChange={(e: CustomEvent) =>
                            setSuperpixelParams({ ...superpixelParams, levels: +e.detail.value! })
                        }
                    />
                </IonItem>

                <IonItem>
                    <IonLabel position="floating">Neighborhood</IonLabel>
                    <IonSelect
                        interface="popover"
                        value={superpixelParams.neighborhood}
                        onIonChange={(e: CustomEvent) =>
                            setSuperpixelParams({ ...superpixelParams, neighborhood: +e.detail.value! })
                        }
                    >
                        <IonSelectOption value={6}>6</IonSelectOption>
                        <IonSelectOption value={27}>27</IonSelectOption>
                    </IonSelect>
                </IonItem>

                <IonItem lines="none">
                    <IonLabel>Use labels from watershed</IonLabel>
                    <IonCheckbox
                        checked={superpixelParams.labels}
                        onIonChange={(e) => setSuperpixelParams({ ...superpixelParams, labels: e.detail.checked })}
                    />
                </IonItem>

                <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={'Running hierarchical watershed'} />
            </ModuleCardItem>
        </ModuleCard>
    );
};

export default SuperpixelModuleCard;
