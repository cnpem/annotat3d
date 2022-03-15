import React, {useState} from "react";
import {IonButton, IonItem, IonPopover} from "@ionic/react";

const FileDialog: React.FC<{name:string}> = ({name}) => {
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });
    return (
        <>
            <IonPopover
                isOpen={showPopover.open}
                event={showPopover.event}
                onDidDismiss={e => setShowPopover({open: false, event: undefined})}
            >
                <p>This is popover content</p>
            </IonPopover>
            <IonItem button onClick={(e) => setShowPopover({open: true, event: e.nativeEvent})}>{name}</IonItem>
        </>
    );
};

export default FileDialog;