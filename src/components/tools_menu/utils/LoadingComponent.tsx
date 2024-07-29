import React, { useState, useEffect, useCallback } from 'react';
import { IonLabel, IonPopover, IonProgressBar } from '@ionic/react';

interface LoadingComponentInterface {
    openLoadingWindow: boolean;
    loadingText: string;
    closeDelay?: number;
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
}) => {
    /* this is a fix for firefox, since if it loads too quickly it doesn't give enough time for DOM to rerender the state without the popver
    i.e the popover continues even after the state is set to close, maybe this is fixed in new IONIC versions, current version is v6 */
    const [isOpen, setIsOpen] = useState(openLoadingWindow);

    const handleOpenChange = useCallback(() => {
        if (openLoadingWindow) {
            setIsOpen(true);
        } else {
            // Delay closing the popover to ensure proper rendering across all browsers
            const timer = setTimeout(() => {
                setIsOpen(false);
            }, closeDelay);

            return () => clearTimeout(timer);
        }
    }, [openLoadingWindow, closeDelay]);

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
