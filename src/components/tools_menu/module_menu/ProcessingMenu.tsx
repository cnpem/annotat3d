import { IonCard, IonItem, IonLabel, IonList } from '@ionic/react';
import { Fragment, useEffect } from 'react';
import { useStorageState } from 'react-storage-hooks';
import { dispatch, useEventBus } from '../../../utils/eventbus';
import {
    BM3DFilteringModuleCard,
    GaussianFilteringModuleCard,
    NonLocalMeansFilteringModuleCard,
    AnisotropicDiffusionFilteringModuleCard,
    MeanFilteringModuleCard,
} from './FilteringModuleCard';
import GroupSelect from './GroupSelect';
import PixelSegmentationModuleCard from './PixelSegmentationModuleCard';
import SuperpixelModuleCard from './SuperpixelModuleCard';
import SuperpixelSegmentationModuleCard from './SuperpixelSegmentationModuleCard';
import MessageCard from './MessageCard';

const moduleOptions = [
    { id: 'superpixel', label: 'Superpixel Segmentation' },
    { id: 'pixel', label: 'Pixel Segmentation' },
    {
        id: 'filter',
        label: 'Smoothing',
        options: [
            { id: 'bm3d_filter', label: 'BM3D Smoothing Filter' },
            { id: 'gaussian_filter', label: 'Gaussian Filter' },
            { id: 'nlm_filter', label: 'Non Local Means Filter' },
            { id: 'aniso_filter', label: 'Anisotropic Diffusion Filter' },
            { id: 'mean_filter', label: 'Mean Filter' },
        ],
    },
];

const canvas: Record<string, 'drawing' | 'imaging'> = {
    superpixel: 'drawing',
    pixel: 'drawing',
    edit: 'drawing',
    bm3d_filter: 'imaging',
    gaussian_filter: 'imaging',
    nlm_filter: 'imaging',
    aniso_filter: 'imaging',
    mean_filter: 'imaging',
};

const ProcessingMenu: React.FC = () => {
    const [curModule, setCurModule] = useStorageState<string>(sessionStorage, 'curModule', 'superpixel');
    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);

    useEventBus('LockComponents', (changeLockMenu) => {
        setLockMenu(changeLockMenu);
    });

    useEventBus('changeCurModule', (newModule: string) => {
        setCurModule(newModule);
    });

    useEffect(() => {
        dispatch('canvasModeChanged', canvas[curModule]);
    }, [curModule]);

    return (
        <Fragment>
            <IonCard disabled={lockMenu}>
                <IonItem color="primary">
                    <IonLabel>Module</IonLabel>
                    <GroupSelect
                        value={curModule}
                        id="module-select"
                        options={moduleOptions}
                        onChange={(option) => {
                            setCurModule(option.id);
                        }}
                    />
                </IonItem>
            </IonCard>
            <IonList hidden={curModule !== 'superpixel'}>
                <SuperpixelModuleCard />
                <SuperpixelSegmentationModuleCard />
            </IonList>
            <IonList hidden={curModule !== 'pixel'}>
                <PixelSegmentationModuleCard />
            </IonList>
            <IonList hidden={curModule !== 'bm3d_filter'}>
                <BM3DFilteringModuleCard />
            </IonList>
            <IonList hidden={curModule !== 'gaussian_filter'}>
                <GaussianFilteringModuleCard />
            </IonList>
            <IonList hidden={curModule !== 'nlm_filter'}>
                <NonLocalMeansFilteringModuleCard />
            </IonList>
            <IonList hidden={curModule !== 'aniso_filter'}>
                <AnisotropicDiffusionFilteringModuleCard />
            </IonList>
            <IonList hidden={curModule !== 'mean_filter'}>
                <MeanFilteringModuleCard />
            </IonList>
            <MessageCard />
        </Fragment>
    );
};

export default ProcessingMenu;
