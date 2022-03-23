import React from "react";
import {IonCard, IonCardContent, IonContent} from "@ionic/react";
import LabelTable from "./LabelTable";
import SlicesMenu from "./SlicesMenu";
import {ImageShapeInterface} from "./TypeScriptFiles/Interfaces/ImageShapeInterface";

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
        <React.Fragment>
            <IonContent>
                <IonCard>
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
                </IonCard>
            </IonContent>
        </React.Fragment>
    )

};

export default SideMenuAnnot;
