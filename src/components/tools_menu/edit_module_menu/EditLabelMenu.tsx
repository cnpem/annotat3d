import {IonCard, IonCardContent, IonCheckbox, IonCol, IonItem, IonLabel, IonRow, IonToggle} from "@ionic/react";
import {useStorageState} from "react-storage-hooks";
import {dispatch, useEventBus} from "../../../utils/eventbus";
import {sfetch} from "../../../utils/simplerequest";
import ErrorInterface from "../../main_menu/file/utils/ErrorInterface";

type payloadKey = "is_merge_activated" | "is_split_activated"

interface EditLabelPayload {
    payload_key: payloadKey,
    payload_flag: boolean
}

//TODO : Need to dispatch isEditLabelActivated event to Superpixel and Pixel module
const EditLabelMenu: React.FC = () => {

    const [toggleEditLabel, setToggleEditLabel] = useStorageState<boolean>(sessionStorage, "toggleEditLabel", false);
    const [isMergeActivated, setIsMergeActivated] = useStorageState<boolean>(sessionStorage, "isMergeActivated", false);
    const [isSplitActivated, setIsSplitActivated] = useStorageState<boolean>(sessionStorage, "isSplitActivated", false);
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
                                        if (e.detail.checked) {
                                            setIsSplitActivated(false);
                                        }

                                        const payload: EditLabelPayload = {
                                            payload_key: "is_merge_activated",
                                            payload_flag: e.detail.checked
                                        }

                                        setIsMergeActivated(e.detail.checked);
                                        sfetch("POST", "/set_edit_label_options", JSON.stringify(payload), "json")
                                            .catch((error: ErrorInterface) => {
                                                console.log("Error in Merge operation");
                                                console.log(error.error_msg)
                                            });
                                    }}
                                    disabled={isEditLabelDisabled}/>
                            </IonItem>
                            {/*Split Menu*/}
                            <IonItem>
                                <IonLabel>Split</IonLabel>
                                <IonCheckbox
                                    checked={isSplitActivated}
                                    slot={"end"}
                                    onIonChange={(e: CustomEvent) => {
                                        if (e.detail.checked) {
                                            setIsMergeActivated(false);
                                        }
                                        setIsSplitActivated(e.detail.checked);
                                        const payload: EditLabelPayload = {
                                            payload_key: "is_split_activated",
                                            payload_flag: e.detail.checked
                                        }

                                        setIsSplitActivated(e.detail.checked);
                                        sfetch("POST", "/set_edit_label_options", JSON.stringify(payload), "json")
                                            .catch((error: ErrorInterface) => {
                                                console.log("Error in Split operation");
                                                console.log(error.error_msg)
                                            });
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