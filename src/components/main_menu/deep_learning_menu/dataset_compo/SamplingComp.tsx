import React, {Fragment, useEffect, useState} from "react";
import {
    IonAccordion,
    IonAccordionGroup, IonButton, IonCol,
    IonContent,
    IonIcon, IonInput,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList, IonPopover, IonRow
} from "@ionic/react";
import {addOutline, construct, image} from "ionicons/icons";
import {useStorageState} from "react-storage-hooks";
import {currentEventValue, dispatch, useEventBus} from "../../../../utils/eventbus";
import * as ReactBootStrap from "react-bootstrap";
import {DataAndWeiTable, InitDataAndWeiTable} from "./DatasetInterfaces";

type type_operation = "Data" | "Label" | "Weight";

interface multiplesPath {
    id: number,
    workspacePath: string,
    filePath: string,
}

interface AddNewFileInterface {
    idMenu: number
    pathFilesVec: multiplesPath[],
    onPathFilesVec: (vecFiles: multiplesPath, index: number) => void,
    typeOperation: type_operation,
    trigger: string,
}

/**
 * React component that creates the add menu interface
 * @param trigger {string} - string that contains the trigger to open the popup
 * @param typeOperation {type_operation} - string variable that contains the information if the menu is for Data, label or Weight
 * @constructor
 */
const AddNewFile: React.FC<AddNewFileInterface> = ({
                                                       idMenu,
                                                       typeOperation,
                                                       trigger,
                                                       pathFilesVec,
                                                       onPathFilesVec
                                                   }) => {

    const [pathFiles, setPathFiles] = useState<multiplesPath>({
        id: idMenu,
        workspacePath: "",
        filePath: ""
    });

    const [loadFile, setLoadFile] = useState<boolean>(false);

    useEffect(() => {
        if(loadFile) {
            onPathFilesVec(pathFiles, idMenu);
            setLoadFile(false)
        }
    }, [loadFile, onPathFilesVec]);

    return (
        <IonPopover
            trigger={trigger}
            onDidDismiss={() => setPathFiles({
                id: idMenu,
                workspacePath: "",
                filePath: ""
            })}
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
                onClick={() => setLoadFile(true)}>Load {typeOperation}</IonButton>
        </IonPopover>
    );
}

interface TableSamplingInterface {
    idMenu: number
    darkMode: boolean,
    typeOperation: type_operation,
    trigger: string,
    labelList: DataAndWeiTable[],
    renderLabel: (labelElement: DataAndWeiTable) => void,
    NAME_WIDTH: string,

}

/**
 * Build-in Component that creates the table for Data, Label and Weight menu
 * @param idMenu {number} -
 * @param darkMode {boolean} - boolean variable that gets the forces the table to dark mode
 * @param typeOperation {type_operation} - string variable that contains the information if the menu is for Data, label or Weight
 * @param trigger {string} - string that contains the trigger to open the popup
 * @param labelList {DataAndWeiTable[]} - Object of DataAndWeiTable that contains the props of label table
 * @param NAME_WIDTH {string} - string that contains the width of each header in this table
 * @param renderLabel {(labelElement: DataAndWeiTable) => void} - function that renders the label content
 */
const TableSampling: React.FC<TableSamplingInterface> = ({
                                                             idMenu,
                                                             trigger,
                                                             darkMode,
                                                             typeOperation,
                                                             labelList,
                                                             NAME_WIDTH,
                                                             renderLabel
                                                         }) => {

    const [pathFilesVec, setPathFilesVec] = useStorageState<multiplesPath[]>(sessionStorage, "pathFilesVec", [
        {
            id: 0,
            workspacePath: "",
            filePath: ""
        },
        {
            id: 1,
            workspacePath: "",
            filePath: ""
        },
        {
            id: 2,
            workspacePath: "",
            filePath: ""
        }
    ]);

    const handlePathVec = (newPathFileElement: multiplesPath, index: number) => {
        console.log("bla : ", newPathFileElement);
        const newVec = pathFilesVec
            .map(l => l.id === index
                ? {...l, workspacePath: newPathFileElement.workspacePath, filePath: newPathFileElement.filePath}
                : l);

        console.log("newVec : ", newVec);
        setPathFilesVec(newVec);
    }

    return (
        <Fragment>
            <div style={{display: "flex", justifyContent: "flex-end"}}>
                <IonButton
                    id={trigger}
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
                    {labelList!.map(renderLabel)}
                    </tbody>
                </ReactBootStrap.Table>
            </div>
            <AddNewFile
                idMenu={idMenu}
                pathFilesVec={pathFilesVec}
                onPathFilesVec={handlePathVec}
                trigger={trigger}
                typeOperation={typeOperation}/>
        </Fragment>
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
    const [newLabelId, setNewLabelId] = useStorageState<number>(sessionStorage, 'newLabelId', 1);
    const [labelList, setLabelList] = useStorageState<DataAndWeiTable[]>(sessionStorage, 'newLabelListTable', InitDataAndWeiTable);

    useEventBus('toggleMode', (darkMode: boolean) => {
        setDarkMode(darkMode);
    });

    const [selectedLabel, setSelectedLabel] = useStorageState<number>(sessionStorage, 'selectedLabel', 0);

    const [sampleElement, setSampleElement] = useStorageState<SamplingInterface>(sessionStorage, "sampleElement", {
        nClasses: 2,
        sampleSize: 100,
        patchSize: [256, 256, 1],
    });

    const removeLabelElement = (labelElement: DataAndWeiTable) => {
        setLabelList(labelList!.filter(l => l.id !== labelElement.id));

        if (labelList?.length === 2) {
            setNewLabelId(1);
        }

    }

    const selectIdGenerator = (id: number) => {
        setNewLabelId(id + 1);
    }
    const changeLabelList = (newLabelName: string, labelId: number) => {

        const newList = labelList!
            .map(l => l.id === labelId
                ? {...l, file: newLabelName}
                : l);

        setLabelList(newList);
    }

    const selectLabel = (id: number) => {
        setSelectedLabel(id);
        dispatch('labelSelected', {
            id: id
        });
    }

    const renderLabel = (labelElement: DataAndWeiTable) => {
        const isActive = labelElement.id === selectedLabel;

        return (
            <tr key={labelElement.id} className={isActive ? "label-table-active" : ""}
                onClick={() => selectLabel(labelElement.id)}>
                {/*Table Content*/}
                <td>
                    {/*<OptionsIcons
                        label={labelElement}
                        onChangeLabelList={removeLabelElement}
                        onChangeLabel={changeLabelList}/>*/}
                </td>
                <td>
                    {/*<OptionsIcons
                        label={labelElement}
                        onChangeLabelList={removeLabelElement}
                        onChangeLabel={changeLabelList}/>*/}
                </td>
                <td>
                    {/*<OptionsIcons
                        label={labelElement}
                        onChangeLabelList={removeLabelElement}
                        onChangeLabel={changeLabelList}/>*/}
                </td>
                <td>
                    {/*<OptionsIcons
                        label={labelElement}
                        onChangeLabelList={removeLabelElement}
                        onChangeLabel={changeLabelList}/>*/}
                </td>
                <td>
                    {/*<OptionsIcons
                        label={labelElement}
                        onChangeLabelList={removeLabelElement}
                        onChangeLabel={changeLabelList}/>*/}
                </td>
                <td>
                    {/*<OptionsIcons
                        label={labelElement}
                        onChangeLabelList={removeLabelElement}
                        onChangeLabel={changeLabelList}/>*/}
                </td>
                <td>
                    {/*<OptionsIcons
                        label={labelElement}
                        onChangeLabelList={removeLabelElement}
                        onChangeLabel={changeLabelList}/>*/}
                </td>
            </tr>
        );

    };

    const NAME_WIDTH = "col-3";
    const OPTIONS_WIDTH = "col-1";
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
                            <TableSampling
                                idMenu={0}
                                trigger={"data-trigger"}
                                labelList={labelList}
                                darkMode={darkMode}
                                typeOperation={"Data"}
                                renderLabel={renderLabel}
                                NAME_WIDTH={NAME_WIDTH}></TableSampling>
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
                            <TableSampling
                                idMenu={1}
                                trigger={"label-trigger"}
                                labelList={labelList}
                                darkMode={darkMode}
                                typeOperation={"Label"}
                                renderLabel={renderLabel}
                                NAME_WIDTH={NAME_WIDTH}></TableSampling>
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
                            <TableSampling
                                idMenu={2}
                                trigger={"weight-trigger"}
                                labelList={labelList}
                                darkMode={darkMode}
                                typeOperation={"Weight"}
                                renderLabel={renderLabel}
                                NAME_WIDTH={NAME_WIDTH}></TableSampling>
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