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
    IonAccordionGroup, IonContent, IonToast
} from "@ionic/react";
import "./FileDialog.css"
import {
    barChart,
    construct,
    create,
    extensionPuzzle,
    image,
    images,
    information
} from "ionicons/icons";
import {sfetch} from "../../../utils/simplerequest";
import {dispatch} from "../../../utils/eventbus";
import ErrorWindowComp from "./utils/ErrorWindowComp";
import ImageInfoInterface from "./utils/ImageInfoInterface";
import ErrorInterface from "./utils/ErrorInterface";
import {LabelInterface} from "../../tools_menu/label_table/LabelInterface";
import LoadingComponent from "../../tools_menu/LoadingComponent";
import {useStorageState} from "react-storage-hooks";
import {dtype_type, dtypeList, img_operation, multiplesPath, QueueToast} from "./utils/FileLoadInterface";

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

    const [pathFiles, setPathFiles] = useStorageState<multiplesPath>(sessionStorage, "loadedPathFiles", {
        workspacePath: "",
        imagePath: "",
        superpixelPath: "",
        labelPath: "",
        annotPath: "",
        classificationPath: ""
    });

    const [openLoadingMenu, setOpenLoadingMenu] = useState<boolean>(false);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMsg, setToastMsg] = useState<string>("");
    const toastTime = 10000;
    const [imgShapeRaw, setImageShapeRaw] = useState(new Array(3))
    const [dtype, setDtype] = useState<dtype_type>("uint16");
    const [xRange, setXRange] = useState([0, -1]);
    const [yRange, setYRange] = useState([0, -1]);
    const [zRange, setZRange] = useState([0, -1]);
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
     * Function that does the dispatch
     * @param {string} imgPath - string that contains the file path
     * @param {img_operation} loadImgOp - image operation to read. It can be "image", "superpixel" or "label"
     */
    const dispatchOpenImage = async (imgPath: string, loadImgOp: img_operation) => {
        const params = {
            image_path: imgPath,
            image_dtype: dtype,
            image_raw_shape: [imgShapeRaw[0] || 0, imgShapeRaw[1] || 0, imgShapeRaw[2] || 0],
            use_image_raw_parse: (imgShapeRaw[0] == null && imgShapeRaw[1] == null && imgShapeRaw[2] == null),
        }

        let msgReturned = "";
        let isError = false;
        await sfetch("POST", "/open_image/" + loadImgOp, JSON.stringify(params), "json")
            .then((image: ImageInfoInterface) => {
                const imgName = imgPath.split("/");
                msgReturned = `${imgName[imgName.length - 1]} loaded as ${loadImgOp}`;

                const info: ImageInfoInterface = {
                    imageShape: image.imageShape,
                    imageDtype: image.imageDtype,
                    imageName: image.imageName,
                    imageExt: image.imageExt,
                    imageFullPath: image.imageFullPath
                }

                if (loadImgOp === "superpixel") {
                    dispatch("superpixelChanged", {});
                }

                setShowErrorWindow(false);
                dispatch("ImageLoaded", info);
                dispatch("ActivateComponents", false);

            }).catch((error: ErrorInterface) => {
                msgReturned = error.error_msg;
                isError = true;
                console.log("error while loading the ", loadImgOp);
                console.log(error.error_msg);
                setShowErrorWindow(true);
                setHeaderErrorMsg(`error while loading the ${loadImgOp}`);
                setErrorMsg(error.error_msg);
            });

        const returnedObj: QueueToast = {message: msgReturned, isError: isError};
        return returnedObj;

    }

    /**
     * Function that reads the annotation .pkl file and send to the backend
     */
    const dispatchOpenAnnot = async () => {
        const annotPath = {
            annot_path: (pathFiles.workspacePath !== "") ? pathFiles.workspacePath + pathFiles.annotPath : pathFiles.annotPath,
        }
        let msgReturned = "";
        let isError = false;
        await sfetch("POST", "/open_annot", JSON.stringify(annotPath), "json")
            .then((labelList: LabelInterface[]) => {
                const imgName = pathFiles.annotPath!.split("/");
                msgReturned = `${imgName[imgName.length - 1]} loaded as annotation`;
                console.log("Printing the loaded .pkl label list\n");
                console.log(labelList);
                dispatch("LabelLoaded", labelList);
                dispatch("annotationChanged", null);

            }).catch((error: ErrorInterface) => {
                msgReturned = error.error_msg;
                isError = true;
                console.log("Error message while trying to open the Annotation", error.error_msg);
                setHeaderErrorMsg(`error while loading the annotation`);
                setErrorMsg(error.error_msg);
                setShowErrorWindow(true);
            });

        const returnedObj: QueueToast = {message: msgReturned, isError: isError};
        return returnedObj;

    }

    /**
     * Function that Loads the classifier model .model file and send to the backend
     */
    const dispatchLoadClassifier = async () => {
        const backendPayload: { classificationPath: string } = {
            classificationPath: (pathFiles.workspacePath !== "") ? pathFiles.workspacePath + pathFiles.classificationPath : pathFiles.classificationPath
        }

        let msgReturned = "";
        let isError = false;
        console.table(backendPayload);

        await sfetch("POST", "/load_classifier", JSON.stringify(backendPayload), "json")
            .then((success: string) => {
                msgReturned = `${pathFiles.classificationPath} loaded as .model`;
                // informs canvas that the superpixel image was deleted
                dispatch('superpixelChanged', {});
                // informs aboud annotation updates in the backend
                dispatch('annotationChanged', null);
                // deactivates crop preview mode on canvas
                console.log(success);
            }).catch((error: ErrorInterface) => {
                msgReturned = error.error_msg;
                isError = true;
                console.log("Error message while trying to load the classifier model", error.error_msg);
                setHeaderErrorMsg(`error while loading the classifier model`);
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
            isError: false //Image
        }, {
            message: "",
            isError: false //Superpixel
        }, {
            message: "",
            isError: false //Label
        }, {
            message: "",
            isError: false //Annotation
        }, {
            message: "",
            isError: false //Classifier
        }];

        if (pathFiles.imagePath !== "") {
            const imgPath = (pathFiles.workspacePath !== "") ? pathFiles.workspacePath + pathFiles.imagePath : pathFiles.imagePath
            const promise = dispatchOpenImage(imgPath, "image");
            await promise.then((item: QueueToast) => {
                queueToast[0] = item;
            })
        }

        if (pathFiles.superpixelPath !== "") {
            const superpixelPath = (pathFiles.workspacePath !== "") ? pathFiles.workspacePath + pathFiles.superpixelPath : pathFiles.superpixelPath
            const promise = dispatchOpenImage(superpixelPath, "superpixel");
            await promise.then((item: QueueToast) => {
                queueToast[1] = item;
            })
        }

        if (pathFiles.labelPath !== "") {
            const labelPath = (pathFiles.workspacePath !== "") ? pathFiles.workspacePath + pathFiles.labelPath : pathFiles.labelPath
            const promise = dispatchOpenImage(labelPath, "label");
            await promise.then((item: QueueToast) => {
                queueToast[2] = item;
            })
        }

        if (pathFiles.annotPath !== "") {
            const promise = dispatchOpenAnnot();
            await promise.then((item: QueueToast) => {
                queueToast[3] = item;
            })
        }

        if (pathFiles.classificationPath !== "") {
            const promise = dispatchLoadClassifier();
            await promise.then((item: QueueToast) => {
                queueToast[4] = item;
            });
        }

        let finalMsg = "";
        const flagShowToast = (
            (!queueToast[0].isError && queueToast[0].message !== "") ||
            (!queueToast[1].isError && queueToast[1].message !== "") ||
            (!queueToast[2].isError && queueToast[2].message !== "") ||
            (!queueToast[3].isError && queueToast[3].message !== "") ||
            (!queueToast[4].isError && queueToast[4].message !== ""));

        for (let i = 0; i < queueToast.length; i++) {
            if (queueToast[i].message !== "" && !queueToast[i].isError) {
                finalMsg += `|| ${queueToast[i].message} `;
            }
        }

        dispatch("setDefaultValuesLoad", pathFiles);
        setToastMsg(finalMsg);
        setOpenLoadingMenu(false);
        setShowToast(flagShowToast);

    }

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setPathFiles({
            workspacePath: pathFiles.workspacePath,
            imagePath: pathFiles.imagePath,
            superpixelPath: "",
            labelPath: "",
            annotPath: "",
            classificationPath: ""
        });
        setDtype("uint16");
        setImageShapeRaw([null, null, null]);
        setXRange([0, -1]);
        setYRange([0, -1]);
        setZRange([0, -1]);
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
                className={"file-popover-load"}>
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
                            {/* Load Workspace option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={construct}/>
                                    <IonLabel><small>Load Workspace</small></IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    <IonItem>
                                        <IonLabel position="stacked">Workspace Path</IonLabel>
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
                            {/* Load image option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={image}/>
                                    <IonLabel><small>Load Image *</small></IonLabel>
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
                                                        className={"ion-input"}
                                                        type="number"
                                                        min={"0"}
                                                        value={imgShapeRaw[0]}
                                                        placeholder="X"
                                                        onIonChange={e => setImageShapeRaw([parseInt(e.detail.value!, 10), imgShapeRaw[1], imgShapeRaw[2]])}
                                                    />
                                                    <IonInput
                                                        className={"ion-input"}
                                                        type="number"
                                                        min={"0"}
                                                        value={imgShapeRaw[1]}
                                                        placeholder="Y"
                                                        onIonChange={e => setImageShapeRaw([imgShapeRaw[0], parseInt(e.detail.value!, 10), imgShapeRaw[2]])}
                                                    />
                                                    <IonInput
                                                        className={"ion-input"}
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
                                    <IonItemDivider/>
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
                                    <IonItemDivider/>
                                </IonList>
                            </IonAccordion>
                            {/* Load label image option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={images}/>
                                    <IonLabel><small>Load Label Image</small></IonLabel>
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
                            {/* Load annotation file option */}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={create}/>
                                    <IonLabel><small>Load Annotation File</small></IonLabel>
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
                            {/*Load classifier file option*/}
                            <IonAccordion>
                                <IonItem slot={"header"}>
                                    <IonIcon slot={"start"} icon={barChart}/>
                                    <IonLabel><small>Load Classifier</small></IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    <IonItem>
                                        <IonLabel position="stacked">Classifier Path</IonLabel>
                                        <IonInput
                                            placeholder={"/path/to/classifier.model"}
                                            value={pathFiles.classificationPath}
                                            onIonChange={(e: CustomEvent) => setPathFiles({
                                                ...pathFiles,
                                                classificationPath: e.detail.value!
                                            })}/>
                                    </IonItem>
                                    <IonItemDivider/>
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
                loadingText={"loading the files"}/>
        </>
    );
};

export default FileLoadDialog;
