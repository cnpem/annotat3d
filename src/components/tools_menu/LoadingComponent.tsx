import React from "react";
import {
    IonButton,
    IonLabel,
    IonPopover,
    IonProgressBar
} from "@ionic/react";

interface LoadingComponentInterface{
    openLoadingWindow: boolean
    onOpenLoadingWindow: (flag: boolean) => void;

    computatedSuperpixel: boolean
}

const LoadingComponent: React.FC<LoadingComponentInterface> = ({openLoadingWindow,
                                                               onOpenLoadingWindow,
                                                               computatedSuperpixel}) => {
    const closeWarningWindow = () => {
        onOpenLoadingWindow(false);
    }
    //@TODO: need to place the real function when the application's over
    return(
        <IonPopover
            isOpen={computatedSuperpixel}
            onDidDismiss={() => closeWarningWindow()}
            className={"loading-popover"}
            backdropDismiss={false}>

            <IonLabel>bla</IonLabel>
            <IonProgressBar type={"indeterminate"}/><br />
            <IonButton onClick={() => closeWarningWindow()}>Exit</IonButton>
        </IonPopover>
    )
}
export default LoadingComponent