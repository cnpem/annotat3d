import {Fragment, useState} from 'react';

import { IonFabList, IonFabButton, IonIcon} from '@ionic/react';

interface ButtonProps {
    id: string;
    logo: string;
}

interface MenuButtonProps {
    buttonsList: ButtonProps[];
    onChange?: (button: ButtonProps) => void;
};

const MenuFabButton: React.FC<MenuButtonProps> = ({buttonsList, onChange}) => {

    const [selected, setSelected] = useState(buttonsList[0]);

    return (
        <Fragment>
            <IonFabButton color='dark'>
                <IonIcon size="large" icon={selected.logo}/>
            </IonFabButton>
            <IonFabList side="top">
                {buttonsList.map((item) => {
                    return (<IonFabButton>
                        <IonIcon key={item.id} icon={item.logo} onClick={() => {
                            if (selected.id !== item.id) {
                                setSelected(item);
                                if (onChange) {
                                    onChange(item);
                                }
                            }
                        }}/>
                    </IonFabButton>);
                })}
            </IonFabList>
        </Fragment>
    );
}

export default MenuFabButton;
