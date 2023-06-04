import React from 'react';
import { IonLabel, IonPopover, IonProgressBar } from '@ionic/react';

interface LoadingComponentInterface {
    openLoadingWindow: boolean;
    loadingText: string;
}

/**
 * Component that creates the loading menu for an operation
 * @param {boolean} openLoadingWindow flag variable that opens the loading if "True" and closes otherwise
 * @param {string} loadingText message to display while in the loading
 * @interface {LoadingComponentInterface} the interface contains the loadingText and openLoadingWindow
 */
const LoadingComponent: React.FC<LoadingComponentInterface> = ({ openLoadingWindow, loadingText }) => {
    return (
        <IonPopover isOpen={openLoadingWindow} className={'loading-popover'} backdropDismiss={false}>
            <IonLabel>{loadingText}</IonLabel>
            <IonLabel>Please, wait a moment...</IonLabel>
            <IonProgressBar type={'indeterminate'} />
            <br />
        </IonPopover>
    );
};
export default LoadingComponent;
