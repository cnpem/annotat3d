import { informationCircle } from 'ionicons/icons';
import { IonAccordion, IonChip, IonIcon, IonItem, IonLabel, IonList } from '@ionic/react';
import { useEffect, useState } from 'react';
import { sfetch } from '../../utils/simplerequest';

interface Software {
    name: string;
    version: string;
}

/**
 * Colormap selector component
 * @constructor
 */
const About: React.FC = () => {
    const [software, setSoftware] = useState<Software[]>([]);

    useEffect(() => {
        void sfetch('POST', '/versions', '', 'json').then((response) => {
            setSoftware(response as Software[]);
        });
    }, []);

    function renderSoftware(softw: Software) {
        return (
            <IonItem>
                <IonLabel style={{ fontFamily: 'monospace' }}>{softw.name}</IonLabel>
                <IonChip style={{ fontFamily: 'monospace' }} color="tertiary">
                    {softw.version}
                </IonChip>
            </IonItem>
        );
    }

    return (
        <IonAccordion>
            <IonItem slot={'header'}>
                <IonIcon slot={'start'} icon={informationCircle} />
                <IonLabel>About</IonLabel>
            </IonItem>
            <IonList slot={'content'}>{software.map(renderSoftware)}</IonList>
        </IonAccordion>
    );
};

export default About;
