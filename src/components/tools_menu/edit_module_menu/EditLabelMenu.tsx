import {IonCard, IonCardContent, IonItem, IonLabel, IonToggle} from "@ionic/react";
import {useStorageState} from "react-storage-hooks";

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
                        }}/>
                </IonItem>
                <div hidden={!toggleEditLabel}>
                    {"oh, hello there !!!"}
                </div>
            </IonCardContent>
        </IonCard>
    );
}

export default EditLabelMenu