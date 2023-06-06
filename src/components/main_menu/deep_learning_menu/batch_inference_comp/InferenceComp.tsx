import React, { Fragment, useState } from 'react';
import {
    IonAccordion,
    IonAccordionGroup,
    IonAlert,
    IonButton,
    IonButtons,
    IonCheckbox,
    IonCol,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList,
    IonPopover,
    IonRow,
    IonSelect,
    IonSelectOption,
} from '@ionic/react';
import ErrorWindowComp from '../../file/utils/ErrorWindowComp';
import { useStorageState } from 'react-storage-hooks';
import { addOutline, closeOutline, construct, image, trashOutline } from 'ionicons/icons';
import {
    DtypeType,
    dtypeList,
    InitFileStatus,
    InitTables,
    TableElement,
    TableInterface,
} from '../dataset_comp/DatasetInterfaces';
import {
    DtypePm,
    ExtensionFile,
    MultiplesPath,
    OutputInterface,
    SelectInterface,
    typeExt,
    typePM,
} from './BatchInferenceInterfaces';
import { currentEventValue, dispatch, useEventBus } from '../../../../utils/eventbus';
import { sfetch } from '../../../../utils/simplerequest';
import ErrorInterface from '../../file/utils/ErrorInterface';
import * as ReactBootStrap from 'react-bootstrap';
import './Table.css';
import DeepLoadingComp from '../Utils/DeepLoadingComp';

interface WarningWindowInterface {
    openWarningWindow: boolean;
    onOpenWarningWindow: (flag: boolean) => void;

    onTableList: () => void;
}

/**
 * Component used to create a warning window and delete all the table elements
 * @param openWarningWindow {boolean} - flag to open the warning window
 * @param onOpenWarningWindow {(flag: boolean) => void} - setter for openWarningWindow
 * @param onTableList {() => void} - setter for the table
 */
const DeleteAllWindow: React.FC<WarningWindowInterface> = ({ openWarningWindow, onOpenWarningWindow, onTableList }) => {
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    };

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    };

    return (
        <Fragment>
            <IonAlert
                isOpen={openWarningWindow}
                onDidDismiss={() => onOpenWarningWindow(false)}
                header={`Deleting all Images`}
                message={`Do you wish to delete all Images ?`}
                buttons={[
                    {
                        text: 'No',
                        id: 'no-button',
                        handler: () => {
                            onOpenWarningWindow(false);
                        },
                    },
                    {
                        text: 'Yes',
                        id: 'yes-button',
                        handler: () => {
                            setShowLoadingComp(true);
                            sfetch('POST', `/close_all_files_dataset`)
                                .then(() => {
                                    onTableList();
                                    onOpenWarningWindow(false);
                                })
                                .catch((error: ErrorInterface) => {
                                    console.log(`error in delete all Images`);
                                    console.log(error.error_msg);
                                    setErrorMsg(error.error_msg);
                                    setShowErrorWindow(true);
                                })
                                .finally(() => setShowLoadingComp(false));
                        },
                    },
                ]}
            />
            <ErrorWindowComp
                headerMsg={`Error trying to delete all files in Input images table`}
                errorMsg={errorMsg}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}
            />
            <DeepLoadingComp openLoadingWindow={showLoadingComp} loadingText={'Deleting all inference images'} />
        </Fragment>
    );
};

interface AddNewFileInterface {
    idMenu: number;
    onIdMenu: (newId: number) => void;
    onTableVec: (newFile: MultiplesPath) => void;
    trigger: string;
}

interface BackendPayload {
    image_path: string;
    image_dtype: DtypeType;
    image_raw_shape: Array<number>;
    use_image_raw_parse: boolean;
}

/**
 * Component that create a window to add a new file into the table
 * @param idMenu {number} - number that represents the id of this new element
 * @param onIdMenu {(newId: number) => void} - setter for idMenu
 * @param onTableVec {(newFile: MultiplesPath) => void} - setter for the table
 * @param trigger {string} - trigger to open the popover
 */
const AddNewFile: React.FC<AddNewFileInterface> = ({ idMenu, onIdMenu, onTableVec, trigger }) => {
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [workspacePath, setWorkspacePath] = useState<string>('');
    const [filePath, setFilePath] = useState<string>('');
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);

    const pathFiles: MultiplesPath = {
        id: idMenu,
        workspacePath: '',
        file: InitFileStatus,
    };

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    };

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    };

    const readFile = () => {
        setShowLoadingComp(true);
        pathFiles.workspacePath = workspacePath;
        pathFiles.file.filePath = filePath;
        const params: BackendPayload = {
            image_path: pathFiles.workspacePath + pathFiles.file.filePath,
            image_dtype: pathFiles.file.type,
            image_raw_shape: [pathFiles.file.shape[0] || 0, pathFiles.file.shape[1] || 0, pathFiles.file.shape[2] || 0],
            use_image_raw_parse:
                pathFiles.file.shape[0] == null && pathFiles.file.shape[1] == null && pathFiles.file.shape[2] == null,
        };

        sfetch('POST', `/open_inference_files/image-${pathFiles.id}`, JSON.stringify(params), 'json')
            .then((element: TableElement) => {
                console.log('Backend response');
                console.table(element);
                pathFiles.file = element;
                onTableVec(pathFiles);
                pathFiles.id += 1;
                setFilePath('');
            })
            .catch((error: ErrorInterface) => {
                console.log('error while trying to add an image');
                console.log(error.error_msg);
                setErrorMsg(error.error_msg);
                setShowErrorWindow(true);
            })
            .finally(() => setShowLoadingComp(false));
    };

    return (
        <IonPopover
            trigger={trigger}
            className={'add-menu'}
            onDidDismiss={() => {
                onIdMenu(pathFiles.id);
            }}
        >
            <IonAccordionGroup multiple={true}>
                {/*Load workspace menu*/}
                <IonAccordion>
                    <IonItem slot={'header'}>
                        <IonIcon slot={'start'} icon={construct} />
                        <IonLabel>
                            <small>Load Workspace</small>
                        </IonLabel>
                    </IonItem>
                    <IonList slot={'content'}>
                        <IonItem>
                            <IonLabel position="stacked">Workspace Path</IonLabel>
                            <IonInput
                                placeholder={'/path/to/workspace'}
                                value={workspacePath}
                                onIonChange={(e: CustomEvent) => {
                                    setWorkspacePath(e.detail.value);
                                }}
                            />
                        </IonItem>
                        <IonItemDivider />
                    </IonList>
                </IonAccordion>
                {/*Load type menu*/}
                <IonAccordion>
                    <IonItem slot={'header'}>
                        <IonIcon slot={'start'} icon={image} />
                        <IonLabel>
                            <small>Load Image</small>
                        </IonLabel>
                    </IonItem>
                    <IonList slot={'content'}>
                        <IonItem>
                            <IonLabel position="stacked">Image Path</IonLabel>
                            <IonInput
                                placeholder={`/path/to/Image.tif, .tiff, .raw or .b`}
                                value={filePath}
                                onIonChange={(e: CustomEvent) => {
                                    setFilePath(e.detail.value);
                                }}
                            />
                        </IonItem>
                        {/* Image Size Grid*/}
                        <IonItem>
                            <IonRow>
                                <IonCol>
                                    <IonLabel position="stacked">Image Size</IonLabel>
                                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                        <IonInput
                                            className={'ion-input'}
                                            type="number"
                                            min={'0'}
                                            value={pathFiles.file.shape[0]}
                                            placeholder="X"
                                            onIonChange={(e: CustomEvent) => {
                                                pathFiles.file.shape[0] = parseInt(e.detail.value!, 10);
                                            }}
                                        />
                                        <IonInput
                                            className={'ion-input'}
                                            type="number"
                                            min={'0'}
                                            value={pathFiles.file.shape[1]}
                                            placeholder="Y"
                                            onIonChange={(e: CustomEvent) => {
                                                pathFiles.file.shape[1] = parseInt(e.detail.value!, 10);
                                            }}
                                        />
                                        <IonInput
                                            className={'ion-input'}
                                            type="number"
                                            min={'0'}
                                            value={pathFiles.file.shape[2]}
                                            placeholder="Z"
                                            onIonChange={(e: CustomEvent) => {
                                                pathFiles.file.shape[3] = parseInt(e.detail.value!, 10);
                                            }}
                                        />
                                    </div>
                                </IonCol>
                                <IonCol>
                                    {/* Select dtype */}
                                    <IonLabel position="stacked">Image Type</IonLabel>
                                    <IonSelect
                                        style={{ maxWidth: '100%' }}
                                        interface={'popover'}
                                        value={pathFiles.file.type}
                                        placeholder={'Select One'}
                                        onIonChange={(e: CustomEvent) => {
                                            pathFiles.file.type = e.detail.value;
                                        }}
                                    >
                                        {dtypeList.map((type) => {
                                            return (
                                                <IonSelectOption key={type.value} value={type.value}>
                                                    {type.label}
                                                </IonSelectOption>
                                            );
                                        })}
                                    </IonSelect>
                                </IonCol>
                            </IonRow>
                        </IonItem>
                        <IonItemDivider />
                    </IonList>
                </IonAccordion>
            </IonAccordionGroup>
            <IonButton
                size={'default'}
                color={'tertiary'}
                onClick={() => {
                    readFile();
                }}
            >
                Load Image
            </IonButton>
            <ErrorWindowComp
                headerMsg={`Error trying to add an element in Image table`}
                errorMsg={errorMsg}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}
            />
            <DeepLoadingComp openLoadingWindow={showLoadingComp} loadingText={`Reading ${filePath}`} />
        </IonPopover>
    );
};

interface DeleteMenuInterface {
    labelElement: TableInterface;
    removeLabelElement: (labelElement: TableInterface) => void;
}

/**
 * Component used to delete a file from the table
 * @param labelElement {TableInterface} - file from the table
 * @param removeLabelElement {(labelElement: TableInterface) => void} - function to remove the element of this table
 */
const InputFileComp: React.FC<DeleteMenuInterface> = ({ labelElement, removeLabelElement }) => {
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    };

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    };

    return (
        <IonItem className={'ion-item-table'} id={'file-name-comp'}>
            <IonButtons>
                <IonButton
                    id={`delete-${labelElement.typeOperation}-button-${labelElement.id}`}
                    size="small"
                    onClick={() => {
                        console.log('label to delete : ', labelElement);
                        console.table(labelElement);
                        setShowAlert(true);
                    }}
                >
                    <IonIcon icon={closeOutline} />
                </IonButton>
                {/*Delete popUp*/}
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={() => setShowAlert(false)}
                    message={`Do you wish to delete the Image with name "${labelElement.element.fileName}" ?`}
                    buttons={[
                        {
                            text: 'No',
                            id: 'no-button',
                            handler: () => {
                                setShowAlert(false);
                            },
                        },
                        {
                            text: 'Yes',
                            id: 'yes-button',
                            handler: () => {
                                setShowLoadingComp(true);
                                sfetch('POST', `/close_inference_file/image-${labelElement.id}`, 'json')
                                    .then(() => {
                                        removeLabelElement(labelElement);
                                        setShowAlert(false);
                                    })
                                    .catch((error: ErrorInterface) => {
                                        console.log('Error while deleting an element');
                                        console.log('error msg : ', error.error_msg);
                                        setErrorMsg(error.error_msg);
                                        setShowErrorWindow(true);
                                    })
                                    .finally(() => setShowLoadingComp(false));
                            },
                        },
                    ]}
                />
            </IonButtons>
            {labelElement.element.fileName}
            <ErrorWindowComp
                headerMsg={`Error trying to delete ${labelElement.element.fileName} in Input image table`}
                errorMsg={errorMsg}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}
            />
            <DeepLoadingComp
                openLoadingWindow={showLoadingComp}
                loadingText={`Deleting ${labelElement.element.fileName}`}
            />
        </IonItem>
    );
};

interface InferenceInterface {
    output: OutputInterface;
    onOutput: (newOutput: OutputInterface) => void;

    network: string;
    onNetwork: (net: string) => void;

    networkOptions: SelectInterface[];
}

/**
 * Element that create the Inference component
 * @param output {OutputInterface} - output object
 * @param onOutput {(newOutput: OutputInterface) => void} - setter for output
 * @param network {string} - variable that represents the network chosen by the user
 * @param onNetwork {net: type_network) => void} - setter for network
 * @param networkOptions {SelectInterface[]} - vector of SelectInterface[] that contains all the .h5 file names on frozen menu in the created workspace directory
 */
const InferenceComp: React.FC<InferenceInterface> = ({ output, onOutput, network, onNetwork, networkOptions }) => {
    const [inputImagesTable, setInputImagesTable] = useStorageState<TableInterface[]>(
        sessionStorage,
        'inputImagesTable',
        InitTables
    );
    const [idTable, setIdTable] = useStorageState<number>(sessionStorage, 'idTable', 0);
    const [selectedLabel, setSelectedLabel] = useStorageState<number>(sessionStorage, 'selectedLabel', 0);

    const [darkMode, setDarkMode] = useState<boolean>(currentEventValue('toggleMode'));
    const [openDeleteAll, setOpenDeleteAll] = useState<boolean>(false);

    useEventBus('toggleMode', (isDarkMode: boolean) => {
        setDarkMode(isDarkMode);
    });

    const handleIdTable = (newId: number) => {
        setIdTable(newId);
    };

    const handleOpenDeleteAll = (flag: boolean) => {
        setOpenDeleteAll(flag);
    };

    const handleNewFile = (newFile: MultiplesPath) => {
        setInputImagesTable([
            ...inputImagesTable,
            {
                id: newFile.id,
                typeOperation: 'Data',
                element: {
                    fileName: newFile.file.fileName,
                    shape: newFile.file.shape,
                    type: newFile.file.type,
                    scan: newFile.file.type,
                    time: newFile.file.time,
                    size: newFile.file.size,
                    filePath: newFile.file.filePath,
                },
            },
        ]);
        setIdTable(newFile.id + 1);
    };

    const removeLabelElement = (labelElement: TableInterface) => {
        const newVec = inputImagesTable.filter((l) => l.id !== labelElement.id);
        if (newVec.length === 0) {
            setIdTable(0);
        }
        setInputImagesTable(newVec);
    };

    const resetTable = () => {
        setInputImagesTable([]);
        setIdTable(0);
    };

    const selectLabel = (id: number) => {
        setSelectedLabel(id);
        dispatch('selectedInputInference', {
            id,
        });
    };

    const renderLabel = (labelElement: TableInterface) => {
        const isActive = labelElement.id === selectedLabel;
        return (
            <tr
                key={labelElement.id}
                className={isActive ? 'label-table-active' : ''}
                onClick={() => selectLabel(labelElement.id)}
            >
                {/*Table Content*/}
                <td>
                    <InputFileComp labelElement={labelElement} removeLabelElement={removeLabelElement} />
                </td>
                <td>
                    <IonItem className={'ion-item-table'}>
                        {`${labelElement.element.shape[0]} x ${labelElement.element.shape[1]} x ${labelElement.element.shape[2]}`}
                    </IonItem>
                </td>
                <td>
                    <IonItem className={'ion-item-table'}>{labelElement.element.type}</IonItem>
                </td>
                <td>
                    <IonItem className={'ion-item-table'}>{labelElement.element.scan}</IonItem>
                </td>
                <td>
                    <IonItem className={'ion-item-table'}>{`${labelElement.element.time} s`}</IonItem>
                </td>
                <td>
                    <IonItem className={'ion-item-table'}>{`${labelElement.element.size} MB`}</IonItem>
                </td>
                <td>
                    <IonItem className={'ion-item-table'}>{labelElement.element.filePath}</IonItem>
                </td>
            </tr>
        );
    };

    const NAME_WIDTH = 'col-3';

    return (
        <small>
            <IonContent scrollEvents={true}>
                <IonAccordionGroup multiple={true}>
                    {/*Network menu*/}
                    <IonAccordion>
                        <IonItem slot={'header'}>
                            <IonLabel>
                                <small>Network</small>
                            </IonLabel>
                        </IonItem>
                        {/*Ion select option*/}
                        <IonList slot={'content'}>
                            <IonItem>
                                <IonLabel>Network type</IonLabel>
                                <IonSelect
                                    interface={'popover'}
                                    value={network}
                                    onIonChange={(e: CustomEvent) => onNetwork(e.detail.value as string)}
                                >
                                    {networkOptions.map((type) => {
                                        return (
                                            <IonSelectOption key={type.key} value={type.value}>
                                                {type.label}
                                            </IonSelectOption>
                                        );
                                    })}
                                </IonSelect>
                            </IonItem>
                            <IonItemDivider />
                        </IonList>
                    </IonAccordion>
                    {/*Input Images menu*/}
                    <IonAccordion>
                        <IonItem slot={'header'}>
                            <IonLabel>
                                <small>Input Images</small>
                            </IonLabel>
                        </IonItem>
                        {/*Input images table*/}
                        <IonList slot={'content'}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <IonButton id={'add-file'} size={'default'}>
                                    <IonIcon icon={addOutline} slot={'end'} />
                                    Add
                                </IonButton>
                                <IonButton
                                    color={'danger'}
                                    size={'default'}
                                    slot={'end'}
                                    disabled={inputImagesTable.length <= 0}
                                    onClick={() => {
                                        setOpenDeleteAll(true);
                                    }}
                                >
                                    <IonIcon icon={trashOutline} slot={'end'} />
                                    Delete all
                                </IonButton>
                            </div>
                            {/*Images table*/}
                            <div className={'label-table table-responsive text-nowrap'}>
                                <ReactBootStrap.Table
                                    striped
                                    bordered
                                    hover
                                    className={darkMode ? 'table-dark table-sm' : ''}
                                >
                                    <thead>
                                        <tr>
                                            <th className={NAME_WIDTH}>
                                                <IonLabel>File Name</IonLabel>
                                            </th>
                                            <th className={NAME_WIDTH}>
                                                <IonLabel>Shape</IonLabel>
                                            </th>
                                            <th className={NAME_WIDTH}>
                                                <IonLabel>Type</IonLabel>
                                            </th>
                                            <th className={NAME_WIDTH}>
                                                <IonLabel>Scan</IonLabel>
                                            </th>
                                            <th className={NAME_WIDTH}>
                                                <IonLabel>Time</IonLabel>
                                            </th>
                                            <th className={NAME_WIDTH}>
                                                <IonLabel>Size</IonLabel>
                                            </th>
                                            <th className={NAME_WIDTH}>
                                                <IonLabel>Full Path</IonLabel>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>{inputImagesTable.map(renderLabel)}</tbody>
                                </ReactBootStrap.Table>
                            </div>
                            <AddNewFile
                                idMenu={idTable}
                                onIdMenu={handleIdTable}
                                onTableVec={handleNewFile}
                                trigger={'add-file'}
                            />
                            <IonItemDivider />
                        </IonList>
                    </IonAccordion>
                    {/*Output menu*/}
                    <IonAccordion>
                        <IonItem slot={'header'}>
                            <IonLabel>
                                <small>Output</small>
                            </IonLabel>
                        </IonItem>
                        {/*Ion select option*/}
                        <IonList slot={'content'}>
                            {/*Output Path*/}
                            <IonItem>
                                <IonIcon slot={'start'} icon={construct}></IonIcon>
                                <IonLabel position={'floating'}>
                                    <small>Output Path</small>
                                </IonLabel>
                                <IonInput
                                    value={output.outputPath}
                                    onIonChange={(e: CustomEvent) =>
                                        onOutput({
                                            ...output,
                                            outputPath: e.detail.value as string,
                                        })
                                    }
                                />
                            </IonItem>
                            {/*Probability Map menu*/}
                            <IonItem>
                                <IonLabel>Probability Map</IonLabel>
                                <IonCheckbox
                                    checked={output.probabilityMap}
                                    onIonChange={() =>
                                        onOutput({
                                            ...output,
                                            probabilityMap: !output.probabilityMap,
                                        })
                                    }
                                />
                            </IonItem>
                            {/*Label menu*/}
                            <IonItem>
                                <IonLabel>Label</IonLabel>
                                <IonCheckbox
                                    checked={output.label}
                                    onIonChange={() =>
                                        onOutput({
                                            ...output,
                                            label: !output.label,
                                        })
                                    }
                                />
                            </IonItem>
                            {/*Output bits*/}
                            <IonItem>
                                <IonLabel>Output Bits</IonLabel>
                                <IonSelect
                                    interface={'popover'}
                                    value={output.outputBits}
                                    onIonChange={(e: CustomEvent) =>
                                        onOutput({
                                            ...output,
                                            outputBits: e.detail.value as DtypePm,
                                        })
                                    }
                                >
                                    {typePM.map((type) => {
                                        return (
                                            <IonSelectOption key={type.key} value={type.value}>
                                                {type.label}
                                            </IonSelectOption>
                                        );
                                    })}
                                </IonSelect>
                            </IonItem>
                            {/*Output extension*/}
                            <IonItem>
                                <IonLabel>Output Extension</IonLabel>
                                <IonSelect
                                    interface={'popover'}
                                    value={output.outputExt}
                                    onIonChange={(e: CustomEvent) =>
                                        onOutput({
                                            ...output,
                                            outputExt: e.detail.value as ExtensionFile,
                                        })
                                    }
                                >
                                    {typeExt.map((type) => {
                                        return (
                                            <IonSelectOption key={type.key} value={type.value}>
                                                {type.label}
                                            </IonSelectOption>
                                        );
                                    })}
                                </IonSelect>
                            </IonItem>
                            <IonItemDivider />
                        </IonList>
                    </IonAccordion>
                </IonAccordionGroup>
                <DeleteAllWindow
                    openWarningWindow={openDeleteAll}
                    onOpenWarningWindow={handleOpenDeleteAll}
                    onTableList={resetTable}
                />
            </IonContent>
        </small>
    );
};

export default InferenceComp;
