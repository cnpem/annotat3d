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
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonAccordion,
    IonAccordionGroup
} from "@ionic/react";
import "../../styles/FileDialog.css"
import dataType from "./Dtypes";
import {options} from "ionicons/icons";
import {sfetch} from "../../../utils/simplerequest";
import {dispatch} from "../../../utils/eventbus";

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

interface ImageInfoInterface{
    imageShape: Array<number> [3];
    imageName: string;
    imageExt: string;
    imageDtype: string;
}

interface ImageButtonOption{
    image_path: string;
}

interface SuperpixelButtonOption{
    axis: "XY" | "XZ" | "YZ";
}

/**
 * Load Image dialog
 * @param name
 * @constructor
 */
const FileLoadDialog: React.FC<{ name: string }> = ({name}) => {
    // Init States
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });

    const [path, setPath] = useState<string>();
    const [imgShapeRaw, setImageShapeRaw] = useState(new Array(3))
    const [dtype, setDtype] = useState<string>();
    const [xRange, setXRange] = useState([0, -1]);
    const [yRange, setYRange] = useState([0, -1]);
    const [zRange, setZRange] = useState([0, -1]);
    const [loadImgOp, setLoadImagOp] = useState<"image" | "label" | "superpixel">("image");
    const [imageInfo, setImageInfo] = useState<ImageInfoInterface>({imageDtype: "", imageName: "", imageExt: "", imageShape: 0})

    const handleLoadImgOP = (e: CustomEvent) => {
        const buttonSegName = e.detail!.value!
        setLoadImagOp(buttonSegName);
    }

    const handleImageOption = () => {

    }

    const handleLabelOption = (params: {axis: "XY" | "XZ" | "YZ", slice: number}) => {


    }

    const handleLoadImageAction = () => {

        const params = {
            image_path: path,
            dtype: "uint16",
        }

        sfetch("POST", "/open_image", JSON.stringify(params), "json").then(
            (image) => {
                console.log("image info ", image);
                const info = {
                    imageShape: image.image_shape,
                    imageDtype: image.image_dtype,
                    imageName: image.image_name,
                    imageExt: image.image_ext,
                }

                setImageInfo(info);
                dispatch("ImageLoaded", imageInfo);
            });

    }

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setPath("");
        setDtype("");
        setImageShapeRaw([null, null, null]);
        setXRange([0, -1]);
        setYRange([0, -1]);
        setZRange([0, -1]);
        setLoadImagOp("image");
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
                        {/* Select Image/Label/Superpixel */}
                        <IonSegment value={loadImgOp} onIonChange={handleLoadImgOP}
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
                    {/* Image Path Text Input*/}
                    <IonItemDivider>Image Path</IonItemDivider>
                    <IonItem>
                        <IonTextarea
                            placeholder={"path/to/file"}
                            value={path}
                            onIonChange={e => setPath(e.detail.value!)}
                        />
                    </IonItem>
                    {/* Image Size Grid*/}
                    <IonItemDivider> Image Size</IonItemDivider>
                    <IonItem>
                        <IonGrid>
                            <IonRow>
                                <IonCol>
                                    <IonInput
                                        type="number"
                                        min={"0"}
                                        value={imgShapeRaw[0]}
                                        placeholder="X"
                                        onIonChange={e => setImageShapeRaw([parseInt(e.detail.value!, 10), imgShapeRaw[1], imgShapeRaw[2]])}
                                    />
                                </IonCol>
                                <IonCol>
                                    <IonInput
                                        type="number"
                                        min={"0"}
                                        value={imgShapeRaw[1]}
                                        placeholder="Y"
                                        onIonChange={e => setImageShapeRaw([imgShapeRaw[0], parseInt(e.detail.value!, 10), imgShapeRaw[2]])}
                                    />
                                </IonCol>
                                <IonCol>
                                    <IonInput
                                        type="number"
                                        min={"0"}
                                        value={imgShapeRaw[2]}
                                        placeholder="Z"
                                        onIonChange={e => setImageShapeRaw([imgShapeRaw[0], imgShapeRaw[1], parseInt(e.detail.value!, 10)])}
                                    />
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    </IonItem>
                    <IonItem>
                        {/* Select dtype */}
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
                {/* Advanced Options Accordion */}
                <IonAccordionGroup>
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={options}/>
                            <IonLabel>Advanced Options</IonLabel>
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
                                        placeholder="Y1"
                                        onIonChange={e => setZRange([zRange[0], parseInt(e.detail.value!, 10)])}
                                    />
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    </IonAccordion>
                </IonAccordionGroup>
                <IonButton color={"tertiary"} slot={"end"} onClick={handleLoadImageAction}>
                    Load!
                </IonButton>
            </IonPopover>
            {/* Load Button */}
            <IonItem button
                     onClick={(e) => setShowPopover({open: true, event: e.nativeEvent})}
            >
                {name}
            </IonItem>
        </>
    );
};

export default FileLoadDialog;
