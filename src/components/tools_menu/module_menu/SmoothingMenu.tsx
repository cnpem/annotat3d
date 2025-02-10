import { IonCard, IonItem, IonLabel, IonList } from '@ionic/react';
import { Fragment, useEffect } from 'react';
import { useStorageState } from 'react-storage-hooks';
import { dispatch, useEventBus } from '../../../utils/eventbus';
import GroupSelect from './GroupSelect';
import {
    BM3DFilteringModuleCard,
    GaussianFilteringModuleCard,
    NonLocalMeansFilteringModuleCard,
    AnisotropicDiffusionFilteringModuleCard,
    MeanFilteringModuleCard,
    MedianFilteringModuleCard,
    UnsharpMaskFilteringModuleCard,
} from './FilteringModuleCard';
import MessageCard from './MessageCard';

const smoothingOptions = [
    { id: 'bm3d_filter', label: 'BM3D Smoothing Filter' },
    { id: 'gaussian_filter', label: 'Gaussian Filter' },
    { id: 'nlm_filter', label: 'Non Local Means Filter' },
    { id: 'aniso_filter', label: 'Anisotropic Diffusion Filter' },
    { id: 'mean_filter', label: 'Mean Filter' },
    { id: 'median_filter', label: 'Median Filter' },
    { id: 'unsharp_mask_filter', label: 'Unsharp Mask Filter' },
];

const canvas: Record<string, 'drawing' | 'imaging'> = {
    bm3d_filter: 'imaging',
    gaussian_filter: 'imaging',
    nlm_filter: 'imaging',
    aniso_filter: 'imaging',
    mean_filter: 'imaging',
    median_filter: 'imaging',
    unsharp_mask_filter: 'imaging',
};

const SmoothingMenu: React.FC = () => {
    const [smoothModule, setSmoothModule] = useStorageState<string>(sessionStorage, 'curSmoothModule', 'bm3d_filter');
    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);

    // Listen for external events to update lock state or current smoothing module
    useEventBus('LockComponents', (changeLockMenu) => {
        setLockMenu(changeLockMenu);
    });

    useEventBus('changeCurSmoothModule', (newModule: string) => {
        setSmoothModule(newModule);
    });

    useEffect(() => {
        dispatch('canvasModeChanged', canvas[smoothModule]);
        console.log('Smoothing Module changed to:', smoothModule);
    }, [smoothModule]);

    return (
        <Fragment>
            <IonCard disabled={lockMenu}>
                <IonItem color="primary">
                    <IonLabel>Smoothing Module</IonLabel>
                    <GroupSelect
                        value={smoothModule}
                        id="smoothing-module-select"
                        options={smoothingOptions}
                        onChange={(option) => {
                            setSmoothModule(option.id);
                        }}
                    />
                </IonItem>
            </IonCard>
            <IonList hidden={smoothModule !== 'bm3d_filter'}>
                <BM3DFilteringModuleCard />
            </IonList>
            <IonList hidden={smoothModule !== 'gaussian_filter'}>
                <GaussianFilteringModuleCard />
            </IonList>
            <IonList hidden={smoothModule !== 'nlm_filter'}>
                <NonLocalMeansFilteringModuleCard />
            </IonList>
            <IonList hidden={smoothModule !== 'aniso_filter'}>
                <AnisotropicDiffusionFilteringModuleCard />
            </IonList>
            <IonList hidden={smoothModule !== 'mean_filter'}>
                <MeanFilteringModuleCard />
            </IonList>
            <IonList hidden={smoothModule !== 'median_filter'}>
                <MedianFilteringModuleCard />
            </IonList>
            <IonList hidden={smoothModule !== 'unsharp_mask_filter'}>
                <UnsharpMaskFilteringModuleCard />
            </IonList>
            <MessageCard />
        </Fragment>
    );
};

export default SmoothingMenu;
