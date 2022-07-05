import React, {useState} from "react";
import {
    IonAccordion,
    IonAccordionGroup,
    IonButton,
    IonContent, IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPopover, IonSelect, IonSelectOption
} from "@ionic/react";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import {useStorageState} from "react-storage-hooks";
import {addOutline, trashOutline} from "ionicons/icons";
import {dtypeList} from "../../file/FileLoadInterface";
import {InitTables, TableInterface} from "../dataset_compo/DatasetInterfaces";

interface Network {
    key: number,
    value: string,
    label: string
}

const typeNetworks: Network[] = [
    {
        key: 0,
        value: "u-net",
        label: "U-Net"
    },
    {
        key: 1,
        value: "v-net",
        label: "V-Net"
    },
    {
        key: 2,
        value: "bla-net",
        label: "Bla-Net"
    },
]

const InferenceComp: React.FC = () => {
    const [disableComp, setDisableComp] = useStorageState<boolean>(sessionStorage, "workspaceLoaded", true);
    const [InputImagesTable, setInputImagesTable] = useStorageState<TableInterface[]>(sessionStorage, 'inputImagesTable', InitTables);
    const [idTable, setIdTable] = useStorageState<number>(sessionStorage, "idTable", 0);

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
                    {/*Network option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Network</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <IonItem>
                                <IonLabel>Network type</IonLabel>
                                <IonSelect interface={"popover"}>
                                    {typeNetworks.map((type) => {
                                        return (
                                            <IonSelectOption key={type.key}
                                                value={type.value}>{type.label}</IonSelectOption>
                                        );
                                    })}
                                </IonSelect>
                            </IonItem>
                        </IonList>
                    </IonAccordion>
                </IonAccordionGroup>
            </IonContent>
        </small>
    );
}

export default InferenceComp;