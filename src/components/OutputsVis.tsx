import {IonItem, IonTitle} from "@ionic/react";
import React from "react";
import {OutputVisInterface} from "./TypeScriptFiles/Interfaces/OutputVisInterface";

/**
 * This component does the output of the selected values from the user. Maybe this will be used only for debugging
 * @param args a list of parameters typed by the user
 * @constructor
 * @return Return the React component with the values typed by the user
 */
const OutputsVis: React.FC<OutputVisInterface> = (args) => {

    return(
        <React.Fragment>
            <IonTitle>Your selection</IonTitle>
            <IonItem>XY : {args.sliceXY}</IonItem>
            <IonItem>XZ : {args.sliceXZ}</IonItem>
            <IonItem>YZ : {args.sliceYZ}</IonItem>
            <IonItem>Clip Plane : {args.clipPlane}</IonItem>
            <IonItem>Slice Axis : {args.sliceAxis}</IonItem>
            <IonItem>Present Val : {args.presentVal}</IonItem>
        </React.Fragment>)

};

export default OutputsVis;