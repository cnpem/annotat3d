import "./Dataset.css"
import React, {Fragment, useState} from "react";
import {
    IonAccordion,
    IonAccordionGroup,
    IonButton, IonIcon, IonInput, IonItem, IonItemDivider, IonLabel, IonList,
    IonPopover, IonSegment, IonSegmentButton, SegmentChangeEventDetail
} from "@ionic/react";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import SamplingComp from "./SamplingComp";
import {useStorageState} from "react-storage-hooks";
import {
    AugmentationInterface,
    InitAugmentationOptions,
    InitIonRangeVec,
    IonRangeElement
} from "./DatasetInterfaces";
import AugmentationComp from "./AugmentationComp";
import {checkbox, construct, image} from "ionicons/icons";
import {sfetch} from "../../../../utils/simplerequest";
import ErrorInterface from "../../file/ErrorInterface";

interface H5InputInterface {
    trigger: string
}

const CreateDatasetH5: React.FC<H5InputInterface> = ({trigger}) => {

    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [workspacePath, setWorkspacePath] = useState<string>("");
    const [filePath, setFilePath] = useState<string>("");

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    //TODO : i need to implement a function to call the back-end here
    // const readFile = () => {
    //     pathFiles.workspacePath = workspacePath;
    //     pathFiles.file.filePath = filePath;
    //     const params: BackendPayload = {
    //         image_path: pathFiles.workspacePath + pathFiles.file.filePath,
    //         image_dtype: pathFiles.file.type,
    //         image_raw_shape: [pathFiles.file.shape[0] || 0, pathFiles.file.shape[1] || 0, pathFiles.file.shape[2] || 0],
    //         use_image_raw_parse: (pathFiles.file.shape[0] == null && pathFiles.file.shape[1] == null && pathFiles.file.shape[2] == null)
    //     }
    //
    //     sfetch("POST", `/open_files_dataset/${typeOperation.toLowerCase()}-${pathFiles.id}`, JSON.stringify(params), "json").then(
    //         (element: Taopen-h5-inputElement) => {
    //             console.log("Backend response");
    //             console.taopen-h5-input(element);
    //             pathFiles.file = element
    //             onTaopen-h5-inputVec(pathFiles, typeOperation);
    //             pathFiles.id += 1;
    //
    //         }).catch((error: ErrorInterface) => {
    //         console.log("error while trying to add an image")
    //         console.log(error.error_msg);
    //         setErrorMsg(error.error_msg);
    //         setShowErrorWindow(true);
    //     })
    // }

    return (
        <IonPopover
            trigger={trigger}
            className={"create-h5-popover"}
            onDidDismiss={() => {
                setFilePath("");
            }}>
            <IonAccordionGroup multiple={true}>
                {/*Load workspace menu*/}
                <IonAccordion>
                    <IonItem slot={"header"}>
                        <IonIcon slot={"start"} icon={construct}/>
                        <IonLabel><small>Load Dataset workspace</small></IonLabel>
                    </IonItem>
                    <IonList slot={"content"}>
                        <IonItem>
                            <IonLabel position="stacked">Workspace Path</IonLabel>
                            <IonInput
                                placeholder={"/path/to/workspace"}
                                value={workspacePath}
                                onIonChange={(e: CustomEvent) => {
                                    setWorkspacePath(e.detail.value);
                                }}/>
                        </IonItem>
                        <IonItemDivider/>
                    </IonList>
                </IonAccordion>
                {/*Load type menu*/}
                <IonAccordion>
                    <IonItem slot={"header"}>
                        <IonIcon slot={"start"} icon={image}/>
                        <IonLabel><small>Load Dataset Path</small></IonLabel>
                    </IonItem>
                    <IonList slot={"content"}>
                        <IonItem>
                            <IonLabel position="stacked">Dataset Path</IonLabel>
                            <IonInput
                                placeholder={`/path/to/.H5`}
                                value={filePath}
                                onIonChange={(e: CustomEvent) => {
                                    setFilePath(e.detail.value);
                                }}/>
                        </IonItem>
                        <IonItemDivider/>
                    </IonList>
                </IonAccordion>
            </IonAccordionGroup>
            <IonButton
                size={"default"}
                color={"tertiary"}
                onClick={() => {
                    console.log(workspacePath);
                    console.log(filePath);
                }}>Save Dataset</IonButton>
            <ErrorWindowComp
                headerMsg={`Error trying to add an element in dataset`}
                errorMsg={errorMsg}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
        </IonPopover>
    );
}

const menuChoices = ["sampling", "augmentation"] as const;
type InputMenuChoicesType = typeof menuChoices[number];

/**
 * Component that load or save a Workspace, Network or Batch Inference
 * @example <DatasetComp/>
 */
const DatasetComp: React.FC = () => {

    const [menuOp, setMenuOp] = useStorageState<InputMenuChoicesType>(sessionStorage, "DatasetMenu", "sampling");
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [augmentationOpSelected, setAugmentationOpSelected] = useState<AugmentationInterface[]>(InitAugmentationOptions);
    const [ionRangeVec, setIonRangeVec] = useState<IonRangeElement[]>(InitIonRangeVec);

    const changeCheckedStatus = (index: number) => {
        const newCheckedVector = augmentationOpSelected.map(
            element => element.checkedId === index
                ? {...element, isChecked: !element.isChecked} : element
        );
        setAugmentationOpSelected(newCheckedVector);
    }

    const changeIonRangeVal = (newSliderNumber: { lower: number, upper: number }, index: number) => {
        const newIonRangeVec = ionRangeVec.map(
            element => element.ionRangeId === index
                ? {...element, actualRangeVal: newSliderNumber} : element
        );
        setIonRangeVec(newIonRangeVec);
    }

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    const selectMenuOp = (e: CustomEvent<SegmentChangeEventDetail>) => {
        setMenuOp(e.detail.value as InputMenuChoicesType);
    };

    const renderSegmentButton = (choice: InputMenuChoicesType) => {
        return (
            <IonSegmentButton value={choice}>
                <IonLabel>{choice}</IonLabel>
            </IonSegmentButton>
        );
    }

    const menus = [<SamplingComp/>, <AugmentationComp
        checkedVector={augmentationOpSelected}
        onCheckedVector={changeCheckedStatus}
        ionRangeVec={ionRangeVec}
        onIonRangeVec={changeIonRangeVal}/>];

    const renderMenu = (choice: InputMenuChoicesType, idx: number) => {
        return (
            <div hidden={menuOp !== choice}>{menus[idx]}</div>
        );
    }

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowErrorWindow(false);
        setErrorMsg("");
        setAugmentationOpSelected(InitAugmentationOptions);
        setIonRangeVec(InitIonRangeVec);
    };
    return (
        <Fragment>
            {/* Function effect to open the popup */}
            <IonItem button
                     id={"open-menu-dataset"}>
                Dataset
            </IonItem>
            <IonPopover
                trigger={"open-menu-dataset"}
                onDidDismiss={() => cleanUp()}
                className={"file-popover-dataset"}>
                <IonSegment value={menuOp} onIonChange={selectMenuOp}>
                    {menuChoices.map(renderSegmentButton)}
                </IonSegment>
                {menuChoices.map(renderMenu)}
                <IonButton
                    id={"open-h5-input"}
                    color={"tertiary"}
                    slot={"end"}>
                    OK
                    <IonIcon
                        icon={checkbox}
                        slot={"end"}/>
                </IonButton>
            </IonPopover>
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={"Error while loading the file"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
            <CreateDatasetH5
                trigger={"open-h5-input"}/>
        </Fragment>
    );
}

export default DatasetComp;