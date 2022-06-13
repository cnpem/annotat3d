import React, {useState} from "react";
import {
    IonAccordion,
    IonAccordionGroup, IonButton, IonCol,
    IonContent,
    IonIcon, IonInput,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList, IonRow
} from "@ionic/react";
import {addOutline, construct, trashOutline} from "ionicons/icons";
import {useStorageState} from "react-storage-hooks";
import {LabelInterface} from "../../../tools_menu/label_table/LabelInterface";
import {isEqual} from "lodash";
import {currentEventValue, dispatch, useEventBus} from "../../../../utils/eventbus";
import OptionsIcons from "../../../tools_menu/label_table/OptionsIcons";
import * as ReactBootStrap from "react-bootstrap";

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
    const [labelList, setLabelList] = useStorageState<LabelInterface[]>(sessionStorage, 'labelList', [{
        labelName: "Background",
        color: [246, 10, 246],
        id: 0
    }]);

    useEventBus('toggleMode', (darkMode: boolean) => {
        setDarkMode(darkMode);
    });

    const [selectedLabel, setSelectedLabel] = useStorageState<number>(sessionStorage, 'selectedLabel', 0);

    const [sampleElement, setSampleElement] = useStorageState<SamplingInterface>(sessionStorage, "sampleElement", {
        nClasses: 2,
        sampleSize: 100,
        patchSize: [256, 256, 1],
    });

    const removeLabelElement = (label: LabelInterface) => {
        setLabelList(labelList!.filter(l => l.id !== label.id));

        if (labelList.length === 2) {
            setNewLabelId(1);
        }

    }

    const selectIdGenerator = (id: number) => {
        setNewLabelId(id + 1);
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

    const selectLabel = (id: number) => {
        setSelectedLabel(id);
        dispatch('labelSelected', {
            id: id
        });
    }

    const renderLabel = (labelElement: LabelInterface) => {

        const isActive = labelElement.id === selectedLabel;

        return (
            <tr key={labelElement.id} className={isActive ? "label-table-active" : ""}
                onClick={() => selectLabel(labelElement.id)}>
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
                            <div style={{display: "flex", justifyContent: "flex-end"}}>
                                <IonButton size={"default"}>
                                    <IonIcon icon={addOutline} slot={"end"}/>
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
                            <IonItem>
                                <IonLabel>bla ?</IonLabel>
                            </IonItem>
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
                            <IonItem>
                                <IonLabel>bla ?</IonLabel>
                            </IonItem>
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