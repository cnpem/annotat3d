import React, {useState} from "react";
import {
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonPopover, IonSelect, IonSelectOption,
    useIonToast
} from "@ionic/react";

import {saveOutline} from "ionicons/icons";
import {sfetch} from "../../../utils/simplerequest";

const extList : string[] = [
    ".pkl"
];

const AnnotationSaveDialog : React.FC = () => {
    // Init States
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });
    const [showToast,] = useIonToast();
    const [path, setPath] = useState<string>("");
    const [ext, setExt] = useState<".pkl">(".pkl");

    const handleAnnotationSave = () => {

        const filepath = path.split(".")[0] + ext;
        const params = {
            annot_path: filepath
        }

        sfetch("POST", "/save_annot", JSON.stringify(params), "")
            .then((success) => {
                console.log(success);
                setShowPopover({...showPopover, open: false});
                showToast("Annotation saved", 2000);

            }).catch(error => {
                console.log(error);
            });

    }
    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setPath("");
        setExt(".pkl")
    };
    return (
        <>
            <IonPopover
                isOpen={showPopover.open}
                event={showPopover.event}
                onDidDismiss={() => cleanUp()}
                className={"annot-save-popover"}>
                <IonList>
                    {/* Annot Output path Text Input*/}
                    <IonItem>
                        <IonLabel position="stacked">Output Path</IonLabel>
                        <IonInput
                            placeholder={"/path/to/file"}
                            value={path}
                            onIonChange={e => setPath(e.detail.value!)} />
                    </IonItem>
                    {/* Extension output*/}
                    <IonItem>
                        <IonLabel position="stacked">Extension</IonLabel>
                        <IonSelect
                                    style={ {maxWidth: '100%'} }
                                    interface={"popover"}
                                    value={ext}
                                    placeholder={"Select One"}
                                    onIonChange={e => setExt(e.detail.value)}
                                >
                                    {extList.map((extension) => {
                                        return (
                                            <IonSelectOption value={extension}>{extension}</IonSelectOption>
                                        );
                                    })}
                                </IonSelect>
                    </IonItem>
                </IonList>
                <IonButton color={"tertiary"} slot={"end"} onClick={handleAnnotationSave}>
                    Save!
                </IonButton>
            </IonPopover>
            {/* Load Button */}
            <IonButton size="small"
            onClick={ (e) => setShowPopover({open: true, event: e.nativeEvent }) }
            >
                <IonIcon slot="end" icon={saveOutline}/>
                Save
            </IonButton>
        </>
    );
};

export default AnnotationSaveDialog;
