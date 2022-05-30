import React, {useState} from "react";
import {
    IonButton,
    IonCol,
    IonGrid, IonIcon,
    IonInput,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList,
    IonPopover,
    IonRow,
    IonSelect,
    IonSelectOption,
    IonAccordion,
    IonAccordionGroup, IonContent
} from "@ionic/react";
import "./FileDialog.css"
import dataType from "./Dtypes";
import {create, extensionPuzzle, image, images} from "ionicons/icons";
import {sfetch} from "../../../utils/simplerequest";
import {dispatch} from "../../../utils/eventbus";
import ErrorWindowComp from "./ErrorWindowComp";
import ImageInfoInterface from "./ImageInfoInterface";
import ErrorInterface from "./ErrorInterface";
import {LabelInterface} from "../../tools_menu/label_table/LabelInterface";

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

/**
 * Load Image dialog
 * @param {string} name - Name of the submenu to open this window
 */
const FileLoadDialog: React.FC<{ name: string }> = ({name}) => {
    // Init States
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

    const [imgShapeRaw, setImageShapeRaw] = useState(new Array(3))
    const [dtype, setDtype] = useState<dtype_type>("uint16");
    const [xRange, setXRange] = useState([0, -1]);
    const [yRange, setYRange] = useState([0, -1]);
    const [zRange, setZRange] = useState([0, -1]);
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    /**
     * Function that does the dispatch
     * @param imgPath
     * @param loadImgOp
     */
    const dispatchOpenImage = (imgPath: string, loadImgOp: img_operation) => {
        const params = {
            image_path: imgPath,
            image_dtype: dtype,
            image_raw_shape: [imgShapeRaw[0] || 0, imgShapeRaw[1] || 0, imgShapeRaw[2] || 0],
            use_image_raw_parse: (imgShapeRaw[0] == null && imgShapeRaw[1] == null && imgShapeRaw[2] == null),
        }

        sfetch("POST", "/open_image/" + loadImgOp, JSON.stringify(params), "json")
            .then((image: ImageInfoInterface) => {
                const info: ImageInfoInterface = {
                    imageShape: image.imageShape,
                    imageDtype: image.imageDtype,
                    imageName: image.imageName,
                    imageExt: image.imageExt,
                }

                if (loadImgOp === "superpixel") {
                    dispatch("superpixelChanged", {});
                }

                setShowErrorWindow(false);
                dispatch("ImageLoaded", info);
                dispatch("ActivateComponents", false);

            }).catch((error: ErrorInterface) => {
            console.log("error while loading the ", loadImgOp);
            console.log(error.error_msg);
            setShowErrorWindow(true);
            setErrorMsg(error.error_msg);
        });

    }

    const dispatchOpenAnnot = () => {
        const annotPath = {
            annot_path: pathFiles.annotPath
        }

        sfetch("POST", "/open_annot", JSON.stringify(annotPath), "json")
            .then((labelList: LabelInterface[]) => {
                console.log("Printing the loaded .pkl label list\n");
                console.log(labelList);
                dispatch("LabelLoaded", labelList);
                dispatch("annotationChanged", null);

            }).catch((error: ErrorInterface) => {
            console.log("Error message while trying to open the Annotation", error.error_msg);
            setErrorMsg(error.error_msg);
            setShowErrorWindow(true);
        })

    }

    const handleLoadImageAction = () => {
        /**
         * Dispatch for images, label and superpixel
         */

        if (pathFiles.imagePath !== "") {
            dispatchOpenImage(pathFiles.imagePath, "image");
        }

        if (pathFiles.superpixelPath !== "") {
            dispatchOpenImage(pathFiles.superpixelPath, "superpixel");
        }

        if (pathFiles.labelPath !== "") {
            dispatchOpenImage(pathFiles.labelPath, "label");
        }

        if (pathFiles.annotPath !== "") {
            dispatchOpenAnnot();
        }

    }

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setPathFiles({workspacePath: "", imagePath: "", superpixelPath: "", labelPath: "", annotPath: ""})
        setDtype("uint16");
        setImageShapeRaw([null, null, null]);
        setXRange([0, -1]);
        setYRange([0, -1]);
        setZRange([0, -1]);
        setShowErrorWindow(false);
        setErrorMsg("");
    };
    return (
        <>
            <IonPopover
                isOpen={showPopover.open}
                event={showPopover.event}
                onDidDismiss={() => cleanUp()}
                className={"file-popover"}>
                {/* Load file accordion */}
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
                            {/* Load image option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={image}/>
                                    <IonLabel><small>Load image *</small></IonLabel>
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
                                        <IonRow>
                                            <IonCol>
                                                <IonLabel position="stacked">Image Size</IonLabel>
                                                <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                                                    <IonInput
                                                        type="number"
                                                        min={"0"}
                                                        value={imgShapeRaw[0]}
                                                        placeholder="X"
                                                        onIonChange={e => setImageShapeRaw([parseInt(e.detail.value!, 10), imgShapeRaw[1], imgShapeRaw[2]])}
                                                    />
                                                    <IonInput
                                                        type="number"
                                                        min={"0"}
                                                        value={imgShapeRaw[1]}
                                                        placeholder="Y"
                                                        onIonChange={e => setImageShapeRaw([imgShapeRaw[0], parseInt(e.detail.value!, 10), imgShapeRaw[2]])}
                                                    />
                                                    <IonInput
                                                        type="number"
                                                        min={"0"}
                                                        value={imgShapeRaw[2]}
                                                        placeholder="Z"
                                                        onIonChange={e => setImageShapeRaw([imgShapeRaw[0], imgShapeRaw[1], parseInt(e.detail.value!, 10)])}
                                                    />
                                                </div>
                                            </IonCol>
                                            <IonCol>
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
                                            </IonCol>
                                        </IonRow>
                                    </IonItem>
                                    {/* Advanced Options Accordion */}
                                    <small>
                                        <IonAccordionGroup>
                                            <IonAccordion>
                                                <IonItem slot={"header"}>
                                                    <IonLabel slot={"end"}><small>Advanced Options</small></IonLabel>
                                                </IonItem>
                                                <IonGrid slot={"content"}>
                                                    {/* Axis Range Grid*/}
                                                    <IonItemDivider> Axis Ranges</IonItemDivider>
                                                    <IonRow>
                                                        <IonCol>
                                                            <IonInput
                                                                type="number"
                                                                min={"0"}
                                                                value={xRange[0]}
                                                                placeholder="X0"
                                                                onIonChange={e => setXRange([parseInt(e.detail.value!, 10), xRange[1]])}
                                                            />
                                                        </IonCol>
                                                        <IonCol>
                                                            <IonInput
                                                                type="number"
                                                                min={"-1"}
                                                                value={xRange[1]}
                                                                placeholder="X1"
                                                                onIonChange={e => setXRange([xRange[0], parseInt(e.detail.value!, 10)])}
                                                            />
                                                        </IonCol>
                                                    </IonRow>
                                                    <IonRow>
                                                        <IonCol>
                                                            <IonInput
                                                                type="number"
                                                                min={"0"}
                                                                value={yRange[0]}
                                                                placeholder="Y0"
                                                                onIonChange={e => setYRange([parseInt(e.detail.value!, 10), yRange[1]])}
                                                            />
                                                        </IonCol>
                                                        <IonCol>
                                                            <IonInput
                                                                type="number"
                                                                min={"-1"}
                                                                value={yRange[1]}
                                                                placeholder="Y1"
                                                                onIonChange={e => setYRange([yRange[0], parseInt(e.detail.value!, 10)])}
                                                            />
                                                        </IonCol>
                                                    </IonRow>
                                                    <IonRow>
                                                        <IonCol>
                                                            <IonInput
                                                                type="number"
                                                                min={"0"}
                                                                value={zRange[0]}
                                                                placeholder="Z0"
                                                                onIonChange={e => setZRange([parseInt(e.detail.value!, 10), zRange[1]])}
                                                            />
                                                        </IonCol>
                                                        <IonCol>
                                                            <IonInput
                                                                type="number"
                                                                min={"-1"}
                                                                value={zRange[1]}
                                                                placeholder="Z1"
                                                                onIonChange={e => setZRange([zRange[0], parseInt(e.detail.value!, 10)])}
                                                            />
                                                        </IonCol>
                                                    </IonRow>
                                                </IonGrid>
                                            </IonAccordion>
                                        </IonAccordionGroup>
                                    </small>
                                </IonList>
                            </IonAccordion>
                            {/* Load superpixel option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={extensionPuzzle}/>
                                    <IonLabel><small>Load Superpixel</small></IonLabel>
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
                                </IonList>
                            </IonAccordion>
                            {/* Load label image option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={images}/>
                                    <IonLabel><small>Label image</small></IonLabel>
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
                                </IonList>
                            </IonAccordion>
                            {/* Load annotation file option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={create}/>
                                    <IonLabel><small>Annotation file</small></IonLabel>
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
                                </IonList>
                            </IonAccordion>
                        </IonAccordionGroup>
                    </IonContent>
                </small>
                <IonButton color={"tertiary"} slot={"end"} onClick={handleLoadImageAction}>
                    Load!
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
                headerMsg={"Error while loading the file"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
        </>
    );
};

export default FileLoadDialog;
