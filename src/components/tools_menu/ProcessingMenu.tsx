import {IonCard, IonItem, IonLabel, IonSelect, IonSelectOption} from "@ionic/react";
import {Fragment} from "react";
import {useStorageState} from "react-storage-hooks";
import SuperpixelModuleCard from "./SuperpixelModuleCard";
import SuperpixelSegmentationModuleCard from "./SuperpixelSegmentationModuleCard";

type ModuleChoicesType = "superpixel" | "pixel" | "edit";

const ProcessingMenu: React.FC = () => {

    const [curModule, setCurModule] = useStorageState<ModuleChoicesType>(localStorage, 'curModule', 'superpixel');

    return (
        <Fragment>
            <IonCard>
                <IonItem color="primary">
                    <IonLabel>Module</IonLabel>
                    <IonSelect value={curModule}
                        interface="popover"
                        placeholder="Segmentation Module"
                        onIonChange={ (e) => {
                            if (e.detail.value) {
                                setCurModule(e.detail.value);
                            }
                        } }>
                        <IonSelectOption value="superpixel">Superpixel Segmentation</IonSelectOption>
                        <IonSelectOption value="pixel">Pixel Segmentation</IonSelectOption>
                        <IonSelectOption value="edit">Edit Labels</IonSelectOption>
                    </IonSelect>
                </IonItem>
            </IonCard>
            <SuperpixelModuleCard/>
            <SuperpixelSegmentationModuleCard/>
        </Fragment>
    );
};

export default ProcessingMenu;
