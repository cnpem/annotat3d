import React, {useState} from "react";
import {
    IonAccordion,
    IonAccordionGroup, IonAlert, IonButton, IonButtons, IonCol,
    IonContent,
    IonIcon, IonInput,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList, IonPopover, IonRow
} from "@ionic/react";
import {addOutline, closeOutline, image, trashOutline} from "ionicons/icons";
import {useStorageState} from "react-storage-hooks";
import {currentEventValue, dispatch, useEventBus} from "../../../../utils/eventbus";
import * as ReactBootStrap from "react-bootstrap";
import {InitTables, TableInterface, type_operation} from "./DatasetInterfaces";
import "./Tables.css";
import "./Dataset.css";

interface MultiplesPath {
    id: number,
    workspacePath: string,
    filePath: string,
}

interface AddNewFileInterface {
    idMenu: number,
    onIdMenu: (newId: number, type: type_operation) => void,
    onTableVec: (newFile: MultiplesPath, typeOperation: type_operation) => void,
    typeOperation: type_operation,
    trigger: string,
}

/**
 * React component that creates the add menu interface
 * @param idMenu {number} - id used to create a new element in the table
 * @param onIdMenu {(newId: number, type: type_operation)} - handler used to update the idMenu for a especific table
 * @param onTableVec {(newFile: MultiplesPath) => void} - setter used to create a new element
 * @param trigger {string} - string that contains the trigger to open the popup
 * @param typeOperation {type_operation} - string variable that contains the information if the menu is for Data, label or Weight
 */
const AddNewFile: React.FC<AddNewFileInterface> = ({
                                                       idMenu,
                                                       onIdMenu,
                                                       onTableVec,
                                                       typeOperation,
                                                       trigger,
                                                   }) => {
    let pathFiles: MultiplesPath = {
        id: idMenu,
        workspacePath: "",
        filePath: ""
    };

    return (
        <IonPopover
            trigger={trigger}
            className={"add-menu"}
            onDidDismiss={() => onIdMenu(pathFiles.id, typeOperation)}>
            <IonAccordionGroup multiple={true}>
                {/*Load workspace menu*/}
                <IonAccordion>
                    <IonItem slot={"header"}>
                        <IonLabel><small>Load {typeOperation} workspace</small></IonLabel>
                    </IonItem>
                    <IonList slot={"content"}>
                        <IonItem>
                            <IonLabel position="stacked">Workspace Path</IonLabel>
                            <IonInput
                                placeholder={"/path/to/workspace"}
                                value={pathFiles.workspacePath}
                                onIonChange={(e: CustomEvent) => {
                                    pathFiles.workspacePath = e.detail.value!
                                }}/>
                        </IonItem>
                    </IonList>
                </IonAccordion>
                {/*Load type menu*/}
                <IonAccordion>
                    <IonItem slot={"header"}>
                        <IonIcon slot={"start"} icon={image}/>
                        <IonLabel><small>Load {typeOperation}</small></IonLabel>
                    </IonItem>
                    <IonList slot={"content"}>
                        <IonItem>
                            <IonLabel position="stacked">{typeOperation} Path</IonLabel>
                            <IonInput
                                placeholder={`/path/to/${typeOperation}`}
                                value={pathFiles.filePath}
                                onIonChange={(e: CustomEvent) => {
                                    pathFiles.filePath = e.detail.value!
                                }}/>
                        </IonItem>
                    </IonList>
                </IonAccordion>
            </IonAccordionGroup>
            <IonButton
                size={"default"}
                color={"tertiary"}
                onClick={() => {
                    console.log("type operation : ", typeOperation);
                    console.log("path");
                    console.table(pathFiles);
                    onTableVec(pathFiles, typeOperation);
                    pathFiles.id += 1;
                }}>Load {typeOperation}</IonButton>
        </IonPopover>
    );
}

interface WarningWindowInterface {
    openWarningWindow: boolean,
    onOpenWarningWindow: (flag: boolean) => void,

    typeOperation: type_operation,
    onTableList: (typeOperation: type_operation) => void,
}

/**
 * Component used to create an ion-Alert to delete all elements of a table
 * @todo : need to implement the backend function later
 * @param openWarningWindow {boolean} - boolean variable to open this window
 * @param onOpenWarningWindow {(flag: boolean) => void} - handler for openWarningWindow
 * @param typeOperation {type_operation} - type of operation to delete
 * @param onTableList {(typeOperation: type_operation) => void} - handler to delete all elements of a table
 */
const DeleteAllWindow: React.FC<WarningWindowInterface> = ({
                                                               openWarningWindow,
                                                               onOpenWarningWindow,
                                                               typeOperation,
                                                               onTableList
                                                           }) => {

    return (
        <IonAlert
            isOpen={openWarningWindow}
            onDidDismiss={() => onOpenWarningWindow(false)}
            header={`Deleting all ${typeOperation}s`}
            message={`Do you wish to delete all ${typeOperation}s ?`}
            buttons={[
                {
                    text: "No",
                    id: "no-button",
                    handler: () => {
                        onOpenWarningWindow(false);
                    }
                },
                {
                    text: "Yes",
                    id: "yes-button",
                    handler: () => {
                        onTableList(typeOperation);
                        onOpenWarningWindow(false);
                    }
                }
            ]}/>
    )
}

interface DeleteMenuInterface {
    labelElement: TableInterface,
    removeLabelElement: (labelElement: TableInterface) => void,
}

/**
 * Component used in Filename in each bootstrap-table map. This table can be for Data, Label or Weight.
 * @param labelElement {TableInterface} - element of a bootstrap-table
 * @param removeLabelElement {(labelElement: TableInterface) => void} - function to delete an element of a bootstrap-table
 */
const FileNameComp: React.FC<DeleteMenuInterface> = ({labelElement, removeLabelElement}) => {
    const [showAlert, setShowAlert] = useState<boolean>(false);
    return (
        <IonItem className={"ion-item-table"}
                 id={"file-name-comp"}>
            <IonButtons>
                <IonButton id={`delete-${labelElement.typeOperation}-button-${labelElement.id}`}
                           size="small"
                           onClick={() => {
                               console.log("label to delete : ", labelElement);
                               console.table(labelElement);
                               setShowAlert(true);
                           }}>
                    <IonIcon icon={closeOutline}/>
                </IonButton>
                {/*Delete popUp*/}
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={() => setShowAlert(false)}
                    message={`Do you wish to delete the ${labelElement.typeOperation} with name "${labelElement.element.file}" ?`}
                    buttons={[
                        {
                            text: "No",
                            id: "no-button",
                            handler: () => {
                                setShowAlert(false);
                            }
                        },
                        {
                            text: "Yes",
                            id: "yes-button",
                            handler: () => {
                                removeLabelElement(labelElement);
                                setShowAlert(false);
                            }
                        }
                    ]}/>
            </IonButtons>
            {labelElement.element.file}
        </IonItem>
    );
}

interface SamplingInterface {
    nClasses: number,
    sampleSize: number,
    patchSize: Array<number>;
}

/**
 * Component that hold all the Sampling options
 */
const SamplingComp: React.FC = () => {

    const [darkMode, setDarkMode] = useState<boolean>(currentEventValue('toggleMode'));
    const [openDeleteAll, setOpenDeleteAll] = useState<boolean>(false);
    const [typeOperation, setTypeOperation] = useState<type_operation>("Data");

    const [dataTable, setDataTable] = useStorageState<TableInterface[]>(sessionStorage, 'dataTable', InitTables);
    const [labelTable, setLabelTable] = useStorageState<TableInterface[]>(sessionStorage, 'labelTableDataset', InitTables);
    const [weightTable, setWeightTable] = useStorageState<TableInterface[]>(sessionStorage, 'WeightTable', InitTables);
    const [idTableData, setIdTableData] = useStorageState<number>(sessionStorage, "idTableData", 0);
    const [idTableLabel, setIdTableLabel] = useStorageState<number>(sessionStorage, "idTableLabel", 0);
    const [idTableWeight, setIdTableWeight] = useStorageState<number>(sessionStorage, "idTableWeight", 0);

    useEventBus('toggleMode', (darkMode: boolean) => {
        setDarkMode(darkMode);
    });

    const handleOpenDeleteAll = (flag: boolean) => {
        setOpenDeleteAll(flag);
    }

    //TODO : need to implement the back-end function to read the images here
    const handleDataTable = (newFile: MultiplesPath, typeOperation: type_operation) => {
        if (newFile.id === 0) {
            setDataTable([{
                id: newFile.id,
                typeOperation: typeOperation,
                element: {
                    file: newFile.filePath,
                    shape: [0, 0, 0],
                    type: "",
                    scan: "",
                    time: 0,
                    size: 0,
                    fullPath: newFile.workspacePath + newFile.filePath
                }
            }]);
        } else {
            setDataTable([...dataTable, {
                id: newFile.id,
                typeOperation: typeOperation,
                element: {
                    file: newFile.filePath,
                    shape: [0, 0, 0],
                    type: "",
                    scan: "",
                    time: 0,
                    size: 0,
                    fullPath: newFile.workspacePath + newFile.filePath
                }
            }]);
        }
        setIdTableData(newFile.id + 1);
    }

    //TODO : need to implement the back-end function to read the images here
    const handleLabelTable = (newFile: MultiplesPath, typeOperation: type_operation) => {
        if (newFile.id === 0) {
            setLabelTable([{
                id: newFile.id,
                typeOperation: typeOperation,
                element: {
                    file: newFile.filePath,
                    shape: [0, 0, 0],
                    type: "",
                    scan: "",
                    time: 0,
                    size: 0,
                    fullPath: newFile.workspacePath + newFile.filePath
                }
            }]);
        } else {
            setLabelTable([...labelTable, {
                id: newFile.id,
                typeOperation: typeOperation,
                element: {
                    file: newFile.filePath,
                    shape: [0, 0, 0],
                    type: "",
                    scan: "",
                    time: 0,
                    size: 0,
                    fullPath: newFile.workspacePath + newFile.filePath
                }
            }]);
        }
        setIdTableLabel(newFile.id + 1);
    }

    //TODO : need to implement the back-end function to read the images here
    const handleWeightTable = (newFile: MultiplesPath, typeOperation: type_operation) => {
        if (newFile.id === 0) {
            setWeightTable([{
                id: newFile.id,
                typeOperation: typeOperation,
                element: {
                    file: newFile.filePath,
                    shape: [0, 0, 0],
                    type: "",
                    scan: "",
                    time: 0,
                    size: 0,
                    fullPath: newFile.workspacePath + newFile.filePath
                }
            }]);
        } else {
            setWeightTable([...weightTable, {
                id: newFile.id,
                typeOperation: typeOperation,
                element: {
                    file: newFile.filePath,
                    shape: [0, 0, 0],
                    type: "",
                    scan: "",
                    time: 0,
                    size: 0,
                    fullPath: newFile.workspacePath + newFile.filePath
                }
            }]);
        }
        setIdTableWeight(newFile.id + 1);
    }

    const handleIdValues = (newId: number, type: type_operation) => {
        if (type === "Data") {
            setIdTableData(newId);
        } else if (type === "Label") {
            setIdTableLabel(newId);
        } else if (type === "Weight") {
            setIdTableWeight(newId);
        }
    }

    const resetTable = (typeOperation: type_operation) => {
        if (typeOperation === "Data") {
            setDataTable([]);
            setIdTableData(0);
        } else if (typeOperation === "Label") {
            setLabelTable([]);
            setIdTableLabel(0);
        } else if (typeOperation === "Weight") {
            setWeightTable([]);
            setIdTableWeight(0);
        }
    }

    const [selectedLabel, setSelectedLabel] = useStorageState<number>(sessionStorage, 'selectedLabel', 0);
    const [sampleElement, setSampleElement] = useStorageState<SamplingInterface>(sessionStorage, "sampleElement", {
        nClasses: 2,
        sampleSize: 100,
        patchSize: [256, 256, 1],
    });

    const removeLabelElement = (labelElement: TableInterface) => {
        if (labelElement.typeOperation === "Data") {
            const newVec = dataTable!.filter(l => l.id !== labelElement.id);
            if (newVec.length === 0) {
                setIdTableData(0);
            }
            setDataTable(newVec);
        } else if (labelElement.typeOperation === "Label") {
            const newVec = labelTable!.filter(l => l.id !== labelElement.id);
            if (newVec.length === 0) {
                setIdTableLabel(0);
            }
            setLabelTable(newVec);
        } else if (labelElement.typeOperation === "Weight") {
            const newVec = weightTable!.filter(l => l.id !== labelElement.id);
            if (newVec.length === 0) {
                setIdTableWeight(0);
            }
            setWeightTable(newVec);
        }
    }

    const selectLabel = (id: number) => {
        setSelectedLabel(id);
        dispatch('labelSelected', {
            id: id
        });
    }

    const renderLabel = (labelElement: TableInterface) => {
        const isActive = labelElement.id === selectedLabel;
        return (
            <tr key={labelElement.id} className={isActive ? "label-table-active" : ""}
                onClick={() => selectLabel(labelElement.id)}>
                {/*Table Content*/}
                <td>
                    <FileNameComp
                        labelElement={labelElement}
                        removeLabelElement={removeLabelElement}/>
                </td>
                <td>
                    <IonItem className={"ion-item-table"}>
                        {`${labelElement.element.shape[0]} x ${labelElement.element.shape[1]} x ${labelElement.element.shape[2]}`}
                    </IonItem>
                </td>
                <td>
                    <IonItem className={"ion-item-table"}>
                        {labelElement.element.type}
                    </IonItem>
                </td>
                <td>
                    <IonItem className={"ion-item-table"}>
                        {labelElement.element.scan}
                    </IonItem>
                </td>
                <td>
                    <IonItem className={"ion-item-table"}>
                        {labelElement.element.time}
                    </IonItem>
                </td>
                <td>
                    <IonItem className={"ion-item-table"}>
                        {labelElement.element.size}
                    </IonItem>
                </td>
                <td>
                    <IonItem className={"ion-item-table"}>
                        {labelElement.element.fullPath}
                    </IonItem>
                </td>
            </tr>
        );

    };

    const NAME_WIDTH = "col-3";

    return (
        <small>
            <IonContent
                scrollEvents={true}>
                {/*Sampling menu option*/}
                <IonAccordionGroup multiple={true}>
                    {/*Data menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Data</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <div style={{display: "flex", justifyContent: "flex-end"}}>
                                <IonButton
                                    id={"data-menu"}
                                    size={"default"}>
                                    <IonIcon
                                        icon={addOutline}
                                        slot={"end"}/>
                                    Add
                                </IonButton>
                                <IonButton
                                    color={"danger"}
                                    size={"default"}
                                    slot={"end"}
                                    disabled={dataTable.length <= 0}
                                    onClick={() => {
                                        setTypeOperation("Data");
                                        setOpenDeleteAll(true);
                                    }}>
                                    <IonIcon icon={trashOutline} slot={"end"}/>
                                    Delete all
                                </IonButton>
                            </div>
                            {/*Data table*/}
                            <div className={"label-table-dataset table-responsive text-nowrap"}>
                                <ReactBootStrap.Table
                                    striped bordered hover
                                    className={darkMode ? 'table-dark table-sm' : ''}>
                                    <thead>
                                    <tr>
                                        <th className={NAME_WIDTH}><IonLabel>File Name</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Shape</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Type</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Scan</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Time</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Size</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Full Path</IonLabel></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {dataTable!.map(renderLabel)}
                                    </tbody>
                                </ReactBootStrap.Table>
                            </div>
                            <AddNewFile
                                idMenu={idTableData}
                                onIdMenu={handleIdValues}
                                onTableVec={handleDataTable}
                                trigger={"data-menu"}
                                typeOperation={"Data"}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Label menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Label</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <div style={{display: "flex", justifyContent: "flex-end"}}>
                                <IonButton
                                    id={"label-menu"}
                                    size={"default"}>
                                    <IonIcon
                                        icon={addOutline}
                                        slot={"end"}/>
                                    Add
                                </IonButton>
                                <IonButton
                                    color={"danger"}
                                    size={"default"}
                                    slot={"end"}
                                    disabled={labelTable.length <= 0}
                                    onClick={() => {
                                        setTypeOperation("Label");
                                        setOpenDeleteAll(true);
                                    }}>
                                    <IonIcon icon={trashOutline} slot={"end"}/>
                                    Delete all
                                </IonButton>
                            </div>
                            <div className={"label-table-dataset table-responsive text-nowrap"}>
                                <ReactBootStrap.Table striped bordered hover
                                                      className={darkMode ? 'table-dark w-auto' : 'w-auto'}>
                                    <thead>
                                    <tr>
                                        <th className={NAME_WIDTH}><IonLabel>File Name</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Shape</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Type</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Scan</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Time</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Size</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Full Path</IonLabel></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {labelTable!.map(renderLabel)}
                                    </tbody>
                                </ReactBootStrap.Table>
                            </div>
                            <AddNewFile
                                idMenu={idTableLabel}
                                onIdMenu={handleIdValues}
                                onTableVec={handleLabelTable}
                                trigger={"label-menu"}
                                typeOperation={"Label"}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Weight menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Weight</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <div style={{display: "flex", justifyContent: "flex-end"}}>
                                <IonButton
                                    id={"weight-menu"}
                                    size={"default"}>
                                    <IonIcon
                                        icon={addOutline}
                                        slot={"end"}/>
                                    Add
                                </IonButton>
                                <IonButton
                                    color={"danger"}
                                    size={"default"}
                                    slot={"end"}
                                    disabled={weightTable.length <= 0}
                                    onClick={() => {
                                        setTypeOperation("Weight");
                                        setOpenDeleteAll(true);
                                    }}>
                                    <IonIcon icon={trashOutline} slot={"end"}/>
                                    Delete all
                                </IonButton>
                            </div>
                            <div className={"label-table-dataset table-responsive text-nowrap"}>
                                <ReactBootStrap.Table striped bordered hover
                                                      className={darkMode ? 'table-dark' : ''}>
                                    <thead>
                                    <tr>
                                        <th className={NAME_WIDTH}><IonLabel>File Name</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Shape</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Type</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Scan</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Time</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Size</IonLabel></th>
                                        <th className={NAME_WIDTH}><IonLabel>Full Path</IonLabel></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {weightTable!.map(renderLabel)}
                                    </tbody>
                                </ReactBootStrap.Table>
                            </div>
                            <AddNewFile
                                idMenu={idTableWeight}
                                onIdMenu={handleIdValues}
                                onTableVec={handleWeightTable}
                                trigger={"weight-menu"}
                                typeOperation={"Weight"}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Sampling menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Sampling</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            {/*# Classes*/}
                            <IonItem>
                                <IonRow>
                                    <IonCol>
                                        <IonLabel># Classes</IonLabel>
                                        <div style={{display: "flex", justifyContent: "flex-start"}}>
                                            <IonInput
                                                type={"number"}
                                                min={"0"} value={sampleElement.nClasses}
                                                onIonChange={(e: CustomEvent) => {
                                                    setSampleElement({
                                                        ...sampleElement,
                                                        nClasses: parseInt(e.detail.value!, 10)
                                                    })
                                                }}/>
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonItem>
                            {/*Sample Size*/}
                            <IonItem>
                                <IonRow>
                                    <IonCol>
                                        <IonLabel>Sample Size</IonLabel>
                                        <div style={{display: "flex", justifyContent: "flex-start"}}>
                                            <IonInput
                                                type={"number"}
                                                min={"0"} value={sampleElement.sampleSize}
                                                onIonChange={(e: CustomEvent) => {
                                                    setSampleElement({
                                                        ...sampleElement,
                                                        sampleSize: parseInt(e.detail.value!, 10)
                                                    })
                                                }}/>
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonItem>
                            {/*Patch Size*/}
                            <IonItem>
                                <IonRow>
                                    <IonCol>
                                        <IonLabel>Patch Size (X, Y, Z)</IonLabel>
                                        <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                value={sampleElement.patchSize[0]}
                                                placeholder="X"
                                                onIonChange={(e: CustomEvent) => setSampleElement({
                                                    ...sampleElement,
                                                    patchSize: [parseInt(e.detail.value!, 10), sampleElement.patchSize[1], sampleElement.patchSize[2]]
                                                })}
                                            />
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                value={sampleElement.patchSize[1]}
                                                placeholder="Y"
                                                onIonChange={(e: CustomEvent) => setSampleElement({
                                                    ...sampleElement,
                                                    patchSize: [sampleElement.patchSize[0], parseInt(e.detail.value!, 10), sampleElement.patchSize[2]]
                                                })}
                                            />
                                            <IonInput
                                                type="number"
                                                min={"0"}
                                                value={sampleElement.patchSize[2]}
                                                placeholder="Z"
                                                onIonChange={(e: CustomEvent) => setSampleElement({
                                                    ...sampleElement,
                                                    patchSize: [sampleElement.patchSize[0], sampleElement.patchSize[1], parseInt(e.detail.value!, 10)]
                                                })}
                                            />
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonItem>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                </IonAccordionGroup>
                <DeleteAllWindow
                    openWarningWindow={openDeleteAll}
                    onOpenWarningWindow={handleOpenDeleteAll}
                    typeOperation={typeOperation}
                    onTableList={resetTable}/>
            </IonContent>
        </small>
    );
}

export default SamplingComp;