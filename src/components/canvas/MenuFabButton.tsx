import { useState } from 'react';

import { IonFabList, IonFabButton, IonIcon } from '@ionic/react';

interface ButtonProps {
    id: string;
    logo: string;
}

interface MenuButtonProps {
    value: string;
    buttonsList: ButtonProps[];
    onChange?: (button: ButtonProps) => void;
    openSide: 'top' | 'bottom' | 'start' | 'end';
    disabled?: boolean;
}

const MenuFabButton: React.FC<MenuButtonProps> = ({ value, buttonsList, onChange, openSide, disabled }) => {
    const [selected, setSelected] = useState(buttonsList.find((b) => b.id === value) || buttonsList[0]);
    return (
        <div>
            <IonFabButton disabled={disabled} color="dark" title={'annotation_menu mode: ' + selected.id}>
                <IonIcon size="large" icon={selected.logo} />
            </IonFabButton>
            <IonFabList side={openSide}>
                {buttonsList.map((item) => {
                    return (
                        <IonFabButton
                            key={item.id}
                            title={item.id}
                            onClick={() => {
                                if (selected.id !== item.id) {
                                    setSelected(item);
                                    if (onChange) {
                                        onChange(item);
                                    }
                                }
                            }}
                        >
                            <IonIcon icon={item.logo} />
                        </IonFabButton>
                    );
                })}
            </IonFabList>
        </div>
    );
};

export default MenuFabButton;
