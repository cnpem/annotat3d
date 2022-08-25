import {IonButton, IonCard, IonCardContent, IonItem, IonLabel, IonToggle} from "@ionic/react";
import {useStorageState} from "react-storage-hooks";
import {dispatch} from "../../../utils/eventbus";

//TODO : Need to dispatch isEditLabelActivated event to Superpixel and Pixel module
const EditLabelMenu: React.FC = () => {

    const [toggleEditLabel, setToggleEditLabel] = useStorageState<boolean>(sessionStorage, "toggleEditLabel", false);

    return (
        <IonCard>
            <IonCardContent>
                <IonItem>
                    <IonLabel>Edit Label Menu</IonLabel>
                    <IonToggle
                        checked={toggleEditLabel}
                        onIonChange={(e: CustomEvent) => {
                            setToggleEditLabel(e.detail.checked);
                            dispatch("isEditLabelActivated", e.detail.checked);
                        }}/>
                </IonItem>
                <div style={{display: "flex", justifyContent: "flex-end"}} hidden={!toggleEditLabel}>
                    <IonButton size={"small"}>Merge</IonButton>
                </div>
            </IonCardContent>
        </IonCard>
    );
}

export default EditLabelMenu