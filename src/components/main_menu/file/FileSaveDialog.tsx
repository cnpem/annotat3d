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
    IonTextarea,
    useIonToast
} from "@ionic/react";
import "./FileDialog.css"
import dataType from "./Dtypes";
import ErrorWindowComp from "./ErrorWindowComp";
import {sfetch} from "../../../utils/simplerequest";
import {dispatch} from "../../../utils/eventbus";
import ImageInfoInterface from "./ImageInfoInterface";

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

    const [showToast, _] = useIonToast();

    const [path, setPath] = useState<string>("");
    const [dtype, setDtype] = useState<"uint8" | "int16" | "uint16" | "int32" | "uint32" | "int64" |
        "uint64" | "float32" | "float64" | "complex64">("uint16");
    const [saveImgOp, setSaveImgOp] = useState<"image" | "label" | "superpixel">("image");
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const handleSaveImgOP = (e: CustomEvent) => {
        const buttonSegName = e.detail!.value!
        setSaveImgOp(buttonSegName);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleSaveImageAction = () => {

        const params = {
            image_path: path,
            image_dtype: dtype,
        }

        sfetch("POST", "/save_image/"+saveImgOp, JSON.stringify(params), "json").then(
            (image) => {

                if(image.hasOwnProperty("image_shape")){

                    const info: ImageInfoInterface = {
                        imageShape: image.image_shape,
                        imageDtype: image.image_dtype,
                        imageName: image.image_name,
                        imageExt: image.image_ext,
                    }

                    setShowErrorWindow(false);
                    dispatch("SaveImage", info);
                    setShowPopover({...showPopover, open: false});
                    showToast(`image saved in ${image.image_name}${image.image_ext}`, 2000);

                } else {
                    setShowErrorWindow(true);
                    throw new Error(image.error_msg, image);
                }

            }).catch(error => {
                setErrorMsg(error.message);
        })
    }

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setPath("");
        setDtype("uint16");
        setSaveImgOp("image")
        setErrorMsg("");
        setShowErrorWindow(false)
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
                        <IonSegment value={saveImgOp} onIonChange={handleSaveImgOP}
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
                <IonButton color={"tertiary"} slot={"end"} onClick={handleSaveImageAction}>
                    Save!
                </IonButton>
            </IonPopover>
            <IonItem button
                     onClick={(e) => setShowPopover({open: true, event: e.nativeEvent})}
            >
                {name}
            </IonItem>
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                onErrorMsg={handleErrorMsg}
                windowOp={"saving"}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
        </>
    );
};

export default FileSaveDialog;
