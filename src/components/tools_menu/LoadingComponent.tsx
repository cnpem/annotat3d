import React from "react";
import {IonLabel, IonPopover, IonProgressBar} from "@ionic/react";

interface LoadingComponentInterface{
    openLoadingWindow: boolean
}

const LoadingComponent: React.FC<LoadingComponentInterface> = ({openLoadingWindow}) => {

    //@TODO: need to place the real function when the application's over
    return(
        <IonPopover
            isOpen={openLoadingWindow}
            className={"loading-popover"}
            backdropDismiss={false}>

            <IonLabel>bla</IonLabel>
            <IonProgressBar type={"indeterminate"}/><br />
        </IonPopover>
    )
}
export default LoadingComponent