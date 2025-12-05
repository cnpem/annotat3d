import React, { useState, useEffect, useCallback } from 'react';
import { IonPopover, IonProgressBar, IonLabel } from '@ionic/react';

interface LoadingComponentInterface {
    openLoadingWindow: boolean;
    loadingText: string;
    closeDelay?: number;
    delayBeforeShow?: number;
    extraContent?: React.ReactNode; // optional button, keeps old UI if absent
}

const LoadingComponent: React.FC<LoadingComponentInterface> = ({
    openLoadingWindow,
    loadingText,
    closeDelay = 300,
    delayBeforeShow = 600,
    extraContent,
}) => {
    const [isOpen, setIsOpen] = useState(openLoadingWindow);

    const handleOpenChange = useCallback(() => {
        let timer: NodeJS.Timeout;

        if (openLoadingWindow) {
            timer = setTimeout(() => setIsOpen(true), delayBeforeShow);
        } else {
            timer = setTimeout(() => setIsOpen(false), closeDelay);
        }

        return () => clearTimeout(timer);
    }, [openLoadingWindow, delayBeforeShow, closeDelay]);

    useEffect(handleOpenChange, [handleOpenChange]);

    return (
        <IonPopover isOpen={isOpen} className="loading-popover" backdropDismiss={false} showBackdrop={true}>
            {/* ✅ Main loading text — SAME as before */}
            <IonLabel
                style={{
                    whiteSpace: 'pre-line',
                    textAlign: 'center',
                    padding: '12px',
                }}
            >
                {loadingText}
            </IonLabel>

            {/* ✅ If user passed a button, show it (does NOT affect layout when empty) */}
            {extraContent && (
                <div
                    style={{
                        textAlign: 'center',
                        marginBottom: '6px',
                        marginTop: '-6px',
                    }}
                >
                    {extraContent}
                </div>
            )}

            {/* ✅ Original message stays intact */}
            <IonLabel style={{ textAlign: 'center' }}>Please, wait a moment...</IonLabel>

            {/* ✅ Progress bar untouched */}
            <IonProgressBar type="indeterminate" />

            <br />
        </IonPopover>
    );
};

export default LoadingComponent;
