import {IonCard, IonItem, IonLabel, IonList} from "@ionic/react";
import {Fragment} from "react";
import {useStorageState} from "react-storage-hooks";
import {BM3DFilteringModuleCard} from "./FilteringModuleCard";
import GroupSelect from "./GroupSelect";
import SuperpixelModuleCard from "./SuperpixelModuleCard";
import SuperpixelSegmentationModuleCard from "./SuperpixelSegmentationModuleCard";

const moduleOptions = [
    {id: "superpixel", label: 'Superpixel Segmentation' },
    {id: "pixel", label: "Pixel Segmentation"},
    {id: "edit", label: 'Label Edit'},
    {
        id: "filter", label: "Smoothing", options: [
            {id: "bm3d-filter", label: 'BM3D Smoothing Filter'}
        ]
    }
];

const ProcessingMenu: React.FC = () => {

    const [curModule, setCurModule] = useStorageState<string>(localStorage, 'curModule', 'superpixel');

    return (
        <Fragment>
            <IonCard>
                <IonItem color="primary">
                    <IonLabel>Module</IonLabel>
                    <GroupSelect id="module-select" options={moduleOptions}
                        onChange={(option)  => setCurModule(option.id)} />
                </IonItem>
            </IonCard>
            <IonList hidden={curModule !== "superpixel"}>
                <SuperpixelModuleCard/>
                <SuperpixelSegmentationModuleCard/>
            </IonList>
            <IonList hidden={curModule !== "bm3d-filter"}>
                <BM3DFilteringModuleCard />
            </IonList>
        </Fragment>
    );
};

export default ProcessingMenu;
