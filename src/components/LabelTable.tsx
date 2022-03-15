import React from "react";
import * as ReactBootStrap from "react-bootstrap";
import {IonTitle, IonRow, IonCol, IonButton} from "@ionic/react";
import InputLabel from "./InputLabel";

interface LabelProp{
    color: string;
    labelName: string;
}

interface ToolbarComp{
    labelList: LabelProp[]; onLabelList: (labelElement: LabelProp) => void;
}

/**
 *
 * @param args
 * @constructor
 */
const LabelTable: React.FC<ToolbarComp> = (args) => {

    /*I'll write the code for add a label here*/
    const inputLabelList = () => {
        return;
    }

    const RenderLabels = (labelElement: LabelProp, index: number) => {

        return(
            <tr key={index}>
                <td>{labelElement.labelName}</td>
                <td>{labelElement.color}</td>
            </tr>
        );

    };

    return(
        <React.Fragment>
            <IonTitle>Label card</IonTitle>
            <IonRow>
                <IonCol>
                    <InputLabel labelList={args.labelList} onLabelList={args.onLabelList}/>
                </IonCol>
            </IonRow>
            <ReactBootStrap.Table striped bordered hover>
                <thead>
                <tr>
                    <th>Label Name</th>
                    <th>Label Color</th>
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