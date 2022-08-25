import {IonCard, IonCardContent, IonCheckbox, IonCol, IonItem, IonLabel, IonRow, IonToggle} from "@ionic/react";
import {useStorageState} from "react-storage-hooks";
import {dispatch, useEventBus} from "../../../utils/eventbus";

//TODO : Need to dispatch isEditLabelActivated event to Superpixel and Pixel module
const EditLabelMenu: React.FC = () => {

    const [toggleEditLabel, setToggleEditLabel] = useStorageState<boolean>(sessionStorage, "toggleEditLabel", false);
    const [isMergeActivated, setIsMergeActivated] = useStorageState<boolean>(sessionStorage, "isMergeActivated", false);
    const [isEditLabelDisabled, setIsEditLabelDisabled] = useStorageState<boolean>(sessionStorage, "isEditLabelDisabled", false);

    useEventBus("changeMergeDisableStatus", (flagPayload: boolean) => {
        setIsEditLabelDisabled(flagPayload);
    })

    return (
        <IonCard>
            <IonCardContent>
                <IonItem>
                    <IonLabel>Edit Label Menu</IonLabel>
                    <IonToggle
                        checked={toggleEditLabel}
                        disabled={isEditLabelDisabled}
                        onIonChange={(e: CustomEvent) => {
                            setToggleEditLabel(e.detail.checked);
                            dispatch("isEditLabelActivated", e.detail.checked);
                        }}/>
                </IonItem>
                <IonRow>
                    <IonCol>
                        <div hidden={!toggleEditLabel}>
                            {/*Merge Menu*/}
                            <IonItem>
                                <IonLabel>Merge</IonLabel>
                                <IonCheckbox
                                    checked={isMergeActivated}
                                    slot={"end"}
                                    onIonChange={(e: CustomEvent) => {
                                        setIsMergeActivated(e.detail.checked);
                                    }}
                                    disabled={isEditLabelDisabled}/>
                            </IonItem>
                            {/*Split Menu*/}
                            <IonItem>
                                <IonLabel>Split</IonLabel>
                                <IonCheckbox
                                    checked={isMergeActivated}
                                    slot={"end"}
                                    onIonChange={(e: CustomEvent) => {
                                        setIsMergeActivated(e.detail.checked);
                                    }}
                                    disabled={isEditLabelDisabled}/>
                            </IonItem>
                        </div>
                    </IonCol>
                </IonRow>
            </IonCardContent>
        </IonCard>
    );
}

export default EditLabelMenu