import React, {useEffect, useState} from "react";
import {IonButton, IonCard, IonCardContent, IonIcon} from "@ionic/react";
import LabelTable from "./label_table/LabelTable";
import SlicesMenu from "./SlicesMenu";
import {defaultColormap} from '../../utils/colormap';
import {dispatch, useEventBus} from "../../utils/eventbus";
import {ImageShapeInterface} from "./ImageShapeInterface";
import {arrowUndoOutline, folderOpenOutline, saveOutline} from "ionicons/icons";
import {sfetch} from "../../utils/simplerequest";

/**
 * Component that creates the lateral bar menu
 * @todo i need to make this component more small
 * @constructor
 * @return this function return a list of all lateral components
 */
const SideMenuAnnot: React.FC = () => {

    const [imageShape, setImageShape] = useState<ImageShapeInterface>({
        x: 0, y: 0, z: 0
    });

    useEffect(() => {
        sfetch('POST', '/get_image_info/image', '', 'json')
        .then((imgInfo) => {
            console.log('image info: ', imgInfo);
            setImageShape({
                x: imgInfo.shape[2],
                y: imgInfo.shape[1],
                z: imgInfo.shape[0]
            });
        });
    }, [setImageShape]);

    useEventBus('ImageLoaded', (imgInfo) => {
        setImageShape({
            x: imgInfo.imageShape[2],
            y: imgInfo.imageShape[1],
            z: imgInfo.imageShape[0]
        });
    })

    function undoAnnotation() {
        sfetch('POST', '/undo_annot', '')
        .then(() => {
            dispatch('annotationChanged', null);
        });
    }

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

            <IonCard>
                <IonCardContent>
                    <div style={ {display: 'flex', justifyContent: 'flex-end'} }>
                        <IonButton size="small">
                            <IonIcon slot="end" icon={folderOpenOutline}/>
                            Load
                        </IonButton>

                        <IonButton size="small">
                            <IonIcon slot="end" icon={saveOutline}/>
                            Save
                        </IonButton>

                        <IonButton color="danger" size="small"
                            onClick={ () => {
                                undoAnnotation();
                            }}>
                            <IonIcon slot="end" icon={arrowUndoOutline}/>
                            Undo
                        </IonButton>

                    </div>
                </IonCardContent>
            </IonCard>

        </div>
    )

};

export default SideMenuAnnot;
