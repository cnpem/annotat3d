import React, {useState} from "react";
import {
    IonAccordion,
    IonAccordionGroup,
    IonButton,
    IonContent, IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPopover
} from "@ionic/react";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import {useStorageState} from "react-storage-hooks";
import {addOutline, trashOutline} from "ionicons/icons";

const InferenceComp: React.FC = () => {
    const [disableComp, setDisableComp] = useStorageState<boolean>(sessionStorage, "workspaceLoaded", true);
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowErrorWindow(false);
        setErrorMsg("");
    };

    return (
        <small>
            <IonContent scrollEvents={true}>
                <IonAccordionGroup multiple={true}>
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Bla</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <div style={{display: "flex", justifyContent: "flex-end"}}>
                                <IonButton
                                    id={"data-menu"}
                                    size={"default"}>
                                    <IonIcon
                                        icon={addOutline}
                                        slot={"end"}/>
                                    Add
                                </IonButton>
                                <IonButton
                                    color={"danger"}
                                    size={"default"}
                                    slot={"end"}>
                                    <IonIcon icon={trashOutline} slot={"end"}/>
                                    Delete all
                                </IonButton>
                            </div>
                        </IonList>
                    </IonAccordion>
                </IonAccordionGroup>
            </IonContent>
        </small>
    );
}

export default InferenceComp;