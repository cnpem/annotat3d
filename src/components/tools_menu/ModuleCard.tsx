
import { IonCard, IonCardHeader, IonCardContent, IonButton, IonAccordion, IonAccordionGroup, IonItem, IonLabel, IonGrid } from '@ionic/react';

interface ModuleCardProps {
    name: string;
    children: JSX.Element | JSX.Element[];
    disabled?: boolean;
    onPreview?: () => void;
    onApply?: () => void;
    // onPreprocess?: () => void;
    // onPreprocess?: () => void;
    onOther?: () => void;
    disabledPreview?: boolean;
    disabledApply?: boolean;
    // disabledPreprocess?: boolean;
    disabledOther?: boolean;
    OtherName?: string;
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
                    {/* <IonButton color="primary"
                        size="small"
                        disabled={props.disabledPreprocess}
                        hidden={props.onPreprocess === undefined}
                        onClick={props.onPreprocess}>
                        Preprocess
                    </IonButton> */}
                    <IonButton color="primary"
                        size="small"
                        disabled={props.disabledOther}
                        hidden={props.onOther === undefined}
                        onClick={props.onOther}>
                        {props.OtherName}
                    </IonButton>
                    <IonButton color="primary"
                        size="small"
                        disabled={props.disabledPreview}
                        hidden={props.onPreview === undefined}
                        onClick={props.onPreview}>
                        Preview
                    </IonButton>
                    <IonButton color="primary"
                        size="small"
                        disabled={props.disabledApply}
                        hidden={props.onApply === undefined}
                        onClick={props.onApply}>
                        Apply
                    </IonButton>
                </div>
            </IonCardContent>

        </IonCard>

    );
};
export {ModuleCard, ModuleCardItem};
