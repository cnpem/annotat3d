import React, {useEffect, useState} from "react";
import * as ReactBootStrap from "react-bootstrap";
import {IonRow, IonCol, IonLabel, useIonToast, IonButton, IonIcon, IonAlert, IonCheckbox, IonItem} from "@ionic/react";
import InputLabel from "./InputLabel";
import OptionsIcons from "./OptionsIcons";
import {LabelInterface} from './LabelInterface';
import {colorFromId, defaultColormap} from '../../../../utils/colormap';
import {dispatch, useEventBus, currentEventValue} from '../../../../utils/eventbus';

import './LabelTable.css';
import {useStorageState} from "react-storage-hooks";
import {isEqual} from "lodash";
import {arrowUndoOutline, trashOutline} from "ionicons/icons";
import {sfetch} from "../../../../utils/simplerequest";

import ErrorInterface from "../../../main_menu/file/utils/ErrorInterface";

interface LabelTableProps {
    colors: [number, number, number][];
}

interface WarningWindowInterface {
    openWarningWindow: boolean
    onOpenWarningWindow: (flag: boolean) => void;

    labelList: LabelInterface[];
    onLabelList: (labels: LabelInterface[]) => void;
    onNewLabelId: (id: number) => void;
}

/**
 * Component that shows a warning window when the user delete a label
 * @param {boolean} openWarningWindow - Variable that opens the Warning window
 * @param {(flag: boolean) => void} onOpenWarningWindow - Setter for openWarningWindow
 * @param {LabelInterface[]} labelList - A vector of objects that contains each element contains the label name, label id and label color
 * @param {(labels: LabelInterface[]) => void} onLabelList - Setter for labelList
 * @param {(id: number) => void} onNewLabelId - Setter of new label id
 */
const WarningWindow: React.FC<WarningWindowInterface> = ({
                                                             openWarningWindow,
                                                             onOpenWarningWindow,
                                                             labelList,
                                                             onLabelList,
                                                             onNewLabelId
                                                         }) => {

    const closeWarningWindow = () => {
        onOpenWarningWindow(false);
    }

    const removeAllLabels = () => {
        const newVec = labelList.filter(lab => lab.id === 0);
        onLabelList(newVec);
        onNewLabelId(0); // This value resets the id generator

        sfetch("POST", "/close_annot", "").then(
            () => {
                dispatch('annotationChanged', null);
                dispatch('labelChanged', '');
            }).catch((error: ErrorInterface) => {
            //TODO : need to implement an error component here
            console.log("error to delete all labels\n");
            console.log(error);
        }).finally(() => {
            closeWarningWindow();
        });
        sfetch("POST", "/delete_info/anot_backup", "");
    }

    return (
        <IonAlert
            isOpen={openWarningWindow}
            onDidDismiss={closeWarningWindow}
            header={"Deleting all labels"}
            message={"Do you wish to delete all labels ?"}
            buttons={[
                {
                    text: "No",
                    id: "no-button",
                    handler: () => {
                        closeWarningWindow();
                    }
                },
                {
                    text: "Yes",
                    id: "yes-button",
                    handler: () => {
                        removeAllLabels();
                    }
                }
            ]}/>
    )
}


/**
 * Component that creates the label table
 * @param {LabelInterface} props - Object of LabelInterface that contains the props of label table
 * @interface {LabelInterface} - LabelInterface
 * @return this components returns the label table
 */
const LabelTable: React.FC<LabelTableProps> = (props: LabelTableProps) => {

    const [newLabelId, setNewLabelId] = useStorageState<number>(sessionStorage, 'newLabelId', 1);
    const [labelList, setLabelList] = useStorageState<LabelInterface[]>(sessionStorage, 'labelList', [{
        labelName: "Background",
        color: props.colors[0],
        id: 0
    }]);

    const [activateSL, setActivateSL] = useStorageState<boolean>(sessionStorage, "activateSL", false)

    const [selectedLabel, setSelectedLabel] = useStorageState<number>(sessionStorage, 'selectedLabel', 0);
    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);

    const [darkMode, setDarkMode] = useState<boolean>(currentEventValue('toggleMode'));
    const [ionToastLabelFounded,] = useIonToast();
    const toastTimer = 2000;

    const [openWarningWindow, setOpenWarningWindow] = useState<boolean>(false);

    const handleShowWarningWindow = (flag: boolean) => {
        setOpenWarningWindow(flag);
    }

    useEventBus('toggleMode', (darkMode: boolean) => {
        setDarkMode(darkMode);
    });

    useEventBus("changeSelectedLabel", (labelId: number) => {
        console.log("changeSelectedLabel");
        console.log("Value : ", labelId);
        if (labelId >= 0) {
            setSelectedLabel(labelId);
            ionToastLabelFounded(`Label named "${labelList[labelId].labelName}" founded !`, toastTimer);
        } else {
            ionToastLabelFounded(`Cannot find a label by click !`, toastTimer);
        }

    });

    useEventBus("LabelLoaded", (labelVec: LabelInterface[]) => {
        console.log("Label color : ", props.colors);
        for (let label of labelVec) {
            label.color = colorFromId(props.colors, label.id);
            console.log("label list into the change : ", labelVec);
        }
        setLabelList(labelVec);
        setNewLabelId(labelVec.length);
        console.log("label List rn : ", labelVec);
    })

    useEffect(() => {
        console.log("doing this dispatch rn");
        dispatch('labelColorsChanged', labelList);
    });

    useEventBus('LockComponents', (activateAddLabelButton: boolean) => {
        setLockMenu(activateAddLabelButton);
    });

    useEventBus('changeLockButton', (flag: boolean) => {
        setLockMenu(flag);
    });

    const removeLabelElement = (label: LabelInterface) => {
        setLabelList(labelList!.filter(l => l.id !== label.id));

        if (labelList.length === 2) {
            setNewLabelId(1);
        }

    }

    const changeLabelList = (newLabelName: string, labelId: number, color: [number, number, number]) => {

        const newList = labelList!
            .map(l => l.id === labelId
                ? {...l, labelName: newLabelName, color: color}
                : l);

        if (!isEqual(labelList!.filter(l => l.id === labelId)[0].color, color)) {
            dispatch('labelColorsChanged', [{id: labelId, color: color}]);
        }

        setLabelList(newList);
    }

    const selectLabelList = (labels: LabelInterface[]) => {
        setLabelList(labels);
    }

    const selectIdGenerator = (id: number) => {
        setNewLabelId(id + 1);
    }

    function selectLabel(id: number) {
        setSelectedLabel(id);
        dispatch('labelSelected', {
            id: id
        });
    }

    const undoAnnotation = () => {
        sfetch('POST', '/undo_annot', '')
            .then(() => {
                dispatch('annotationChanged', null);
            });
    }

    const renderLabel = (labelElement: LabelInterface) => {

        const isActive = labelElement.id === selectedLabel;

        return (
            <tr key={labelElement.id} className={isActive ? "label-table-active" : ""}
                onClick={() => {
                    if (!activateSL) {
                        selectLabel(labelElement.id)
                    }
                }}>
                <td>
                    <div style={{display: "flex"}}>
                        <div className="round-bar" style={{background: `rgb(${labelElement.color.join(',')})`}}></div>
                        <IonLabel>{labelElement.labelName}</IonLabel>
                    </div>
                </td>
                <td>
                    <OptionsIcons
                        label={labelElement}
                        onChangeLabelList={removeLabelElement}
                        onChangeLabel={changeLabelList}/>
                </td>
            </tr>
        );

    };

    const NAME_WIDTH = "col-3";
    const OPTIONS_WIDTH = "col-1";

    //if selected label is removed, defaults to background
    if (!labelList!.map((l) => l.id).includes(selectedLabel)) {
        selectLabel(0);
    }

    return (
        <div>
            <IonRow>
                <IonCol>
                    <InputLabel
                        colors={defaultColormap}
                        labelList={labelList}
                        onLabelList={selectLabelList}
                        newLabelId={newLabelId}
                        onNewLabelId={selectIdGenerator}
                        onSelectLabel={selectLabel}/>
                </IonCol>
            </IonRow>
            <div className={"label-table"}>
                <ReactBootStrap.Table striped bordered hover
                                      className={darkMode ? 'table-dark' : ''}>
                    <thead>
                    <tr>
                        <th className={NAME_WIDTH}><IonLabel>Label Name</IonLabel></th>
                        <th className={OPTIONS_WIDTH}>Options</th>
                    </tr>
                    </thead>
                    <tbody>
                    {labelList!.map(renderLabel)}
                    </tbody>
                </ReactBootStrap.Table>
            </div>
            {/*Sequential Label menu*/}
            <IonRow>
                <IonCol>
                    <IonItem>
                        <IonLabel>Sequential Label</IonLabel>
                        <IonCheckbox
                            checked={activateSL}
                            slot={"end"}
                            onIonChange={(e: CustomEvent) => {
                                if (e.detail.checked) {
                                    setSelectedLabel(newLabelId - 1);
                                }
                                dispatch("activateSL", {
                                    isActivated: e.detail.checked,
                                    id: newLabelId,
                                });
                                dispatch("changeLockButton", e.detail.checked);
                                setActivateSL(e.detail.checked);
                            }}/>
                    </IonItem>
                </IonCol>
            </IonRow>
            <IonRow>
                <IonCol>
                    <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                        {/*Undo Button*/}
                        <IonButton color="danger" size="small" disabled={lockMenu}
                                   onClick={() => {
                                       undoAnnotation();
                                   }}>
                            <IonIcon slot="end" icon={arrowUndoOutline}/>
                            Undo
                        </IonButton>
                        {/*Delete all button*/}
                        <IonButton color="danger" size="small" slot={"end"}
                                   disabled={labelList.length <= 1 || lockMenu}
                                   onClick={() => setOpenWarningWindow(true)}>
                            <IonIcon icon={trashOutline} slot={"end"}/>
                            Delete all
                        </IonButton>
                        {(openWarningWindow) ?
                            <WarningWindow
                                openWarningWindow={openWarningWindow}
                                onOpenWarningWindow={handleShowWarningWindow}
                                labelList={labelList}
                                onLabelList={selectLabelList}
                                onNewLabelId={selectIdGenerator}/> :
                            <></>
                        }
                    </div>
                    {/*==================*/}
                </IonCol>
            </IonRow>
        </div>
    );

};

export default LabelTable;
