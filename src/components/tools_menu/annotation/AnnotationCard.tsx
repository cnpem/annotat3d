import React from "react";
import {IonButton, IonCard, IonCardContent, IonIcon} from "@ionic/react";
import {arrowUndoOutline} from "ionicons/icons";
import {sfetch} from "../../../utils/simplerequest";
import {dispatch, useEventBus} from "../../../utils/eventbus";
import {useStorageState} from "react-storage-hooks";

const AnnotationCard : React.FC = () => {

    const [activateMenu, setActivateMenu] = useStorageState<boolean>(sessionStorage, "ActivateComponents", true);

    useEventBus("ActivateComponents", (activateSliceMenu) => {
        setActivateMenu(activateSliceMenu);
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
                        <IonButton color="danger" size="small" disabled={activateMenu}
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
