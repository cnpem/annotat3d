import {
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonButton,
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
    IonGrid,
} from '@ionic/react';
import React from 'react';

interface ModuleCardProps {
    name: string;
    children: React.ReactNode;
    disabled?: boolean;
    onPreview?: () => void;
    onApply?: () => void;
    onOther?: () => void;
    disabledPreview?: boolean;
    disabledApply?: boolean;
    disabledOther?: boolean;
    OtherName?: string;
    PreviewName?: string;
    ApplyName?: string;
}

interface ModuleCardItemProps {
    name: string;
    children: React.ReactNode;
}

const ModuleCardItem: React.FC<ModuleCardItemProps> = ({ name, children }) => {
    return (
        // We create an IonAccordionGroup for each item, instead of a single one,
        // because otherwise the IonAccordionGroup keyboard navigation keeps stealing input focus
        <IonAccordionGroup>
            <IonAccordion>
                <IonItem button slot="header">
                    <IonLabel color="primary">
                        <small>{name}</small>
                    </IonLabel>
                </IonItem>
                <IonGrid slot="content">{children}</IonGrid>
            </IonAccordion>
        </IonAccordionGroup>
    );
};

const ModuleCard: React.FC<ModuleCardProps> = (props: ModuleCardProps) => {
    return (
        <IonCard disabled={props.disabled}>
            <IonCardHeader>
                <div style={{ fontWeight: 600, fontSize: 18 }}>{props.name}</div>
            </IonCardHeader>
            <IonCardContent>
                {props.children}

                {/* Train / Fine-tune (Other) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IonButton
                        color="primary"
                        size="small"
                        disabled={props.disabledOther}
                        hidden={props.onOther === undefined}
                        onClick={props.onOther}
                    >
                        {props.OtherName || 'Other'}
                    </IonButton>
                </div>

                {/* Slice Preview / Vol Preview */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IonButton
                        color="primary"
                        size="small"
                        disabled={props.disabledPreview}
                        hidden={props.onPreview === undefined}
                        onClick={props.onPreview}
                    >
                        {props.PreviewName || 'Preview'}
                    </IonButton>
                    <IonButton
                        color="primary"
                        size="small"
                        disabled={props.disabledApply}
                        hidden={props.onApply === undefined}
                        onClick={props.onApply}
                    >
                        {props.ApplyName || 'Apply'}
                    </IonButton>
                </div>
            </IonCardContent>
        </IonCard>
    );
};

export { ModuleCard, ModuleCardItem };
