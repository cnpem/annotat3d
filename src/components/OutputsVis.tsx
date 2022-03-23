import {IonItem, IonTitle} from "@ionic/react";
import React from "react";
import {OutputVisInterface} from "./TypeScriptFiles/Interfaces/OutputVisInterface";

/**
 * This component does the output of the selected values from the user. Maybe this will be used only for debugging
 * @param props a list of parameters typed by the user
 * @constructor
 * @return Return the React component with the values typed by the user
 */
const OutputsVis: React.FC<OutputVisInterface> = (props) => {

    return(
        <React.Fragment>
            <IonTitle>Your selection</IonTitle>
            <IonItem>XY : {props.sliceXY}</IonItem>
            <IonItem>XZ : {props.sliceXZ}</IonItem>
            <IonItem>YZ : {props.sliceYZ}</IonItem>
            <IonItem>Clip Plane : {props.clipPlane}</IonItem>
            <IonItem>Slice Axis : {props.sliceAxis}</IonItem>
            <IonItem>Present Val : {props.presentVal}</IonItem>
        </React.Fragment>)

};

export default OutputsVis;
