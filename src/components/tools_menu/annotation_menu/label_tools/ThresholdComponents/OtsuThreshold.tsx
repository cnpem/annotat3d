import React from 'react';
import { IonItem, IonLabel } from '@ionic/react';

interface CurrentValue {
    lower: number;
    upper: number;
    onChange: (newValues: { lower: number; upper: number }) => void;
}

const OtsuThreshold: React.FC<CurrentValue> = ({ lower, upper, onChange }) => {

    //onChange({ lower: newLower, upper: newUpper });

    return (
        <IonItem>
            <IonLabel>Otsu threshold</IonLabel>
            {/* Add your additional implementation here */}
        </IonItem>
    );
};

export default OtsuThreshold;
