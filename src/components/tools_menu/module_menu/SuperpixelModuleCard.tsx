import { IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, useIonToast } from '@ionic/react';
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
}

const SuperpixelModuleCard: React.FC = () => {
    const [superpixelParams, setSuperpixelParams] = useStorageState<HierarchicalWatershedState>(
        sessionStorage,
        'superpixelParams',
        { levels: 6, neighborhood: 27 }
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

        const params = { levels: superpixelParams.levels, neighborhood: superpixelParams.neighborhood };

        sfetch('POST', '/superpixel', JSON.stringify(params), 'json')
            .then((labelVec: LabelInterface[]) => {
                if (Array.isArray(labelVec)) {
                    // Assign colors and create a NEW array reference
                    const coloredLabels = labelVec.map((label) => ({
                        ...label,
                        color: colorFromId(defaultColormap, label.id),
                    }));

                    // Dispatch immediately so LabelTable updates
                    dispatch('LabelLoaded', coloredLabels);

                    // Keep other dispatches for UI state
                    dispatch('superpixelChanged', {});
                    dispatch('superpixelParams', params);

                    console.log('Label table updated successfully after watershed.');
                } else {
                    console.warn('Invalid label data received from /superpixel');
                }
            })
            .catch((err) => console.error('Error while running hierarchical watershed:', err))
            .finally(() => {
                setLockMenu(false);
                setShowLoadingComp(false);
                void showToast('Hierarchical watershed successfully applied!', timeToast);
                dispatch('annotationChanged', null);
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

                <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={'Running hierarchical watershed'} />
            </ModuleCardItem>
        </ModuleCard>
    );
};

export default SuperpixelModuleCard;
