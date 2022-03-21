import React, {useState} from "react";
import * as ReactBootStrap from "react-bootstrap";
import {IonTitle, IonRow, IonCol} from "@ionic/react";
import InputLabel from "./InputLabel";
import OptionsIcons from "./OptionsIcons";
import {LabelProp} from "./TypeScriptFiles/Interfaces/LabelsInterface";

/**
 * Component that creates the label table
 * @param args a list the parameters that contains the components
 * @todo i need to place a color for each label i create
 * @todo i need to implement a efficient method to get colors
 * @constructor
 * @return this components returns the label table
 */
const LabelTable: React.FC = (args) => {

    const [idGenerator, setIdGenerator] = useState<number>(0);
    const [labelList, setLabelList] = useState<LabelProp[]>([]);

    const selectLabelList = (labelVec: LabelProp[]) => {
        setLabelList(labelVec);
    }

    const selectIdGenerator = (id: number) => {
        setIdGenerator(id + 1);
    }

    const RenderLabels = (labelElement: LabelProp, index: number) => {

        return(
            <tr key={index}>
                <td>{labelElement.labelName}</td>
                <td style={{background: `rgb(${labelElement.color})` }}/>
                <td>{labelElement.id}</td>
                <td>
                    <OptionsIcons labelList={labelList} onRemoveLabel={selectLabelList} onIdGenerator={selectIdGenerator} removeId={labelList[index].id}/>
                </td>
            </tr>
        );

    };

    return(
        <React.Fragment>
            <IonTitle>Label card</IonTitle>
            <IonRow>
                <IonCol>
                    <InputLabel labelList={labelList} onLabelList={selectLabelList} idGenerator={idGenerator} onIdGenerator={selectIdGenerator}/>
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
                {labelList.map(RenderLabels)}
                </tbody>
            </ReactBootStrap.Table>
        </React.Fragment>
    );

};

export default LabelTable;