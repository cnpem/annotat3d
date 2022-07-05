import React, {useState} from "react";
import {
    IonAccordion,
    IonAccordionGroup, IonAlert,
    IonButton, IonButtons,
    IonContent, IonIcon,
    IonItem, IonItemDivider,
    IonLabel,
    IonList,
    IonSelect, IonSelectOption
} from "@ionic/react";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import {useStorageState} from "react-storage-hooks";
import {addOutline, closeOutline, trashOutline} from "ionicons/icons";
import {InitTables, TableInterface, type_operation} from "../dataset_comp/DatasetInterfaces";
import {MultiplesPath} from "./BatchInferenceInterfaces";
import {currentEventValue, dispatch, useEventBus} from "../../../../utils/eventbus";
import {sfetch} from "../../../../utils/simplerequest";
import ErrorInterface from "../../file/ErrorInterface";
import * as ReactBootStrap from "react-bootstrap";
import "./Table.css";

interface Network {
    key: number,
    value: string,
    label: string
}

const typeNetworks: Network[] = [
    {
        key: 0,
        value: "u-net",
        label: "U-Net"
    },
    {
        key: 1,
        value: "v-net",
        label: "V-Net"
    },
    {
        key: 2,
        value: "bla-net",
        label: "Bla-Net"
    },
]

interface DeleteMenuInterface {
    labelElement: TableInterface,
    removeLabelElement: (labelElement: TableInterface) => void,
}

/**
 * TODO : need to implement the documentation here
 * @param labelElement
 * @param removeLabelElement
 * @constructor
 */
const InputFileComp: React.FC<DeleteMenuInterface> = ({labelElement, removeLabelElement}) => {
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

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
                    message={`Do you wish to delete the ${labelElement.typeOperation} with name "${labelElement.element.fileName}" ?`}
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
                                sfetch("POST", `/close_files_dataset/${labelElement.typeOperation.toLowerCase()}-${labelElement.id}`, "json").then(
                                    () => {
                                        removeLabelElement(labelElement);
                                        setShowAlert(false);
                                    }
                                ).catch((error: ErrorInterface) => {
                                    console.log("Error while deleting an element");
                                    console.log("error msg : ", error.error_msg);
                                    setErrorMsg(error.error_msg);
                                    setShowErrorWindow(true);
                                });
                            }
                        }
                    ]}/>
            </IonButtons>
            {labelElement.element.fileName}
            <ErrorWindowComp
                headerMsg={`Error trying to delete all files in ${labelElement.typeOperation} table`}
                errorMsg={errorMsg}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
        </IonItem>
    );
}

const InferenceComp: React.FC = () => {
    const [inputImagesTable, setInputImagesTable] = useStorageState<TableInterface[]>(sessionStorage, 'inputImagesTable', InitTables);
    const [idTable, setIdTable] = useStorageState<number>(sessionStorage, "idTable", 0);
    const [selectedLabel, setSelectedLabel] = useStorageState<number>(sessionStorage, 'selectedLabel', 0);

    const [darkMode, setDarkMode] = useState<boolean>(currentEventValue('toggleMode'));
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    useEventBus('toggleMode', (darkMode: boolean) => {
        setDarkMode(darkMode);
    });

    // TODO : need to implement the backEnd function later
    const handleNewFile = (newFile: MultiplesPath, typeOperation: type_operation) => {
        if (newFile.id === 0) {
            setInputImagesTable([{
                id: newFile.id,
                typeOperation: typeOperation,
                element: {
                    fileName: newFile.file.fileName,
                    shape: newFile.file.shape,
                    type: newFile.file.type,
                    scan: newFile.file.scan,
                    time: newFile.file.time,
                    size: newFile.file.size,
                    filePath: newFile.file.filePath
                }
            }]);
        } else {
            setInputImagesTable([...inputImagesTable, {
                id: newFile.id,
                typeOperation: typeOperation,
                element: {
                    fileName: newFile.file.fileName,
                    shape: newFile.file.shape,
                    type: newFile.file.type,
                    scan: newFile.file.type,
                    time: newFile.file.time,
                    size: newFile.file.size,
                    filePath: newFile.file.filePath
                }
            }]);
        }
        setIdTable(newFile.id + 1);
    }

    const removeLabelElement = (labelElement: TableInterface) => {
        const newVec = inputImagesTable!.filter(l => l.id !== labelElement.id);
        if (newVec.length === 0) {
            setIdTable(0);
        }
        setInputImagesTable(newVec);
    }

    const selectLabel = (id: number) => {
        setSelectedLabel(id);
        dispatch('selectedInputInference', {
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
                    <InputFileComp
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
                        {`${labelElement.element.time} s`}
                    </IonItem>
                </td>
                <td>
                    <IonItem className={"ion-item-table"}>
                        {`${labelElement.element.size} MB`}
                    </IonItem>
                </td>
                <td>
                    <IonItem className={"ion-item-table"}>
                        {labelElement.element.filePath}
                    </IonItem>
                </td>
            </tr>
        );

    };

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowErrorWindow(false);
        setErrorMsg("");
    };

    const NAME_WIDTH = "col-3";

    return (
        <small>
            <IonContent scrollEvents={true}>
                <IonAccordionGroup multiple={true}>
                    {/*Network option*/}
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Network</small></IonLabel>
                        </IonItem>
                        {/*Ion select option*/}
                        <IonList slot={"content"}>
                            <IonItem>
                                <IonLabel>Network type</IonLabel>
                                <IonSelect interface={"popover"}>
                                    {typeNetworks.map((type) => {
                                        return (
                                            <IonSelectOption
                                                key={type.key}
                                                value={type.value}>{type.label}</IonSelectOption>
                                        );
                                    })}
                                </IonSelect>
                            </IonItem>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                    <IonAccordion>
                        <IonItem slot={"header"}>
                            <IonLabel><small>Network</small></IonLabel>
                        </IonItem>
                        {/*Ion select option*/}
                        <IonList slot={"content"}>
                            {/*Data table*/}
                            <div className={"label-table table-responsive text-nowrap"}>
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
                                    {inputImagesTable!.map(renderLabel)}
                                    </tbody>
                                </ReactBootStrap.Table>
                            </div>
                            <IonItemDivider/>
                        </IonList>
                    </IonAccordion>
                </IonAccordionGroup>
            </IonContent>
        </small>
    );
}

export default InferenceComp;