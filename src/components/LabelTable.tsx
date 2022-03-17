import React from "react";
import * as ReactBootStrap from "react-bootstrap";
import {IonTitle, IonRow, IonCol} from "@ionic/react";
import InputLabel from "./InputLabel";
import OptionsIcons from "./OptionsIcons";
import {ToolbarCompLabel, LabelProp} from "./TypeScriptFiles/Interfaces/LabelsInterface";

/**
 *
 * @param args a list the parameters that contains the components
 * @constructor
 */
const LabelTable: React.FC<ToolbarCompLabel> = (args) => {

    const RenderLabels = (labelElement: LabelProp, index: number) => {

        return(
            <tr key={index}>
                <td>{labelElement.labelName}</td>
                <td>{labelElement.color}</td>
                <td>{labelElement.id}</td>
                <td>
                    <OptionsIcons labelList={args.labelList} onRemoveLabel={args.onRemoveLabel} removeId={labelElement.id}/>
                </td>
            </tr>
        );

    };

    return(
        <React.Fragment>
            <IonTitle>Label card</IonTitle>
            <IonRow>
                <IonCol>
                    <InputLabel labelList={args.labelList} onLabelList={args.onLabelList} onRemoveLabel={args.onRemoveLabel} idGenerator={args.idGenerator} onIdGenerator={args.onIdGenerator} onRemoveAllLabels={args.onRemoveAllLabels}/>
                </IonCol>
            </IonRow>
            <ReactBootStrap.Table striped bordered hover>
                <thead>
                <tr>
                    <th>Label Name</th>
                    <th>Label Color</th>
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