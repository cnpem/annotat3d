import {IonCard, IonItem, IonLabel, IonList} from "@ionic/react";
import {Fragment, useEffect} from "react";
import {useStorageState} from "react-storage-hooks";
import {dispatch} from "../../utils/eventbus";
import {BM3DFilteringModuleCard} from "./FilteringModuleCard";
import GroupSelect from "./GroupSelect";
import PixelSegmentationModuleCard from "./PixelSegmentationModuleCard";
import SuperpixelModuleCard from "./SuperpixelModuleCard";
import SuperpixelSegmentationModuleCard from "./SuperpixelSegmentationModuleCard";

const moduleOptions = [
    {id: "superpixel", label: 'Superpixel Segmentation' },
    {id: "pixel", label: "Pixel Segmentation"},
    {id: "edit", label: 'Label Edit'},
    {
        id: "filter", label: "Smoothing", options: [
            {id: "bm3d_filter", label: 'BM3D Smoothing Filter'}
        ]
    }
];

const canvas: Record<string, 'drawing' | 'imaging'> = {
    superpixel: 'drawing',
    pixel: 'drawing',
    edit: 'drawing',
    bm3d_filter: 'imaging'
};

const ProcessingMenu: React.FC = () => {

    const [curModule, setCurModule] = useStorageState<string>(localStorage, 'curModule', 'superpixel');

    useEffect(() => {
        dispatch('canvasModeChanged', canvas[curModule]);
    }, [curModule]);

    return (
        <Fragment>
            <IonCard>
                <IonItem color="primary">
                    <IonLabel>Module</IonLabel>
                    <GroupSelect value={curModule} id="module-select" options={moduleOptions}
                        onChange={(option)  => {
                            setCurModule(option.id);
                        }}/>
                </IonItem>
            </IonCard>
            <IonList hidden={curModule !== "superpixel"}>
                <SuperpixelModuleCard/>
                <SuperpixelSegmentationModuleCard/>
            </IonList>
            <IonList hidden={curModule !== "pixel"}>
                <PixelSegmentationModuleCard/>
            </IonList>
            <IonList hidden={curModule !== "bm3d_filter"}>
                <BM3DFilteringModuleCard/>
            </IonList>
        </Fragment>
    );
};

export default ProcessingMenu;
