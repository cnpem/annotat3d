import {Fragment, useState} from 'react';

import { IonFabList, IonFabButton, IonIcon, IonContent} from '@ionic/react';

interface ButtonProps {
    id: string;
    logo: string;
}

interface MenuButtonProps {
    buttonsList: ButtonProps[];
    onChange?: (button: ButtonProps) => void;
    openSide: 'top' | 'bottom' | 'start' | 'end';
};

const MenuFabButton: React.FC<MenuButtonProps> = ({buttonsList, onChange, openSide}) => {

    const [selected, setSelected] = useState(buttonsList[0]);

    return (
        <Fragment>
            <IonFabButton color='dark'>
                <IonIcon size="large" icon={selected.logo}/>
            </IonFabButton>
            <IonFabList side={ openSide }>
                {buttonsList.map((item) => {
                    return (<IonFabButton key={item.id}>
                        <IonIcon icon={item.logo} onClick={() => {
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
