import { IonCard, IonItem, IonLabel, IonList } from '@ionic/react';
import { Fragment, useEffect } from 'react';
import { useStorageState } from 'react-storage-hooks';
import { dispatch, useEventBus } from '../../../utils/eventbus';
import GroupSelect from './GroupSelect';
import PixelSegmentationModuleCard from './PixelSegmentationModuleCard';
import SuperpixelModuleCard from './SuperpixelModuleCard';
import SuperpixelSegmentationModuleCard from './SuperpixelSegmentationModuleCard';

const segmentationOptions = [
    { id: 'superpixel', label: 'Superpixel Segmentation' },
    { id: 'pixel', label: 'Pixel Segmentation' },
];

const canvas: Record<string, 'drawing' | 'imaging'> = {
    superpixel: 'drawing',
    pixel: 'drawing',
};

const SegmentationMenu: React.FC = () => {
    const [segModule, setSegModule] = useStorageState<string>(sessionStorage, 'curSegModule', 'superpixel');
    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);
    const [showSuperpixel, setShowSuperpixel] = useStorageState<boolean>(sessionStorage, 'showSuperpixel', true);

    // Listen for external events to update lock state or current segmentation module
    useEventBus('LockComponents', (changeLockMenu) => {
        setLockMenu(changeLockMenu);
    });

    useEventBus('changeCurSegModule', (newModule: string) => {
        setSegModule(newModule);
    });

    useEffect(() => {
        dispatch('canvasModeChanged', canvas[segModule]);
        console.log('Segmentation Module changed to:', segModule);
        if (segModule === 'superpixel' && !showSuperpixel) {
            dispatch('superpixelVisibilityChanged', true);
            setShowSuperpixel(true);
        }
        if (segModule === 'pixel' && showSuperpixel) {
            dispatch('superpixelVisibilityChanged', false);
            setShowSuperpixel(false);
        }
    }, [segModule, setShowSuperpixel, showSuperpixel]);

    return (
        <Fragment>
            <IonCard disabled={lockMenu}>
                <IonItem color="primary">
                    <IonLabel>Segmentation Module</IonLabel>
                    <GroupSelect
                        value={segModule}
                        id="segmentation-module-select"
                        options={segmentationOptions}
                        onChange={(option) => {
                            setSegModule(option.id);
                        }}
                    />
                </IonItem>
            </IonCard>
            <IonList hidden={segModule !== 'superpixel'}>
                <SuperpixelModuleCard />
                <SuperpixelSegmentationModuleCard />
            </IonList>
            <IonList hidden={segModule !== 'pixel'}>
                <PixelSegmentationModuleCard />
            </IonList>
        </Fragment>
    );
};

export default SegmentationMenu;
