import { IonCard, IonItem, IonLabel, IonList } from '@ionic/react';
import { Fragment, useEffect } from 'react';
import { useStorageState } from 'react-storage-hooks';
import { dispatch, useEventBus } from '../../../utils/eventbus';

import GroupSelect from './GroupSelect';
import PixelSegmentationModuleCard from './PixelSegmentationModuleCard';
import SuperpixelModuleCard from './SuperpixelModuleCard';
import SuperpixelSegmentationModuleCard from './SuperpixelSegmentationModuleCard';
import DeepSegmentationModuleCard from './DeepSegmentationModuleCard';
import { LabelInterface } from '../annotation_menu/label_table/LabelInterface';

// ✅ Add Deep Segmentation to dropdown
const segmentationOptions = [
    { id: 'superpixel', label: 'Superpixel Segmentation' },
    { id: 'pixel', label: 'Pixel Segmentation' },
    { id: 'deep', label: 'Deep Learning Segmentation' },
];

const SegmentationMenu: React.FC = () => {
    const [segModule, setSegModule] = useStorageState<string>(sessionStorage, 'curSegModule', 'superpixel');

    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);

    const [showSuperpixel, setShowSuperpixel] = useStorageState<boolean>(sessionStorage, 'showSuperpixel', true);

    const [labelList, setLabelList] = useStorageState<LabelInterface[]>(sessionStorage, 'labelList', [
        { labelName: 'Background', color: [246, 10, 246], id: 0, alpha: 1 },
    ]);

    // Listen for external events
    useEventBus('LockComponents', (changeLockMenu) => {
        setLockMenu(changeLockMenu);
    });

    useEventBus('changeCurSegModule', (newModule: string) => {
        setSegModule(newModule);
    });

    useEffect(() => {
        console.log('Segmentation Module changed to:', segModule);

        // Superpixel visibility logic (unchanged)
        if (segModule === 'superpixel' && !showSuperpixel) {
            dispatch('superpixelVisibilityChanged', true);
            setShowSuperpixel(true);
        }
        if ((segModule === 'pixel' || segModule === 'deep') && showSuperpixel) {
            dispatch('superpixelVisibilityChanged', false);
            setShowSuperpixel(false);
        }
    }, [segModule, setShowSuperpixel, showSuperpixel]);

    return (
        <Fragment>
            <IonCard disabled={lockMenu}>
                <IonItem color="primary">
                    <IonLabel>Segmentation Module</IonLabel>

                    {/* 🔥 Updated selector to support deep segmentation */}
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

            {/* ✅ Show Superpixel modules */}
            <IonList hidden={segModule !== 'superpixel'}>
                <SuperpixelModuleCard />
                <SuperpixelSegmentationModuleCard />
            </IonList>

            {/* ✅ Show Pixel segmentation module */}
            <IonList hidden={segModule !== 'pixel'}>
                <PixelSegmentationModuleCard />
            </IonList>

            {/* ✅ Show Deep Learning module */}
            <IonList hidden={segModule !== 'deep'}>
                <DeepSegmentationModuleCard availableLabels={labelList} />
            </IonList>
        </Fragment>
    );
};

export default SegmentationMenu;
