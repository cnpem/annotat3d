import React, {useState} from "react";
import * as ReactBootStrap from "react-bootstrap";
import {IonRow, IonCol, IonLabel} from "@ionic/react";
import InputLabel from "./InputLabel";
import OptionsIcons from "./OptionsIcons";
import {LabelInterface} from './LabelInterface';
import {defaultColormap} from '../../../utils/colormap';
import {dispatch} from '../../../utils/eventbus';

import './LabelTable.css';

interface LabelTableProps {
    colors: [number, number, number][];
}

/**
 * Component that creates the label table
 * @constructor
 * @return this components returns the label table
 */
const LabelTable: React.FC<LabelTableProps> = (props: LabelTableProps) => {

    const [newLabelId, setNewLabelId] = useState<number>(1);
    const [labelList, setLabelList] = useState<LabelInterface[]>([{ labelName: "Background", color: props.colors[0], id: 0 }]);

    const [selectedLabel, setSelectedLabel] = useState<number>(0);

    const removeLabelElement = (label: LabelInterface) => {
        setLabelList(labelList.filter(l => l.id !== label.id));

        if(labelList.length === 2)
        {

            setNewLabelId(1);

        }

    }

    const changeLabelName = (newLabelName: string, labelId: number) => {
        setLabelList(
            labelList.map(l =>
                l.id == labelId
                    ? {...l, labelName: newLabelName}
                    : {...l}
            )
        )
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
                        onChangeLabelName={changeLabelName}/>
                </td>
            </tr>
        );

    };

    const NAME_WIDTH = "col-3";
    const OPTIONS_WIDTH = "col-1";

    //if selected label is removed, defaults to background
    if (!labelList.map((l) => l.id).includes(selectedLabel)) {
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
                <ReactBootStrap.Table striped bordered hover>
                    <thead>
                        <tr>
                            <th className={NAME_WIDTH}><IonLabel>Label Name</IonLabel></th>
                            <th className={OPTIONS_WIDTH}>Options</th>
                        </tr>
                    </thead>
                    <tbody>
                        {labelList.map(renderLabel)}
                    </tbody>
                </ReactBootStrap.Table>
            </div>
        </div>
    );

};

export default LabelTable;
