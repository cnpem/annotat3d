import React, {useState} from "react";
import {
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList,
    IonPopover,
    IonSelect,
    IonSelectOption,
    IonAccordion,
    IonAccordionGroup, IonContent, IonToast
} from "@ionic/react";
import "./FileDialog.css"
import dataType from "./Dtypes";
import {construct, create, extensionPuzzle, image, images, information} from "ionicons/icons";
import {sfetch} from "../../../utils/simplerequest";
import {dispatch} from "../../../utils/eventbus";
import ErrorWindowComp from "./ErrorWindowComp";
import ImageInfoInterface from "./ImageInfoInterface";
import ErrorInterface from "./ErrorInterface";
import LoadingComponent from "../../tools_menu/LoadingComponent";

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

type dtype_type =
    "uint8"
    | "int16"
    | "uint16"
    | "int32"
    | "uint32"
    | "int64"
    | "uint64"
    | "float32"
    | "float64"
    | "complex64";

type img_operation = "image" | "superpixel" | "label";

interface multiplesPath {
    workspacePath: string,
    imagePath: string,
    superpixelPath: string,
    labelPath: string,
    annotPath: string,
}

interface QueueToast {
    message: string,
    isError: boolean,
}

/**
 * Save Image dialog
 * @param {string} name - Name of the submenu to open this window
 */
const FileSaveDialog: React.FC<{ name: string }> = ({name}) => {
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });

    const [pathFiles, setPathFiles] = useState<multiplesPath>({
        workspacePath: "",
        imagePath: "",
        superpixelPath: "",
        labelPath: "",
        annotPath: ""
    })

    const [openLoadingMenu, setOpenLoadingMenu] = useState<boolean>(false);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMsg, setToastMsg] = useState<string>("");
    const toastTime = 10000;
    const [dtype, setDtype] = useState<dtype_type>("uint16");
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [headerErrorMsg, setHeaderErrorMsg] = useState<string>("");

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    /**
     * Function that save the image and dispatch to the backend
     * @param {string} imgPath - string that contains the file path
     * @param {img_operation} saveImgOp - image operation to read. It can be "image", "superpixel" or "label"
     */
    const handleSaveImageAction = async (imgPath: string, saveImgOp: img_operation) => {

        const params = {
            image_path: imgPath,
            image_dtype: dtype,
        }

        let msgReturned = "";
        let isError = false;
        await sfetch("POST", "/save_image/" + saveImgOp, JSON.stringify(params), "json").then(
            (image: ImageInfoInterface) => {
                const imgName = imgPath.split("/");
                msgReturned = `${imgName[imgName.length - 1]} loaded as ${saveImgOp}`;

                const info: ImageInfoInterface = {
                    imageShape: image.imageShape,
                    imageDtype: image.imageDtype,
                    imageName: image.imageName,
                    imageExt: image.imageExt,
                }

                setShowErrorWindow(false);
                dispatch("SaveImage", info);

            }).catch((error: ErrorInterface) => {
            msgReturned = error.error_msg;
            isError = true;
            console.log("error while loading the ", saveImgOp);
            console.log(error.error_msg);
            setShowErrorWindow(true);
            setHeaderErrorMsg(`error while loading the ${saveImgOp}`);
            setErrorMsg(error.error_msg);
        });

        const returnedObj: QueueToast = {message: msgReturned, isError: isError};
        return returnedObj;

    }

    /**
     * Function that Saves the annotation .pkl file and send to the backend
     */
    const dispatchSaveAnnot = async () => {
        const annotPath = {
            annot_path: (pathFiles.workspacePath !== "") ? pathFiles.workspacePath + "/" + pathFiles.annotPath : pathFiles.annotPath,
        }
        let msgReturned = "";
        let isError = false;
        await sfetch("POST", "/save_annot", JSON.stringify(annotPath), "")
            .then((success: string) => {
                const imgName = pathFiles.annotPath.split("/");
                msgReturned = `${imgName[imgName.length - 1]} saved as annotation`;
                console.log(success);

            }).catch((error: ErrorInterface) => {
                msgReturned = error.error_msg;
                isError = true;
                console.log("Error message while trying to save the Annotation", error.error_msg);
                setHeaderErrorMsg(`error while saving the annotation`);
                setErrorMsg(error.error_msg);
                setShowErrorWindow(true);
            });

        const returnedObj: QueueToast = {message: msgReturned, isError: isError};
        return returnedObj;

    }

    const handleLoadImageAction = async () => {
        /**
         * Dispatch for images, label and superpixel
         */

        setOpenLoadingMenu(true);

        let queueToast: QueueToast[] = [{
            message: "",
            isError: false
        }, {
            message: "",
            isError: false
        }, {
            message: "",
            isError: false
        }, {
            message: "",
            isError: false
        }];

        if (pathFiles.imagePath !== "") {
            const imgPath = (pathFiles.workspacePath !== "") ? pathFiles.workspacePath + "/" + pathFiles.imagePath : pathFiles.imagePath
            const promise = handleSaveImageAction(imgPath, "image");
            await promise.then((item: QueueToast) => {
                queueToast[0] = item;
            })
        }

        if (pathFiles.superpixelPath !== "") {
            const superpixelPath = (pathFiles.workspacePath !== "") ? pathFiles.workspacePath + "/" + pathFiles.superpixelPath : pathFiles.superpixelPath
            const promise = handleSaveImageAction(superpixelPath, "superpixel");
            await promise.then((item: QueueToast) => {
                queueToast[1] = item;
            })
        }

        if (pathFiles.labelPath !== "") {
            const labelPath = (pathFiles.workspacePath !== "") ? pathFiles.workspacePath + "/" + pathFiles.labelPath : pathFiles.labelPath
            const promise = handleSaveImageAction(labelPath, "label");
            await promise.then((item: QueueToast) => {
                queueToast[2] = item;
            })
        }

        if (pathFiles.annotPath !== "") {
            const promise = dispatchSaveAnnot();
            await promise.then((item: QueueToast) => {
                queueToast[3] = item;
            })
        }

        let finalMsg = "";
        const flagShowToast = ((!queueToast[0].isError && queueToast[0].message !== "") ||
            (!queueToast[1].isError && queueToast[1].message !== "") ||
            (!queueToast[2].isError && queueToast[2].message !== ""));

        for (let i = 0; i < queueToast.length; i++) {
            if (queueToast[i].message !== "" && !queueToast[i].isError) {
                finalMsg += `|| ${queueToast[i].message} `;
            }
        }

        setToastMsg(finalMsg);
        setOpenLoadingMenu(false);
        setShowToast(flagShowToast);

    }

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setPathFiles({workspacePath: "", imagePath: "", superpixelPath: "", labelPath: "", annotPath: ""})
        setDtype("uint16");
        setShowErrorWindow(false);
        setErrorMsg("");
        setToastMsg("");
        setOpenLoadingMenu(false);
        setShowToast(false);
        setHeaderErrorMsg("");
    };
    return (
        <>
            <IonPopover
                isOpen={showPopover.open}
                event={showPopover.event}
                onDidDismiss={() => cleanUp()}
                className={"file-popover-save"}>
                {/* Save file accordion */}
                <small>
                    <IonContent
                        scrollEvents={true}
                        onIonScrollStart={() => {
                        }}
                        onIonScroll={() => {
                        }}
                        onIonScrollEnd={() => {
                        }}>
                        <IonAccordionGroup multiple={true}>
                            {/* Load Workspace option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={construct}/>
                                    <IonLabel><small>Load Workspace</small></IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    <IonItem>
                                        <IonLabel position="stacked">{"Superpixel Path"}</IonLabel>
                                        <IonInput
                                            placeholder={"/path/to/workspace"}
                                            value={pathFiles.workspacePath}
                                            onIonChange={(e: CustomEvent) => setPathFiles({
                                                ...pathFiles,
                                                workspacePath: e.detail.value!
                                            })}/>
                                    </IonItem>
                                    <IonItemDivider/>
                                </IonList>
                            </IonAccordion>
                            {/* Save image option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={image}/>
                                    <IonLabel><small>Save Image</small></IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    {/* Image Path Text Input*/}
                                    <IonItem>
                                        <IonLabel position="stacked">Image Path</IonLabel>
                                        <IonInput
                                            placeholder={"/path/to/file.tif, .tiff, .raw or .b"}
                                            value={pathFiles.imagePath}
                                            onIonChange={(e: CustomEvent) => setPathFiles({
                                                ...pathFiles,
                                                imagePath: e.detail.value!
                                            })}/>
                                    </IonItem>
                                    {/* Image Size Grid*/}
                                    <IonItem>
                                        {/* Select dtype */}
                                        <IonLabel position="stacked">Image Type</IonLabel>
                                        <IonSelect
                                            style={{maxWidth: '100%'}}
                                            interface={"popover"}
                                            value={dtype}
                                            placeholder={"Select One"}
                                            onIonChange={e => setDtype(e.detail.value)}
                                        >
                                            {dtypeList.map((type) => {
                                                return (
                                                    <IonSelectOption
                                                        value={type.value}>{type.label}</IonSelectOption>
                                                );
                                            })}
                                        </IonSelect>
                                    </IonItem>
                                    <IonItemDivider/>
                                </IonList>
                            </IonAccordion>
                            {/* Save superpixel option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={extensionPuzzle}/>
                                    <IonLabel><small>Save Superpixel</small></IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    <IonItem>
                                        <IonLabel position="stacked">{"Superpixel Path"}</IonLabel>
                                        <IonInput
                                            placeholder={"/path/to/Superpixel.tif, .tiff, .raw or .b"}
                                            value={pathFiles.superpixelPath}
                                            onIonChange={(e: CustomEvent) => setPathFiles({
                                                ...pathFiles,
                                                superpixelPath: e.detail.value!
                                            })}/>
                                    </IonItem>
                                    <IonItemDivider/>
                                </IonList>
                            </IonAccordion>
                            {/* Save label image option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={images}/>
                                    <IonLabel><small>Save Label Image</small></IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    <IonItem>
                                        <IonLabel position="stacked">{"Label image"}</IonLabel>
                                        <IonInput
                                            placeholder={"/path/to/Label.tif, .tiff, .raw or .b"}
                                            value={pathFiles.labelPath}
                                            onIonChange={(e: CustomEvent) => setPathFiles({
                                                ...pathFiles,
                                                labelPath: e.detail.value!
                                            })}/>
                                    </IonItem>
                                    <IonItemDivider/>
                                </IonList>
                            </IonAccordion>
                            {/* Save annotation file option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={create}/>
                                    <IonLabel><small>Save Annotation File</small></IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    <IonItem>
                                        <IonLabel position="stacked">{"Annotation file"}</IonLabel>
                                        <IonInput
                                            placeholder={"/path/to/Annotation.pkl"}
                                            value={pathFiles.annotPath}
                                            onIonChange={(e: CustomEvent) => setPathFiles({
                                                ...pathFiles,
                                                annotPath: e.detail.value!
                                            })}/>
                                    </IonItem>
                                    <IonItemDivider/>
                                </IonList>
                            </IonAccordion>
                        </IonAccordionGroup>
                    </IonContent>
                </small>
                <IonButton color={"tertiary"} slot={"end"} onClick={handleLoadImageAction}>
                    Save!
                </IonButton>
            </IonPopover>
            {/* Load Button */}
            <IonItem button
                     onClick={(e) => setShowPopover({open: true, event: e.nativeEvent})}>
                {name}
            </IonItem>
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={headerErrorMsg}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
            {/*Toast component*/}
            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMsg}
                icon={information}
                duration={toastTime}
            />
            {/*Loading component*/}
            <LoadingComponent
                openLoadingWindow={openLoadingMenu}
                loadingText={"Saving the files"}/>
        </>
    );
};

export default FileSaveDialog;