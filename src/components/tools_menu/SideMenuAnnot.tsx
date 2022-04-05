import React, {} from "react";
import {IonCard, IonCardContent} from "@ionic/react";
import LabelTable from "./label_table/LabelTable";
import SlicesMenu from "./SlicesMenu";
import {defaultColormap} from '../../utils/colormap';
import {useEventBus} from "../../utils/eventbus";
import {useStorageState} from "react-storage-hooks";
import {ImageShapeInterface} from "./ImageShapeInterface";

/**
 * Component that creates the lateral bar menu
 * @todo i need to make this component more small
 * @constructor
 * @return this function return a list of all lateral components
 */
const SideMenuAnnot: React.FC = () => {

    const [imageShape, setImageShape] = useStorageState<ImageShapeInterface>(sessionStorage, 'imageShape', {
        x: 0, y: 0, z: 0
    });

    useEventBus('ImageLoaded', (imgInfo) => {
        setImageShape({
            x: imgInfo.imageShape[2],
            y: imgInfo.imageShape[1],
            z: imgInfo.imageShape[0]
        });
    })

    return(
        <div>
            <IonCard>
                <IonCardContent>
                    <SlicesMenu imageShape={imageShape}/>
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
