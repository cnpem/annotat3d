import React, {useState} from "react";
import * as ReactBootStrap from "react-bootstrap";
import {IonTitle, IonRow, IonCol} from "@ionic/react";
import InputLabel from "./InputLabel";
import OptionsIcons from "./OptionsIcons";
import {LabelInterface} from './TypeScriptFiles/Interfaces/LabelsInterface';


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
                <td>{labelElement.labelName}</td>
                <td style={{background: `rgb(${labelElement.color.join(',')})`}}/>
                <td>{labelElement.id}</td>
                <td>
                    <OptionsIcons labelList={labelList} onRemoveLabel={selectLabelList}
                        onNewLabelId={selectIdGenerator} removeId={labelElement.id}/>
                </td>
            </tr>
        );

    };

    return(
        <React.Fragment>
            <IonTitle>Label card</IonTitle>
            <IonRow>
                <IonCol>
                    <InputLabel labelList={labelList} onLabelList={selectLabelList}
                        newLabelId={newLabelId} onNewLabelId={selectIdGenerator}/>
                </IonCol>
            </IonRow>
            <ReactBootStrap.Table striped bordered hover>
                <thead>
                <tr>
                    <th>Label Name</th>
                    <th>Color</th>
                    <th>Label id</th>
                    <th>Options</th>
                </tr>
                </thead>
                <tbody>
                {labelList.map(renderLabel)}
                </tbody>
            </ReactBootStrap.Table>
        </React.Fragment>
    );

};

export default LabelTable;
