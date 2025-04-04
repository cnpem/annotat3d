import React from 'react';
import { IonButton, IonPopover, IonContent, IonCard, IonCardHeader, IonCardContent, IonIcon } from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';

interface InfoPopoverProps {
    triggerId: string;
    header: string;
    content: string;
    buttonSlot?: string;
}

const InfoPopover: React.FC<InfoPopoverProps> = ({ triggerId, header, content, buttonSlot = 'end' }) => {
    return (
        <>
            <IonButton id={triggerId} slot={buttonSlot} size="small" fill="clear">
                <IonIcon icon={informationCircleOutline} />
            </IonButton>
            <IonPopover trigger={triggerId} reference="event">
                <IonContent>
                    <IonCard>
                        <IonCardHeader>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{header}</div>
                        </IonCardHeader>
                        <IonCardContent>{content}</IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPopover>
        </>
    );
};

export default InfoPopover;
