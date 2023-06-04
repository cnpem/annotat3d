import React from 'react';
import { IonContent, IonLoading } from '@ionic/react';

interface LoadingComponentInterface {
    openLoadingWindow: boolean;
    loadingText: string;
}

/**
 * Loading component used only for deep learning menu
 * @param openLoadingWindow {boolean} - boolean variable to open this menu
 * @param loadingText {string} - string variable used as the loading message to display
 */
const DeepLoadingComp: React.FC<LoadingComponentInterface> = ({ openLoadingWindow, loadingText }) => {
    return (
        <IonContent>
            <IonLoading isOpen={openLoadingWindow} message={loadingText + ' Please, wait a moment...'} />
        </IonContent>
    );
};

export default DeepLoadingComp;
