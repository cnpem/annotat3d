import React, {useEffect, useState} from "react";
import * as ReactBootStrap from "react-bootstrap";
import {IonRow, IonCol, IonLabel} from "@ionic/react";
import InputLabel from "./InputLabel";
import OptionsIcons from "./OptionsIcons";
import {LabelInterface} from './LabelInterface';
import {colorFromId, defaultColormap} from '../../../utils/colormap';
import {dispatch, useEventBus, currentEventValue} from '../../../utils/eventbus';

import './LabelTable.css';
import {useStorageState} from "react-storage-hooks";
import {isEqual} from "lodash";

interface LabelTableProps {
    colors: [number, number, number][];
}

/**
 * Component that creates the label table
 * @constructor
 * @return this components returns the label table
 */
const LabelTable: React.FC<LabelTableProps> = (props: LabelTableProps) => {

    const [newLabelId, setNewLabelId] = useStorageState<number>(sessionStorage, 'newLabelId', 1);
    const [labelList, setLabelList] = useStorageState<LabelInterface[]>(sessionStorage, 'labelList', [{ labelName: "Background", color: props.colors[0], id: 0 }]);

    const [selectedLabel, setSelectedLabel] = useStorageState<number>(sessionStorage, 'selectedLabel', 0);

    const [darkMode, setDarkMode] = useState<boolean>(currentEventValue('toggleMode'));

    useEventBus('toggleMode', (darkMode) => {
        setDarkMode(darkMode);
    });

    useEventBus("LabelLoadedFromFileLoadDialog", (labelVec: LabelInterface[]) => {
            console.log("Label color : ", props.colors);
            for(let label of labelVec){
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

    const removeLabelElement = (label: LabelInterface) => {
        setLabelList(labelList!.filter(l => l.id !== label.id));

        if(labelList.length === 2) {
            setNewLabelId(1);
        }

    }

    const changeLabelList = (newLabelName: string, labelId: number, color: [number, number, number]) => {

        const newList = labelList!
        .map(l => l.id === labelId
            ? {...l, labelName: newLabelName, color: color}
            : l);

        if (!isEqual(labelList!.filter(l=>l.id === labelId)[0].color, color)) {
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

    const renderLabel = (labelElement: LabelInterface) => {

        const isActive = labelElement.id === selectedLabel;

        return(
            <tr key={labelElement.id} className={ isActive? "label-table-active" : "" } onClick={ () => selectLabel(labelElement.id) }>
                <td>
                    <div style={ {display: "flex"} }>
                        <div className="round-bar" style={{ background: `rgb(${labelElement.color.join(',')})` }}> </div>
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

    return(
        <div>
            <IonRow>
                <IonCol>
                    <InputLabel colors={defaultColormap} labelList={labelList} onLabelList={selectLabelList}
                        newLabelId={newLabelId} onNewLabelId={selectIdGenerator}/>
                </IonCol>
            </IonRow>
            <div className={"label-table"}>
                <ReactBootStrap.Table striped bordered hover
                    className={darkMode? 'table-dark' : ''}>
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
        </div>
    );

};

export default LabelTable;
