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
import "./FileDialog.css"
import dataType from "./Dtypes";
import {options} from "ionicons/icons";

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
    const [, setKind] = useState<string>();
    const [path, setPath] = useState<string>();
    const [shape, setShape] = useState(new Array(3))
    const [dtype, setDtype] = useState<string>();
    const [xRange, setXRange] = useState([0, -1]);
    const [yRange, setYRange] = useState([0, -1]);
    const [zRange, setZRange] = useState([0, -1]);

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({open: false, event: undefined});
        setPath("");
        setDtype("");
        setShape([null, null, null]);
        setXRange([0, -1]);
        setYRange([0, -1]);
        setZRange([0, -1]);
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
                                        value={shape[0]}
                                        placeholder="X"
                                        onIonChange={e => setShape([parseInt(e.detail.value!, 10), shape[1], shape[2]])}
                                    />
                                </IonCol>
                                <IonCol>
                                    <IonInput
                                        type="number"
                                        min={"0"}
                                        value={shape[1]}
                                        placeholder="Y"
                                        onIonChange={e => setShape([shape[0], parseInt(e.detail.value!, 10), shape[2]])}
                                    />
                                </IonCol>
                                <IonCol>
                                    <IonInput
                                        type="number"
                                        min={"0"}
                                        value={shape[2]}
                                        placeholder="Z"
                                        onIonChange={e => setShape([shape[0], shape[1], parseInt(e.detail.value!, 10)])}
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
                <IonButton color={"tertiary"} slot={"end"}>
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
