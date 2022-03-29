import React, {useState} from "react";
import {
    IonButton, IonItem,
    IonItemDivider,
    IonLabel,
    IonList,
    IonPopover,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonTextarea
} from "@ionic/react";
import "./FileDialog.css"
import dataType from "./Dtypes";

/**
 * dtypes array
 */
const dtypeList: dataType[] = [
    {
        value: "uint8",
        label: "8-bit"
    },
    {
        value: "int16",
        label: "16-bit Signed"
    },
    {
        value: "uint16",
        label: "16-bit Unsigned"
    },
    {
        value: "int32",
        label: "32-bit Signed"
    },
    {
        value: "uint32",
        label: "32-bit Unsigned"
    },
    {
        value: "int64",
        label: "64-bit Signed"
    },
    {
        value: "uint64",
        label: "64-bit Unsigned"
    },
    {
        value: "float32",
        label: "32-bit Float"
    },
    {
        value: "float64",
        label: "64-bit Float"
    },
    {
        value: "complex64",
        label: "64-bit Complex"
    }
];

/**
 * Save Image dialog
 * @param name
 * @constructor
 */
const FileSaveDialog: React.FC<{ name: string }> = ({name}) => {
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });
    const [path, setPath] = useState<string>();
    const [dtype, setDtype] = useState<string>();
    const [, setKind] = useState<string>();

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setPath("");
        setDtype("");
    };
    return (
        <>
            <IonPopover
                isOpen={showPopover.open}
                event={showPopover.event}
                onDidDismiss={() => cleanUp()}
                className={"file-popover"}
            >
                <IonList>
                    <IonItem>
                        <IonSegment onIonChange={e => setKind(e.detail.value)}
                                    color="tertiary">
                            <IonSegmentButton value="image">
                                <IonLabel>Image</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="label">
                                <IonLabel>Label</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="superpixel">
                                <IonLabel>Superpixel</IonLabel>
                            </IonSegmentButton>
                        </IonSegment>
                    </IonItem>
                    <IonItemDivider>Output Path</IonItemDivider>
                    <IonItem>
                        <IonTextarea
                            placeholder={"output/path/to/file"}
                            value={path}
                            onIonChange={e => setPath(e.detail.value!)}
                        />
                    </IonItem>
                    <IonItemDivider> Image Size</IonItemDivider>
                    <IonItem>
                        <IonLabel>Image Type</IonLabel>
                        <IonSelect
                            interface={"popover"}
                            value={dtype}
                            placeholder={"Select One"}
                            onIonChange={e => setDtype(e.detail.value)}
                        >
                            {dtypeList.map((type) => {
                                return (
                                    <IonSelectOption value={type.value}>{type.label}</IonSelectOption>
                                );
                            })}
                        </IonSelect>
                    </IonItem>
                </IonList>
                <IonButton color={"tertiary"} slot={"end"}>
                    Save!
                </IonButton>
            </IonPopover>
            <IonItem button
                     onClick={(e) => setShowPopover({open: true, event: e.nativeEvent})}
            >
                {name}
            </IonItem>
        </>
    );
};

export default FileSaveDialog;
