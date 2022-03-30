
import { IonCard, IonCardTitle, IonCardHeader, IonCardSubtitle, IonCardContent, IonButton, IonAccordion, IonAccordionGroup, IonTitle, IonItem, IonItemDivider, IonLabel, IonList, IonInput, IonGrid, IonRow, IonSelect, IonSelectOption, IonSpinner, useIonLoading, IonContent, IonIcon, IonFooter, IonHeader, IonChip, IonToolbar } from '@ionic/react';
import {arrowDown} from 'ionicons/icons';
import {Fragment, useState} from 'react';

interface ModuleCardProps {
    name: string;
    children: JSX.Element | JSX.Element[];
    disabled?: boolean;
    onPreview?: () => void;
    onApply?: () => void;
}

interface ModuleCardItemProps {
    name: string;
    children: JSX.Element | JSX.Element[];
}

const ModuleCardItem: React.FC<ModuleCardItemProps> = (props: ModuleCardItemProps) => {

    const childrenArray = props.children instanceof Array ? props.children : [props.children];

    return (
        //We create an IonAccordionGroup for each item, instead of a single one,
        //because otherwise the IonAccordionGroup keyboard navigation keeps stealing input focus
        <IonAccordionGroup>
            <IonAccordion >
                <IonItem button slot="header">
                    <IonLabel color="primary"> <small> { props.name } </small> </IonLabel>
                </IonItem>
                <IonGrid slot="content">
                    { childrenArray }
                </IonGrid>
            </IonAccordion>
        </IonAccordionGroup>
    );
};

const ModuleCard: React.FC<ModuleCardProps> = (props: ModuleCardProps) => {

    const childrenArray = props.children instanceof Array ? props.children : [props.children];

    return (
        <IonCard disabled={props.disabled}>
            <IonCardHeader>
                <div style={ { fontWeight: 600, fontSize: 18 } }>
                    { props.name }
                </div>
            </IonCardHeader>
            <IonCardContent>
                { childrenArray }
                <div style = { { "display": "flex", "justifyContent": "flex-end" } }>
                    { props.onPreview && <IonButton color="primary" onClick={props.onPreview}>Preview</IonButton> }
                    { props.onApply && <IonButton color="primary" onClick={props.onApply}>Apply</IonButton> }
                </div>
            </IonCardContent>

        </IonCard>

    );
};
export {ModuleCard, ModuleCardItem};
