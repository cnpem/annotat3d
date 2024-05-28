import React from 'react';
import { IonGrid, IonRow, IonCol, IonIcon, IonLabel } from '@ionic/react';
import { ellipse } from 'ionicons/icons'; // Using the ellipse icon to create a circle

// Define the type for the components array items
const components: string[] = ['Image', 'Annotation', 'Superpixel', 'Label'];

// Define the props type expected by the ComponentList component
interface ComponentListProps {
    components_active: string[]; // Assuming components_active is an array of strings
}

const ComponentList: React.FC<ComponentListProps> = ({ components_active }) => (
    <IonGrid>
        <IonRow>
            {components.map((component, index) => (
                <IonCol
                    key={index}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}
                >
                    <IonIcon
                        icon={ellipse}
                        style={{
                            color: components_active.includes(component) ? 'green' : 'grey', // Green if active, grey otherwise
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            boxShadow: components_active.includes(component)
                                ? '0 0 5px 1px rgba(0, 128, 0, 0.5)'
                                : 'none', // Blur effect only for active components
                        }}
                    />
                    <IonLabel style={{ marginLeft: '6px' }}>{component}</IonLabel>
                </IonCol>
            ))}
        </IonRow>
    </IonGrid>
);

export default ComponentList;
