import React, {useState} from "react";
import {IonButton, IonInput, IonItem, IonItemDivider, IonLabel, IonList, IonPopover, IonTextarea} from "@ionic/react";

const FileDialog: React.FC<{ name: string }> = ({name}) => {
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });
    const [text, setText] = useState<string>();
    return (
        <>
            <IonPopover
                isOpen={showPopover.open}
                event={showPopover.event}
                onDidDismiss={e => setShowPopover({open: false, event: undefined})}
                alignment={"end"}
                style={{"--width": "400px"}}
            >
                <IonList>
                    <IonItemDivider>Default textarea</IonItemDivider>
                    <IonItem>
                        <IonTextarea
                            placeholder={"path/to/file"}
                            value={text}
                            onIonChange={e => setText(e.detail.value!)}/>
                    </IonItem>
                    <IonItemDivider>Textarea in an item with a floating label</IonItemDivider>
                    <IonItem>
                        <IonLabel position="floating">path/to/file</IonLabel>
                        <IonTextarea value={text} onIonChange={e => setText(e.detail.value!)}></IonTextarea>
                    </IonItem>
                </IonList>
            </IonPopover>
            <IonItem button onClick={(e) => setShowPopover({open: true, event: e.nativeEvent})}>{name}</IonItem>
        </>
    );
};

export default FileDialog;