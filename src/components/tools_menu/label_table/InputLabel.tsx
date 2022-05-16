import React, {useState} from "react";
import {
    IonAlert,
    IonButton, IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonPopover,
    IonSelect,
    IonSelectOption,
    useIonToast
} from "@ionic/react";
import { LabelInterface } from "./LabelInterface";
import {colorFromId} from '../../../utils/colormap';

/*Icons import*/
import {addOutline, trashOutline} from "ionicons/icons";

import './OptionsIcons.css';
import {sfetch} from "../../../utils/simplerequest";
import {dispatch} from "../../../utils/eventbus";
import {useEventBus} from "../../../utils/eventbus";
import {useStorageState} from "react-storage-hooks";

interface InputLabelProps {
    colors: [number, number, number][];
    onLabelList: (labels: LabelInterface[]) => void;
    labelList: LabelInterface[];
    newLabelId: number;
    onNewLabelId: (id: number) => void;
}

interface WarningWindowInterface {
    openWarningWindow: boolean
    onOpenWarningWindow: (flag: boolean) => void;

    labelList: LabelInterface[];
    onLabelList: (labels: LabelInterface[]) => void;
    onNewLabelId: (id: number) => void;
}

const users = [
  {
    id: 1,
    first: 'Alice',
    last: 'Smith'
  },
  {
    id: 2,
    first: 'Bob',
    last: 'Davis'
  },
  {
    id: 3,
    first: 'Charlie',
    last: 'Rosenburg',
  }
];

type User = typeof users[number];

const compareWith = (o1: User, o2: User) => {
  return o1 && o2 ? o1.id === o2.id : o1 === o2;
};

const WarningWindow: React.FC<WarningWindowInterface> = ({openWarningWindow,
                                                             onOpenWarningWindow,
                                                             labelList,
                                                             onLabelList,
                                                             onNewLabelId}) => {

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
            }).catch((error) => {
                //TODO : need to implement an error component here
                console.log("error to delete all labels\n");
                console.log(error);
        }).finally(() => {
            closeWarningWindow();
        });
    }

    return(
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
 * This component creates the option for add any label in the label section
 * @param props a list that contains the toolbar components
 * @constructor
 * @return This function returns a window for the user add a label name and color a vector with this new label
 */
const InputLabel: React.FC<InputLabelProps> = (props: InputLabelProps) => {

    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [chosenLabel1, setChosenLabel1] = useState<string>("Background");
    const [chosenLabel2, setChosenLabel2] = useState<string>("Background");
    const [openWarningWindow, setOpenWarningWindow] = useState<boolean>(false);
    const [showMergeMenu, setShowMergeMenu] = useState<boolean>(false);
    const [activateMenu, setActivateMenu] = useStorageState<boolean>(sessionStorage, "ActivateComponents", true);
    const [ionToastActivateExtendOp, ] = useIonToast();
    const timeToast = 2000;

    useEventBus("ActivateComponents", (activateAddLabelButton) => {
        setActivateMenu(activateAddLabelButton);
    })

    const handleShowWarningWindow = (flag: boolean) => {
        setOpenWarningWindow(flag);
    }

    const addNewLabel = () => {
        const newColor = colorFromId(props.colors, props.newLabelId); 
        const newLabel = {
            labelName: "Label " + props.newLabelId,
            color: newColor,
            id: props.newLabelId
        };
        props.onLabelList([...props.labelList, newLabel]);
        props.onNewLabelId(props.newLabelId);
    }

    const extendLabel = () => {
        console.log("Doing dispatch for ExtendLabel");
        dispatch("ExtendLabel", true);
        ionToastActivateExtendOp(`Extend label operation activated !`, timeToast);
    }

    const mergeLabel = () => {
        console.log("Doing dispatch for mergeLabel");
        setShowMergeMenu(true);
        dispatch("mergeLabel", true);
        ionToastActivateExtendOp(`Merge label operation activated !`, timeToast);
    }

    return(
        <div style={ {display: "flex", justifyContent: "flex-end"} }>
            <IonButton size={"small"} onClick={extendLabel} disabled={activateMenu}>
                Extend
            </IonButton>

             <IonButton id={"merge-label"} size={"small"} onClick={mergeLabel} disabled={activateMenu}>
                 Merge
            </IonButton>

            <IonPopover
                trigger={"merge-label"}
                isOpen={showMergeMenu}
                onDidDismiss={() => setShowMergeMenu(false)}
                className={"ion-popover-merge"}>

                <IonContent>
                    <IonItem>
                        <IonLabel>{chosenLabel1}</IonLabel>
                         <IonSelect compareWith={compareWith} value={selectedUsers} onIonChange={e => setSelectedUsers(e.detail.value)}>
                             {users.map(user => (
                                <IonSelectOption key={user.id} value={user}>
                                  {user.first} {user.last}
                                </IonSelectOption>
                              ))}
                        </IonSelect>
                    </IonItem>
                    <IonItem>
                        <IonLabel>{chosenLabel2}</IonLabel>
                         <IonSelect value={chosenLabel2} onIonChange={e => setChosenLabel2(e.detail.value)}>
                              <IonSelectOption value="bird">Bird</IonSelectOption>
                              <IonSelectOption value="cat">Cat</IonSelectOption>
                              <IonSelectOption value="dog">Dog</IonSelectOption>
                              <IonSelectOption value="honeybadger">Honey Badger</IonSelectOption>
                        </IonSelect>
                    </IonItem>
                </IonContent>
            </IonPopover>
            <IonButton size="small" onClick={addNewLabel} disabled={activateMenu}>
                <IonIcon icon={addOutline} slot={"end"}/>
                Add
            </IonButton>

            <IonButton color="danger" size="small" slot={"end"}
                       disabled={props.labelList.length <= 1}
                       onClick={() => setOpenWarningWindow(true)}>
                <IonIcon icon={trashOutline} slot={"end"}/>
                Delete all
            </IonButton>
            {(openWarningWindow) ?
                <WarningWindow
                    openWarningWindow={openWarningWindow}
                    onOpenWarningWindow={handleShowWarningWindow}
                    labelList={props.labelList}
                    onLabelList={props.onLabelList}
                    onNewLabelId={props.onNewLabelId}/> :
                <></>
            }
        </div>
    );
};

export default InputLabel;
