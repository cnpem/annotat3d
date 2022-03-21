import React, {useState} from "react";
import * as ReactBootStrap from "react-bootstrap";
import {IonTitle, IonRow, IonCol} from "@ionic/react";
import InputLabel from "./InputLabel";
import OptionsIcons from "./OptionsIcons";
import {LabelProp, LabelTableInterface} from "./TypeScriptFiles/Interfaces/LabelsInterface";

/**
 * Component that creates the label table
 * @param args a list the parameters that contains the components
 * @todo i need to place a color for each label i create
 * @constructor
 * @return this components returns the label table
 */
const LabelTable: React.FC<LabelTableInterface> = (args) => {

    const [idGenerator, setIdGenerator] = useState<number>(0);

    const selectIdGenerator = (id: number) => {
        setIdGenerator(id + 1);
    }

    const RenderLabels = (labelElement: LabelProp, index: number) => {

        return(
            <tr key={index}>
                <td>{labelElement.labelName}</td>
                <td>{labelElement.id}</td>
                <td>
                    <OptionsIcons labelList={args.labelList} onRemoveLabel={args.onLabelList} onIdGenerator={selectIdGenerator} removeId={args.labelList[index].id}/>
                </td>
            </tr>
        );

    };

    return(
        <React.Fragment>
            <IonTitle>Label card</IonTitle>
            <IonRow>
                <IonCol>
                    <InputLabel labelList={args.labelList} onLabelList={args.onLabelList} idGenerator={idGenerator} onIdGenerator={selectIdGenerator}/>
                </IonCol>
            </IonRow>
            <ReactBootStrap.Table striped bordered hover>
                <thead>
                <tr>
                    <th>Label Name</th>
                    <th>Label id</th>
                    <th>Options</th>
                </tr>
                </thead>
                <tbody>
                {args.labelList.map(RenderLabels)}
                </tbody>
            </ReactBootStrap.Table>
        </React.Fragment>
    );

};

export default LabelTable;