import "./Dataset.css"
import React, {Fragment, useState} from "react";
import {
    IonAccordion,
    IonAccordionGroup,
    IonButton, IonIcon, IonInput, IonItem, IonItemDivider, IonLabel, IonList,
    IonPopover, IonSegment, IonSegmentButton, IonToast, SegmentChangeEventDetail, useIonToast
} from "@ionic/react";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import SamplingComp from "./SamplingComp";
import {useStorageState} from "react-storage-hooks";
import {
    AugmentationInterface,
    InitAugmentationOptions,
    InitIonRangeVec,
    IonRangeElement, SamplingInterface
} from "./DatasetInterfaces";
import AugmentationComp from "./AugmentationComp";
import {checkbox, construct, image} from "ionicons/icons";
import {sfetch} from "../../../../utils/simplerequest";
import ErrorInterface from "../../file/ErrorInterface";

interface H5InputInterface {
    trigger: string,
    sample: SamplingInterface,
    augmentation: AugmentationInterface[],
    ionRangeVec: IonRangeElement[],
    workspacePath: string,
    onWorkspacePath: (workspace: string) => void,
}

interface BackendPayload {
    sample: SamplingInterface,
    augmentation: AugmentationInterface[],
    ion_range_vec: IonRangeElement[],
    file_path: string
}

/**
 * Component that creates the dataset loader menu
 * @param trigger {string} - string to use as a trigger to open the menu to create the dataset .h5
 * @param sample {SamplingInterface} - object used as the sample element to send to backend
 * @param augmentation {AugmentationInterface[]} - vector of objects for the augmentation parameters
 * @param ionRangeVec {IonRangeElement[]} - vector of ion-range that contains all the values for the augmentation
 * @param workspacePath {string} - string that contains the workspace path for the dataset
 * @param onWorkspacePath {(workspace: string) => void} - setter for workspacePath
 */
const CreateDatasetH5: React.FC<H5InputInterface> = ({
                                                         trigger,
                                                         sample,
                                                         augmentation,
                                                         ionRangeVec,
                                                         workspacePath,
                                                         onWorkspacePath
                                                     }) => {

    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [filePath, setFilePath] = useState<string>("");
    const [showToast] = useIonToast();
    const timeToast = 2000;

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    const readFile = () => {
        setShowLoadingComp(true);
        let datasetPath: { datasetFilename: string } = {
            datasetFilename: ""
        };
        const params: BackendPayload = {
            sample: sample,
            augmentation: augmentation,
            ion_range_vec: ionRangeVec,
            file_path: workspacePath + filePath
        };
        sfetch("POST", "/create_dataset", JSON.stringify(params), "json").then(
            (dataset_path: { datasetFilename: string }) => {
                datasetPath = dataset_path;
            }).catch((error: ErrorInterface) => {
            console.log("Error in create_dataset");
            console.log(error.error_msg);
            setErrorMsg(error.error_msg);
            setShowErrorWindow(true);
        }).finally(() => {
            setShowLoadingComp(false);
            if (datasetPath.datasetFilename !== "") {
                showToast(`success creating the dataset ${datasetPath.datasetFilename}`, timeToast);
            }
        });
    }

    return (
        <IonPopover
            trigger={trigger}
            side={"top"}
            alignment={"center"}
            className={"create-h5-popover"}
            onDidDismiss={() => {
                setFilePath("");
            }}>
            <IonAccordionGroup>
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
                                    onWorkspacePath(e.detail.value);
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
                    readFile();
                }}>Save Dataset</IonButton>
            <ErrorWindowComp
                headerMsg={`Error trying to create the dataset`}
                errorMsg={errorMsg}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
            <IonToast
                isOpen={showLoadingComp}
                message={"Creating the dataset. Please wait a little"}/>
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
    const [workspaceName, setWorkspaceName] = useStorageState<string>(sessionStorage, "workspaceName", "");
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [augmentationOpSelected, setAugmentationOpSelected] = useState<AugmentationInterface[]>(InitAugmentationOptions);
    const [ionRangeVec, setIonRangeVec] = useState<IonRangeElement[]>(InitIonRangeVec);

    const [sampleElement, setSampleElement] = useStorageState<SamplingInterface>(sessionStorage, "sampleElement", {
        nClasses: 2,
        sampleSize: 100,
        patchSize: [256, 256, 1],
    });

    const handleWorkspaceName = (workspace: string) => {
        setWorkspaceName(workspace);
    }

    const handleSampleElement = (sample: SamplingInterface) => {
        setSampleElement(sample);
    }

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

    const menus = [<SamplingComp
        sampleElement={sampleElement}
        onSampling={handleSampleElement}
        workspacePath={workspaceName}
        onWorkspacePath={handleWorkspaceName}/>, <AugmentationComp
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
                    <CreateDatasetH5
                        augmentation={augmentationOpSelected}
                        ionRangeVec={ionRangeVec}
                        sample={sampleElement}
                        trigger={"open-h5-input"}
                        workspacePath={workspaceName}
                        onWorkspacePath={handleWorkspaceName}/>
                </IonButton>
            </IonPopover>
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={"Error while loading the file"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
        </Fragment>
    );
}

export default DatasetComp;