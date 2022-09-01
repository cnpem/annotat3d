import {IonCard, IonCardContent, IonCheckbox, IonCol, IonItem, IonLabel, IonRow, IonToggle} from "@ionic/react";
import {useStorageState} from "react-storage-hooks";
import {dispatch, useEventBus} from "../../utils/eventbus";
import {sfetch} from "../../utils/simplerequest";
import ErrorInterface from "../main_menu/file/utils/ErrorInterface";

type payloadKey = "is_merge_activated" | "is_split_activated"

interface EditLabelPayload {
    payload_key: payloadKey,
    payload_flag: boolean
}

//TODO : Need to dispatch isEditLabelActivated event to Superpixel and Pixel module
/**
 * Component that creates "Edit Label Menu"
 */
const EditLabelMenu: React.FC = () => {

    const [toggleEditLabel, setToggleEditLabel] = useStorageState<boolean>(sessionStorage, "toggleEditLabel", false);
    const [isMergeActivated, setIsMergeActivated] = useStorageState<boolean>(sessionStorage, "isMergeActivated", false);
    const [isSplitActivated, setIsSplitActivated] = useStorageState<boolean>(sessionStorage, "isSplitActivated", false);
    const [isEditLabelDisabled, setIsEditLabelDisabled] = useStorageState<boolean>(sessionStorage, "isEditLabelDisabled", false);
    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);

    useEventBus('LockComponents', (activateAddLabelButton: boolean) => {
        setLockMenu(activateAddLabelButton);
    });

    useEventBus("changeMergeDisableStatus", (flagPayload: boolean) => {
        setIsEditLabelDisabled(flagPayload);
        if (flagPayload) {
            setToggleEditLabel(false);
        }
    });

    /**
     * This function resets the back and front parameters every time that toogle is off
     * @param turnMergeSplitFalse {boolean} - variable that contains the event of toogle. All the time, this variable need to be false
     */
    const reseEditLabel = (turnMergeSplitFalse: boolean = false) => {

        if (isMergeActivated) {
            setIsMergeActivated(turnMergeSplitFalse);
            const payloadMerge: EditLabelPayload = {
                payload_key: "is_merge_activated",
                payload_flag: turnMergeSplitFalse
            }

            sfetch("POST", "/set_edit_label_options", JSON.stringify(payloadMerge), "json")
                .catch((error: ErrorInterface) => {
                    console.log("Error in Merge operation");
                    console.log(error.error_msg)
                });

        } else if (isSplitActivated) {
            setIsSplitActivated(turnMergeSplitFalse);
            const payloadSlipt: EditLabelPayload = {
                payload_key: "is_split_activated",
                payload_flag: turnMergeSplitFalse
            }

            sfetch("POST", "/set_edit_label_options", JSON.stringify(payloadSlipt), "json")
                .catch((error: ErrorInterface) => {
                    console.log("Error in Split operation");
                    console.log(error.error_msg)
                });
        }

    }

    return (
        <IonCard>
            <IonCardContent>
                <IonItem>
                    <IonLabel>Edit Label Menu</IonLabel>
                    <IonToggle
                        checked={toggleEditLabel}
                        disabled={isEditLabelDisabled || lockMenu}
                        onIonChange={(e: CustomEvent) => {
                            setToggleEditLabel(e.detail.checked);
                            if (!e.detail.checked) {
                                reseEditLabel(e.detail.checked);
                            }
                            dispatch("isEditLabelDisabled", e.detail.checked);
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
                                        dispatch("extendLabelOnMerge", e.detail.checked);
                                        if (e.detail.checked) {
                                            setIsSplitActivated(false);
                                            dispatch("isEditLabelActivated", false);
                                        }

                                        const payload: EditLabelPayload = {
                                            payload_key: "is_merge_activated",
                                            payload_flag: e.detail.checked
                                        }

                                        setIsMergeActivated(e.detail.checked);
                                        sfetch("POST", "/set_edit_label_options", JSON.stringify(payload), "json").then(() => {
                                        }).catch((error: ErrorInterface) => {
                                            console.log("Error in Merge operation");
                                            console.log(error.error_msg)
                                        });
                                    }}
                                    disabled={isEditLabelDisabled || lockMenu}/>
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
                                            dispatch("isEditLabelActivated", false);
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
                                    disabled={isEditLabelDisabled || lockMenu}/>
                            </IonItem>
                        </div>
                    </IonCol>
                </IonRow>
            </IonCardContent>
        </IonCard>
    );
}

export default EditLabelMenu