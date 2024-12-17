import React, { useState, useEffect, useCallback } from 'react';
import { IonLabel, IonPopover, IonProgressBar } from '@ionic/react';

interface LoadingComponentInterface {
    openLoadingWindow: boolean;
    loadingText: string;
    closeDelay?: number;
    delayBeforeShow?: number; // Delay before showing the loading component
}

/**
 * Component that creates the loading menu for an operation
 * @param {boolean} openLoadingWindow flag variable that opens the loading if "True" and closes otherwise
 * @param {string} loadingText message to display while in the loading
 * @param {number} closeDelay delay in ms before closing the popover (default: 300ms)
 * @interface {LoadingComponentInterface} the interface contains the loadingText, openLoadingWindow, and optional closeDelay
 */
const LoadingComponent: React.FC<LoadingComponentInterface> = ({
    openLoadingWindow,
    loadingText,
    closeDelay = 300,
    delayBeforeShow = 600, // Default 800ms delay before showing
}) => {
    /* this is a fix for firefox, since if it loads too quickly it doesn't give enough time for DOM to rerender the state without the popver
    i.e the popover continues even after the state is set to close, maybe this is fixed in new IONIC versions, current version is v6 */
    const [isOpen, setIsOpen] = useState(openLoadingWindow);

    const handleOpenChange = useCallback(() => {
        let timer: NodeJS.Timeout;

        if (openLoadingWindow) {
            // Add a delay before showing the loading component
            timer = setTimeout(() => {
                setIsOpen(true);
            }, delayBeforeShow);
        } else {
            // Add a delay before closing the loading component
            timer = setTimeout(() => {
                setIsOpen(false);
            }, closeDelay);
        }

        // Cleanup the timer on dependency change or unmount
        return () => clearTimeout(timer);
    }, [openLoadingWindow, delayBeforeShow, closeDelay]);

    useEffect(handleOpenChange, [handleOpenChange]);

    return (
        <IonPopover
            isOpen={isOpen}
            className={'loading-popover'}
            backdropDismiss={false}
            aria-labelledby="loading-label"
        >
            <IonLabel id="loading-label">{loadingText}</IonLabel>
            <IonLabel>Please, wait a moment...</IonLabel>
            <IonProgressBar type={'indeterminate'} />
            <br />
        </IonPopover>
    );
};

export default LoadingComponent;
