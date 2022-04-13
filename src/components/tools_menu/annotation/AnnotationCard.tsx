import React from "react";
import {IonButton, IonCard, IonCardContent, IonIcon} from "@ionic/react";
import {arrowUndoOutline, folderOpenOutline, saveOutline} from "ionicons/icons";
import {sfetch} from "../../../utils/simplerequest";
import {dispatch} from "../../../utils/eventbus";
import AnnotationLoadDialog from "./AnnotationLoadDialog";
import AnnotationSaveDialog from "./AnnotationSaveDialog";

const AnnotationCard : React.FC = () => {
    function undoAnnotation() {
        sfetch('POST', '/undo_annot', '')
        .then(() => {
            dispatch('annotationChanged', null);
        });
    };

    return(
        <IonCard>
                <IonCardContent>
                    <div style={ {display: 'flex', justifyContent: 'flex-end'} }>
                        <AnnotationLoadDialog/>

                        <AnnotationSaveDialog/>

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
    );
};

export default AnnotationCard;