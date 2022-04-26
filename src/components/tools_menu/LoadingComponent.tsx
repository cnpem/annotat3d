import React from "react";
import {IonLabel, IonPopover, IonProgressBar} from "@ionic/react";

interface LoadingComponentInterface{
    openLoadingWindow: boolean
    loadingText: string
}

const LoadingComponent: React.FC<LoadingComponentInterface> = ({openLoadingWindow,
                                                               loadingText}) => {

    //@TODO: need to place the real function when the application's over
    return(
        <IonPopover
            isOpen={openLoadingWindow}
            className={"loading-popover"}
            backdropDismiss={false}>

            <IonLabel>{loadingText}</IonLabel>
            <IonLabel>Please, wait a little</IonLabel>
            <IonProgressBar type={"indeterminate"}/><br />
        </IonPopover>
    )
}
export default LoadingComponent