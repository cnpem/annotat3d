import {IonItem, IonLabel, IonIcon, IonPopover} from "@ionic/react";
import {caretDown, caretForward} from "ionicons/icons";
import {padStart} from "lodash";
import {Fragment, useState} from "react";

interface OptionInterface {
    label: string;
    id: string;
    options?: OptionInterface[];
}

interface GroupSelectOptions {
    id: string;
    options: OptionInterface[];
    onChange: (option: OptionInterface) => void;
}

const GroupSelect: React.FC<GroupSelectOptions> = (props) => {

    const [curOption, setCurOption] = useState<OptionInterface>(props.options[0]);
    const [curGroup, setCurGroup] = useState<OptionInterface[]>(props.options);
    const [showPopover, setShowPopover] = useState<boolean>(false);

    function reset() {
        setCurGroup(props.options);
    }

    function renderOption(option: OptionInterface) {

        const hasOptions = !!option.options;

        return (
            <IonItem>
                <IonLabel style={ {userSelect: 'none'} }
                    key={option.id}
                    onClick={() => {
                        if (hasOptions) {
                            setCurGroup(option.options!!);
                        } else {
                            setCurOption(option);
                            props.onChange(option);
                            setShowPopover(false);
                        }
                    }}>
                    {option.label}
                    <IonIcon hidden={!hasOptions} icon={caretForward}/>
                </IonLabel>
            </IonItem>
        );
    }

    function renderSelect(options: OptionInterface[]) {

        return (
            <Fragment>
                { options.map(renderOption) }
            </Fragment>
        );
    }

    return (
        <div style={ {display: 'inline-flex', justifyContent: 'end'} }>
            <IonLabel style={ {userSelect: 'none'} }
                id={props.id+'-button'} onClick={()=>{ setShowPopover(true) }}>
                { curOption.label }
                <IonIcon icon={caretDown}/>
            </IonLabel>
            <IonPopover
                style={ {'--offset-x': '-100px'} }
                trigger={props.id+'-button'}
                isOpen={showPopover}
                onIonPopoverDidDismiss={() => reset()}>
                {renderSelect(curGroup)}
            </IonPopover>
        </div>
    );
}

export default GroupSelect;
