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
import {InitTables, TableInterface} from "./DatasetInterfaces";
import "./LabelTable.css";

type type_operation = "Data" | "Label" | "Weight";

interface MultiplesPath {
    id: number,
    workspacePath: string,
    filePath: string,
}

interface AddNewFileInterface {
    idMenu: number,
    onTableVec: (newFile: MultiplesPath) => void,
    typeOperation: type_operation,
    trigger: string,
}

/**
 * React component that creates the add menu interface
 * @param idMenu {number} - id used to create a new element in the table
 * @param onTableVec {(newFile: MultiplesPath) => void} - setter used to create a new element
 * @param trigger {string} - string that contains the trigger to open the popup
 * @param typeOperation {type_operation} - string variable that contains the information if the menu is for Data, label or Weight
 * @constructor
 */
const AddNewFile: React.FC<AddNewFileInterface> = ({
                                                       idMenu,
                                                       onTableVec,
                                                       typeOperation,
                                                       trigger,
                                                   }) => {

    const [pathFiles, setPathFiles] = useState<MultiplesPath>({
        id: idMenu,
        workspacePath: "",
        filePath: ""
    });

    return (
        <IonPopover
            trigger={trigger}
            className={"add-menu"}
            onDidDismiss={() => {
                setPathFiles({
                    ...pathFiles,
                    filePath: "",
                });
            }}>
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
                                onIonChange={(e: CustomEvent) => setPathFiles({
                                    ...pathFiles,
                                    workspacePath: e.detail.value!
                                })}/>
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
                                onIonChange={(e: CustomEvent) => setPathFiles({
                                    ...pathFiles,
                                    filePath: e.detail.value!
                                })}/>
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
                    onTableVec(pathFiles);
                    setPathFiles({...pathFiles, id: pathFiles.id + 1});
                }}>Load {typeOperation}</IonButton>
        </IonPopover>
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
    const [labelTable, setLabelTable] = useStorageState<TableInterface[]>(sessionStorage, 'labelTable', InitTables);
    const [weightTable, setWeightTable] = useStorageState<TableInterface[]>(sessionStorage, 'WeightTable', InitTables);

    useEventBus('toggleMode', (darkMode: boolean) => {
        setDarkMode(darkMode);
    });

    //TODO : need to implement the back-end function to read the images here
    const handleDataTable = (newFile: MultiplesPath) => {
        console.log("new element for Data Table : ", newFile);
        if (newFile.id === 0) {
            setDataTable([{
                id: newFile.id,
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
    const handleLabelTable = (newFile: MultiplesPath) => {
        console.log("new element for Label Table : ", newFile);
        if (newFile.id === 0) {
            setLabelTable([{
                id: newFile.id,
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
    const handleWeightTable = (newFile: MultiplesPath) => {
        console.log("new element for Weight Table : ", newFile);
        if (newFile.id === 0) {
            setWeightTable([{
                id: newFile.id,
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

    //TODO : need to implement this functions to change this tables
    /*const removeLabelElement = (labelElement: DataAndWeiTable) => {
        setLabelList(labelList!.filter(l => l.id !== labelElement.id));

        if (labelList?.length === 2) {
            setNewLabelId(1);
        }

    }*/

    /*const changeLabelList = (newLabelName: string, labelId: number) => {

        const newList = labelList!
            .map(l => l.id === labelId
                ? {...l, file: newLabelName}
                : l);

        setLabelList(newList);
    }*/

    const selectLabel = (id: number) => {
        setSelectedLabel(id);
        dispatch('labelSelected', {
            id: id
        });
    }

    const renderLabel = (labelElement: TableInterface) => {
        const isActive = labelElement.id === selectedLabel;

        return (
            <tr className={isActive ? "label-table-active" : ""}
                onClick={() => selectLabel(labelElement.id)}>
                {/*Table Content*/}
                <td>
                    <div style={{display: "inline-flex", justifyContent: "flex-start"}}>
                        <IonButtons>
                            <IonButton id={"delete-label-button-" + labelElement.id} size="small"
                                       onClick={() => {
                                           console.table(labelElement)
                                       }}>
                                <IonIcon icon={closeOutline}/>
                            </IonButton>
                        </IonButtons>
                        {labelElement.element.file}
                    </div>
                </td>
                <td>
                    <div style={{display: "inline-flex", justifyContent: "flex-start"}}>
                        {`${labelElement.element.shape[0]} x 
                        ${labelElement.element.shape[1]} x 
                        ${labelElement.element.shape[2]}`}
                    </div>
                </td>
                <td>
                    <div style={{display: "inline-flex", justifyContent: "flex-start"}}>
                        {labelElement.element.type}
                    </div>
                </td>
                <td>
                    <div style={{display: "inline-flex", justifyContent: "flex-start"}}>
                        {labelElement.element.scan}
                    </div>
                </td>
                <td>
                    <div style={{display: "inline-flex", justifyContent: "flex-start"}}>
                        {labelElement.element.time}
                    </div>
                </td>
                <td>
                    <div style={{display: "inline-flex", justifyContent: "flex-start"}}>
                        {labelElement.element.size}
                    </div>
                </td>
                <td>
                    <div style={{display: "inline-flex", justifyContent: "flex-start"}}>
                        {labelElement.element.fullPath}
                    </div>
                </td>
            </tr>
        );

    };

    const NAME_WIDTH = "col-3";
    //TODO : Need to create a new component just to resize the table

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
                            <div className={"label-table"}>
                                <ReactBootStrap.Table striped bordered hover
                                                      className={darkMode ? 'table-dark' : ''}>
                                    <thead>
                                    <tr>
                                        <th className={NAME_WIDTH}><IonLabel>File Name</IonLabel></th>
                                        <th className={NAME_WIDTH}>Shape</th>
                                        <th className={NAME_WIDTH}>Type</th>
                                        <th className={NAME_WIDTH}>Scan</th>
                                        <th className={NAME_WIDTH}>Time</th>
                                        <th className={NAME_WIDTH}>Size</th>
                                        <th className={NAME_WIDTH}>Full Path</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {dataTable!.map(renderLabel)}
                                    </tbody>
                                </ReactBootStrap.Table>
                            </div>
                            <AddNewFile
                                idMenu={dataTable.length - 1}
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
                                        <th className={NAME_WIDTH}>Shape</th>
                                        <th className={NAME_WIDTH}>Type</th>
                                        <th className={NAME_WIDTH}>Scan</th>
                                        <th className={NAME_WIDTH}>Time</th>
                                        <th className={NAME_WIDTH}>Size</th>
                                        <th className={NAME_WIDTH}>Full Path</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {labelTable!.map(renderLabel)}
                                    </tbody>
                                </ReactBootStrap.Table>
                            </div>
                            <AddNewFile
                                idMenu={labelTable.length - 1}
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
                                        <th className={NAME_WIDTH}>Shape</th>
                                        <th className={NAME_WIDTH}>Type</th>
                                        <th className={NAME_WIDTH}>Scan</th>
                                        <th className={NAME_WIDTH}>Time</th>
                                        <th className={NAME_WIDTH}>Size</th>
                                        <th className={NAME_WIDTH}>Full Path</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {weightTable!.map(renderLabel)}
                                    </tbody>
                                </ReactBootStrap.Table>
                            </div>
                            <AddNewFile
                                idMenu={weightTable.length - 1}
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