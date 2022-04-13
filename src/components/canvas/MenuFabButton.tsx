import {useState} from 'react';

import { IonFabList, IonFabButton, IonIcon} from '@ionic/react';

interface ButtonProps {
    id: string;
    logo: string;
}

interface MenuButtonProps {
    value: string;
    buttonsList: ButtonProps[];
    onChange?: (button: ButtonProps) => void;
    openSide: 'top' | 'bottom' | 'start' | 'end';
    hidden?: boolean;
};

const MenuFabButton: React.FC<MenuButtonProps> = ({value, buttonsList, onChange, openSide, hidden}) => {

    const [selected, setSelected] = useState(buttonsList.find(b => b.id === value)
                                             || buttonsList[0]);



    return (
        <div hidden={hidden}>
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
        </div>
    );
}

export default MenuFabButton;
