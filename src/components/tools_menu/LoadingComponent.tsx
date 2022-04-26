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
}

const LoadingComponent: React.FC<LoadingComponentInterface> = ({openLoadingWindow,
                                                               onOpenLoadingWindow}) => {
    const closeWarningWindow = () => {
        onOpenLoadingWindow(false);
    }

    return(
        <IonPopover
            isOpen={openLoadingWindow}
            onDidDismiss={() => closeWarningWindow()}
            className={"loading-popover"}
            backdropDismiss={false}>

            <IonLabel>bla</IonLabel>
            <IonProgressBar type="indeterminate"/><br />
            <IonButton onClick={() => closeWarningWindow()}>Exit</IonButton>
        </IonPopover>
    )
}
export default LoadingComponent