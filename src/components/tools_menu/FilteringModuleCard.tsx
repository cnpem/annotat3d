import {IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle} from "@ionic/react";
import {ModuleCard, ModuleCardItem} from "./ModuleCard";


const BM3DFilteringModuleCard: React.FC = () => {
    
    function onPreview() {}

    function onApply() {}

    return (
        <ModuleCard name="BM3D Smooth Filtering"
            onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <IonItem>
                    <IonLabel>Sigma</IonLabel>
                    <IonInput type="number" step="0.1" min={0.1} max={12.0}></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Dual Pass</IonLabel>
                    <IonToggle></IonToggle>
                </IonItem>
            </ModuleCardItem>
        </ModuleCard>
    );
}

export {BM3DFilteringModuleCard};
