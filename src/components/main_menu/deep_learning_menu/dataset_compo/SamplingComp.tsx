import React, {Fragment, useState} from "react";
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
import {addOutline, construct, image, trashOutline} from "ionicons/icons";
import {useStorageState} from "react-storage-hooks";
import {currentEventValue, dispatch, useEventBus} from "../../../../utils/eventbus";
import * as ReactBootStrap from "react-bootstrap";
import {DataAndWeiTable, InitDataAndWeiTable} from "./DatasetInterfaces";

interface AddNewFileInterface {
    showPopover: { open: boolean, event: Event | undefined },
    closePopover: (element: { open: boolean, event: Event | undefined }) => void,
}

interface multiplesPath {
    workspacePath: string,
    imagePath: string,
}

/**
 * React component that creates the add menu interface
 * @param showPopover
 * @param closePopover
 * @constructor
 */
const AddNewFile: React.FC<AddNewFileInterface> = ({showPopover, closePopover}) => {

    const [pathFiles, setPathFiles] = useStorageState<multiplesPath>(sessionStorage, "loaded", {
        workspacePath: "",
        imagePath: ""
    })

    return (
        <IonPopover
            isOpen={showPopover.open}
            event={showPopover.event}
            trigger={"add-op"}
            className={"add-menu"}
            onDidDismiss={() => closePopover({open: false, event: undefined})}>
            <IonAccordionGroup multiple={true}>
                {/*Load workspace menu*/}
                <IonAccordion>
                    <IonItem slot={"header"}>
                        <IonIcon slot={"start"} icon={construct}/>
                        <IonLabel><small>Load workspace</small></IonLabel>
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
                {/*Load image menu*/}
                <IonAccordion>
                    <IonItem slot={"header"}>
                        <IonIcon slot={"start"} icon={image}/>
                        <IonLabel><small>Load workspace</small></IonLabel>
                    </IonItem>
                    <IonList slot={"content"}>
                        <IonItem>
                            <IonLabel position="stacked">Image Path</IonLabel>
                            <IonInput
                                placeholder={"/path/to/file.tif, .tiff, .raw or .b"}
                                value={pathFiles.workspacePath}
                                onIonChange={(e: CustomEvent) => setPathFiles({
                                    ...pathFiles,
                                    imagePath: e.detail.value!
                                })}/>
                        </IonItem>
                    </IonList>
                </IonAccordion>
            </IonAccordionGroup>
            <IonButton
                onClick={(e) => closePopover({open: false, event: e.nativeEvent})}>Close</IonButton>
        </IonPopover>
    );
}

interface TableSamplingInterface {
    darkMode: boolean,
    labelList: DataAndWeiTable[],
    renderLabel: (labelElement: DataAndWeiTable) => void,
    NAME_WIDTH: string,

}

/**
 * TODO : need to make just one popover closes when i close one popover
 * Build-in Component that creates the table for Data, Label and Weight menu
 * @param {boolean} darkMode boolean variable that gets the forces the table to dark mode
 * @param {DataAndWeiTable[]} labelList - Object of DataAndWeiTable that contains the props of label table
 * @param {string} NAME_WIDTH - string that contains the width of each header in this table
 * @param {(labelElement: DataAndWeiTable) => void} renderLabel - function that renders the label content
 */
const TableSampling: React.FC<TableSamplingInterface> = ({darkMode, labelList, NAME_WIDTH, renderLabel}) => {

    // Init States
    const [showPopover, setShowPopover] = useState<{ open: boolean, event: Event | undefined }>({
        open: false,
        event: undefined,
    });

    const handleIsOpen = (element: { open: boolean, event: Event | undefined }) => {
        setShowPopover(element);
    }

    return (
        <Fragment>
            <div style={{display: "flex", justifyContent: "flex-end"}}>
                <IonButton
                    size={"default"}
                    onClick={(e) => setShowPopover({open: true, event: e.nativeEvent})}>
                    <IonIcon
                        icon={addOutline}
                        slot={"end"}
                        id={"add-op"}/>
                    Add
                </IonButton>
                <IonButton
                    color={"danger"}
                    size={"default"}
                    slot={"end"}>
                    <IonIcon icon={trashOutline} slot={"end"}/>
                    Delete
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
                showPopover={showPopover}
                closePopover={handleIsOpen}/>
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

        console.log("bla : ", labelElement);
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
                <IonAccordionGroup multiple={true}>
                    {/*Sampling menu option*/}
                    {/*Data menu option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonIcon slot={"start"} icon={construct}/>
                            <IonLabel><small>Data</small></IonLabel>
                        </IonItem>
                        <IonList slot={"content"}>
                            <TableSampling
                                labelList={labelList}
                                darkMode={darkMode}
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
                                labelList={labelList}
                                darkMode={darkMode}
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
                                labelList={labelList}
                                darkMode={darkMode}
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