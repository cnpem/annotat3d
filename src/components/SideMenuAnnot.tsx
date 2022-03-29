import React, {useEffect, useState} from "react";
import {IonCard, IonCardContent} from "@ionic/react";
import LabelTable from "./label_table/LabelTable";
import SlicesMenu from "./SlicesMenu";
import {ImageShapeInterface} from "./ImageShapeInterface";
import {defaultColormap} from '../utils/colormap';

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

    const [data, setData] = useState<ImageShapeInterface>({x: 0, y: 0, z: 0});

    useEffect(() => {
        fetch("/open_image").then(
            r => r.json()
        ).then(
            imageShape => {
                setData(imageShape);
                console.log("imageShape information : {}", imageShape);
                console.log("props with the image information : {}", data);
            }
        )
    })

    return(
        <div>
            <IonCard>
                <IonCardContent>
                    <SlicesMenu imageProps={props.imageSlice} onImageProps={props.onImageSlice}/>
                </IonCardContent>
            </IonCard>

            <IonCard>
                <IonCardContent>
                    <LabelTable colors={defaultColormap}/>
                </IonCardContent>
            </IonCard>

        </div>
    )

};

export default SideMenuAnnot;
