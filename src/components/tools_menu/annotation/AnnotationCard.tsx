import React from "react";
import {IonButton, IonCard, IonCardContent, IonIcon} from "@ionic/react";
import {arrowUndoOutline} from "ionicons/icons";
import {sfetch} from "../../../utils/simplerequest";
import {dispatch, useEventBus} from "../../../utils/eventbus";
import AnnotationLoadDialog from "./AnnotationLoadDialog";
import AnnotationSaveDialog from "./AnnotationSaveDialog";
import {useStorageState} from "react-storage-hooks";

const AnnotationCard : React.FC = () => {

    const [lockMenu, setLockMenu] = useStorageState<boolean>(sessionStorage, 'LockComponents', true);

    useEventBus('LockComponents', (activateSliceMenu) => {
        setLockMenu(activateSliceMenu);
    })

    function undoAnnotation() {
        sfetch('POST', '/undo_annot', '')
        .then(() => {
            dispatch('annotationChanged', null);
        });
    }

    return(
        <IonCard>
                <IonCardContent>
                    <div style={ {display: 'flex', justifyContent: 'flex-end'} }>
                        <AnnotationLoadDialog/>

                        <AnnotationSaveDialog/>

                        <IonButton color="danger" size="small" disabled={lockMenu}
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
