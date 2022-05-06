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

const AnnotationLoadDialog : React.FC = () => {
    // Init States
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });
    const [showToast,] = useIonToast();
    const [path, setPath] = useState<string>("");
    const [activateMenu, setActivateMenu] = useStorageState<boolean>(sessionStorage, "ActivateComponents", true);

    useEventBus("ActivateComponents", (activateAnnotationMenu) => {
        setActivateMenu(activateAnnotationMenu);
    })

    const handleAnnotationLoad = () => {

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
                showToast("Annotation loaded", 2000);

            }).catch(error => {
                //TODO : Need to implement an error and loading component to load an operation
                console.log("Error trying to load the .pkl label\n");
                console.log(error);
            })

    }
    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setPath("");
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
        </>
    );
};

export default AnnotationLoadDialog;
