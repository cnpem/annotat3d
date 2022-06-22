import React, {useState} from "react";
import {
    IonAccordion,
    IonAccordionGroup, IonButton, IonButtons, IonCol,
    IonContent,
    IonIcon, IonInput,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList, IonPopover, IonRow
} from "@ionic/react";
import {addOutline, closeOutline, construct, image} from "ionicons/icons";
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
    onTableVec: (newFile: MultiplesPath, type: type_operation) => void,
    typeOperation: type_operation,
    trigger: string,
}

/**
 * React component that creates the add menu interface
 * @param idMenu {number} - id used to create a new element in the table
 * @param onTableVec {(newFile: MultiplesPath) => void} - setter used to create a new element
 * @param trigger {string} - string that contains the trigger to open the popup
 * @param typeOperation {type_operation} - string variable that contains the information if the menu is for Data, label or Weight
 */
const AddNewFile: React.FC<AddNewFileInterface> = ({
                                                       idMenu,
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
            className={"add-menu"}>
            <IonAccordionGroup multiple={true}>
                {/*Load workspace menu*/}
                <IonAccordion>
                    <IonItem slot={"header"}>
                        <IonIcon slot={"start"} icon={construct}/>
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
                    console.log("path");
                    console.table(pathFiles);
                    onTableVec(pathFiles, typeOperation);
                    pathFiles.id += 1;
                }}>Load {typeOperation}</IonButton>
        </IonPopover>
    );
}

interface DeleteMenuInterface {
    labelElement: TableInterface;
    removeLabelElement: (labelElement: TableInterface) => void;
}

/**
 * Component used in Filename in each bootstrap-table map. This table can be for Data, Label or Weight.
 * @param labelElement {TableInterface} - element of a bootstrap-table
 * @param removeLabelElement {(labelElement: TableInterface) => void} - function to delete an element of a bootstrap-table
 */
const FileNameComp: React.FC<DeleteMenuInterface> = ({labelElement, removeLabelElement}) => {

    return (
        <IonItem className={"ion-item-table"}
                 id={"file-name-comp"}>
            <IonButtons>
                <IonButton id={`delete-${labelElement.type}-button-${labelElement.id}`} size="small"
                           onClick={() => {
                               console.table(labelElement);
                           }}>
                    <IonIcon icon={closeOutline}/>
                </IonButton>
                {/*Delete popUp*/}
                <IonPopover
                    trigger={`delete-${labelElement.type}-button-${labelElement.id}`}
                    className={"delete-popover"}>
                    <IonContent>
                        <IonItem>
                            Do you wish to delete "{labelElement.element.file}" ?
                        </IonItem>
                    </IonContent>
                    <IonButton
                        size={"default"}
                        color={"tertiary"}
                        onClick={() => removeLabelElement(labelElement)}>Confirm</IonButton>
                </IonPopover>
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
    const [dataTable, setDataTable] = useStorageState<TableInterface[]>(sessionStorage, 'dataTable', InitTables);
    const [labelTable, setLabelTable] = useStorageState<TableInterface[]>(sessionStorage, 'labelTableDataset', InitTables);
    const [weightTable, setWeightTable] = useStorageState<TableInterface[]>(sessionStorage, 'WeightTable', InitTables);

    useEventBus('toggleMode', (darkMode: boolean) => {
        setDarkMode(darkMode);
    });

    //TODO : need to implement the back-end function to read the images here
    const handleDataTable = (newFile: MultiplesPath, type: type_operation) => {
        if (newFile.id === 0) {
            setDataTable([{
                id: newFile.id,
                type: type,
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
                type: type,
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
    }

    //TODO : need to implement the back-end function to read the images here
    const handleLabelTable = (newFile: MultiplesPath, type: type_operation) => {
        if (newFile.id === 0) {
            setLabelTable([{
                id: newFile.id,
                type: type,
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
                type: type,
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
    }

    //TODO : need to implement the back-end function to read the images here
    const handleWeightTable = (newFile: MultiplesPath, type: type_operation) => {
        if (newFile.id === 0) {
            setWeightTable([{
                id: newFile.id,
                type: type,
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
                type: type,
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
    }

    const [selectedLabel, setSelectedLabel] = useStorageState<number>(sessionStorage, 'selectedLabel', 0);
    const [sampleElement, setSampleElement] = useStorageState<SamplingInterface>(sessionStorage, "sampleElement", {
        nClasses: 2,
        sampleSize: 100,
        patchSize: [256, 256, 1],
    });

    const removeLabelElement = (labelElement: TableInterface) => {
        if (labelElement.type === "Data") {
            const newVec = dataTable!.filter(l => l.id !== labelElement.id);
            setDataTable(newVec);
        } else if (labelElement.type === "Label") {
            const newVec = labelTable!.filter(l => l.id !== labelElement.id);
            setLabelTable(newVec);
        } else if (labelElement.type === "Weight") {
            const newVec = weightTable!.filter(l => l.id !== labelElement.id);
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
                        {`${labelElement.element.shape[0]} x 
                        ${labelElement.element.shape[1]} x 
                        ${labelElement.element.shape[2]}`}
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

    const NAME_WIDTH = "col-100";
    //TODO : Need to create a new component just to resize the table
    //TODO : Need to create a way to make this table bigger.

    return (
        <small>
            <IonContent
                scrollEvents={true}
                onIonScrollStart={() => {
                }}
                onIonScroll={() => {
                }}
                onIonScrollEnd={() => {
                }}>
                {/*Sampling menu option*/}
                <IonAccordionGroup multiple={true}>
                    {/*Data menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
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
                            </div>
                            {/*Data table*/}
                            <div className={"label-table"}>
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
                                idMenu={dataTable.length}
                                onTableVec={handleDataTable}
                                trigger={"data-menu"}
                                typeOperation={"Data"}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Label menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
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
                            </div>
                            <div className={"label-table"}>
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
                                    {labelTable!.map(renderLabel)}
                                    </tbody>
                                </ReactBootStrap.Table>
                            </div>
                            <AddNewFile
                                idMenu={labelTable.length}
                                onTableVec={handleLabelTable}
                                trigger={"label-menu"}
                                typeOperation={"Label"}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Weight menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
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
                            </div>
                            <div className={"label-table"}>
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
                                idMenu={weightTable.length}
                                onTableVec={handleWeightTable}
                                trigger={"weight-menu"}
                                typeOperation={"Weight"}/>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    {/*Sampling menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
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
            </IonContent>
        </small>
    );
}

export default SamplingComp;