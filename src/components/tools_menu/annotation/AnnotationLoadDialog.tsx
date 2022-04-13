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
import {dispatch} from "../../../utils/eventbus";

const AnnotationLoadDialog : React.FC = () => {
    // Init States
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });
    const [showToast,] = useIonToast();
    const [path, setPath] = useState<string>("");

    const handleAnnotationLoad = () => {

        const params = {
            annot_path: path
        }

        sfetch("POST", "/open_annot", JSON.stringify(params), "")
            .then((success) => {
                console.log(success)
                setShowPopover({...showPopover, open: false});
                dispatch("annotationChanged",null);
                showToast("Annotation loaded", 2000);

            }).catch(error => {
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
            <IonButton size="small"
                onClick={ (e) => setShowPopover({open: true, event: e.nativeEvent }) }
            >
                <IonIcon slot="end" icon={folderOpenOutline}/>
                Load
            </IonButton>
        </>
    );
};

export default AnnotationLoadDialog;
