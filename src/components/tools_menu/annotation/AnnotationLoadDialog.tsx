import React, {useState} from "react";
import {
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonPopover,
    useIonToast
} from "@ionic/react";

import {folderOpenOutline} from "ionicons/icons";
import {sfetch} from "../../../utils/simplerequest";
import {dispatch, useEventBus} from "../../../utils/eventbus";
import {useStorageState} from "react-storage-hooks";
import {LabelInterface} from "../label_table/LabelInterface";
import ErrorInterface from "../../main_menu/file/ErrorInterface";
import "./Annotation.css";
import ErrorWindowComp from "../../main_menu/file/ErrorWindowComp";
import LoadingComponent from "../LoadingComponent";

const AnnotationLoadDialog : React.FC = () => {
    // Init States
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });

    const [openLoadingMenu, setOpenLoadingMenu] = useState<boolean>(false);
    const [showToast,] = useIonToast();
    const timeToast = 2000;
    const [path, setPath] = useState<string>("");
    const [activateMenu, setActivateMenu] = useStorageState<boolean>(sessionStorage, "ActivateComponents", true);
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [headerErrorMsg, setHeaderErrorMsg] = useState<string>("");

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    useEventBus("ActivateComponents", (activateAnnotationMenu) => {
        setActivateMenu(activateAnnotationMenu);
    })

    const handleAnnotationLoad = () => {
        setOpenLoadingMenu(true)
        const params = {
            annot_path: path
        }

        sfetch("POST", "/open_annot", JSON.stringify(params), "json")
            .then((labelList:LabelInterface[]) => {
                console.log("Printing the loaded .pkl label list\n");
                console.log(labelList);
                setShowPopover({...showPopover, open: false});
                dispatch("LabelLoaded", labelList);
                dispatch("annotationChanged",null);
                showToast("Annotation loaded", timeToast);

            }).catch((error: ErrorInterface) => {
                console.log(error);
                setErrorMsg(error.error_msg);
                setHeaderErrorMsg(`error while loading the annotation`);
                setShowErrorWindow(true);
                console.log("Error trying to load the .pkl label\n");
            });

        setOpenLoadingMenu(false);

    }
    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setPath("");
        setShowErrorWindow(false);
        setErrorMsg("");
        setErrorMsg("");
        setHeaderErrorMsg("");
    };
    return (
        <>
            <IonPopover
                isOpen={showPopover.open}
                event={showPopover.event}
                onDidDismiss={() => cleanUp()}
                className={"annot-load-popover"}>
                <IonList>
                    {/* Annot Path Text Input*/}
                    <IonItem>
                        <IonLabel position="stacked">Annotation Path</IonLabel>
                        <IonInput
                            placeholder={"/path/to/file"}
                            value={path}
                            onIonChange={e => setPath(e.detail.value!)} />
                    </IonItem>
                    {/* TODO:Add recent opened annots*/}
                </IonList>
                <IonButton color={"tertiary"} slot={"end"} onClick={handleAnnotationLoad}>
                    Load!
                </IonButton>
            </IonPopover>
            {/* Load Button */}
            <IonButton size="small" disabled={activateMenu}
                onClick={ (e) => setShowPopover({open: true, event: e.nativeEvent }) }
            >
                <IonIcon slot="end" icon={folderOpenOutline}/>
                Load
            </IonButton>
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={headerErrorMsg}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
            {/*Loading component*/}
            <LoadingComponent
                openLoadingWindow={openLoadingMenu}
                loadingText={"loading the files"}/>
        </>
    );
};

export default AnnotationLoadDialog;
