import React from "react";
import {IonCard, IonCardContent, IonContent} from "@ionic/react";
import LabelTable from "./label_table/LabelTable";
import SlicesMenu from "./SlicesMenu";
import {ImageShapeInterface} from "./ImageShapeInterface";

interface SideMenuAnnotatInterface{
    imageSlice: ImageShapeInterface;
    onImageSlice: (slice: ImageShapeInterface) => void;
}

/**
 * Component that creates the lateral bar menu
 * @todo i need to make this component more small
 * @constructor
 * @return this function return a list of all lateral components
 */
const SideMenuAnnot: React.FC<SideMenuAnnotatInterface> = (props) => {

    return(
        <div>
            <IonCard>
                <IonCardContent>
                    <SlicesMenu imageProps={props.imageSlice} onImageProps={props.onImageSlice}/>
                </IonCardContent>
            </IonCard>

            <IonCard>
                <IonCardContent>
                    <LabelTable/>
                </IonCardContent>
            </IonCard>

        </div>
    )

};

export default SideMenuAnnot;
