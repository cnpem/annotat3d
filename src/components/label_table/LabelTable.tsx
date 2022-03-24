import React, {useState} from "react";
import * as ReactBootStrap from "react-bootstrap";
import {IonTitle, IonRow, IonCol, IonLabel} from "@ionic/react";
import InputLabel from "./InputLabel";
import OptionsIcons from "./OptionsIcons";
import {LabelInterface} from './LabelInterface';

import './LabelTable.css';

/**
 * Component that creates the label table
 * @constructor
 * @return this components returns the label table
 */
const LabelTable: React.FC = () => {

    const BACKGROUND_COLOR: [number, number, number] = [229, 16, 249];// pink

    const [newLabelId, setNewLabelId] = useState<number>(1);
    const [labelList, setLabelList] = useState<LabelInterface[]>([{ labelName: "Background", color: BACKGROUND_COLOR, id: 0 }]);

    const selectLabelList = (labels: LabelInterface[]) => {
        setLabelList(labels);
    }

    const selectIdGenerator = (id: number) => {
        setNewLabelId(id + 1);
    }

    const renderLabel = (labelElement: LabelInterface, index: number) => {

        return(
            <tr key={index}>
                <td>
                    <div style={ {display: "flex"} }>
                        <div className="round-bar" style={{ background: `rgb(${labelElement.color.join(',')})` }}> </div>
                        <IonLabel>{labelElement.labelName}</IonLabel>
                    </div>
                </td>
                <td>
                    <OptionsIcons labelList={labelList} onRemoveLabel={setLabelList}
                        id={labelElement.id}/>
                </td>
            </tr>
        );

    };

    const NAME_WIDTH = "col-3";
    const OPTIONS_WIDTH = "col-1";

    return(
        <div>
            <IonRow>
                <IonCol>
                    <InputLabel labelList={labelList} onLabelList={selectLabelList}
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
