import { IonAccordion, IonItem, IonLabel, IonImg, IonIcon } from '@ionic/react';
import { logoGithub } from 'ionicons/icons';

/**
 * Colormap selector component
 * @constructor
 */
const People: React.FC = () => {
    return (
        <IonAccordion>
            <IonItem slot="header">
                <IonIcon slot="start" icon={logoGithub} />
                <IonLabel>Acknowledgements</IonLabel>
            </IonItem>
            <div slot="content" style={{ textAlign: 'center', padding: '1rem' }}>
                <IonImg src="CNPEM.png" alt="Company Logo" style={{ maxWidth: '100%', height: 'auto' }} />
                <div style={{ marginTop: '1rem' }}>
                    <a
                        href="https://github.com/cnpem/annotat3d"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: '#007bff', fontSize: '1rem' }}
                    >
                        <IonIcon icon={logoGithub} style={{ marginRight: '0.5rem' }} />
                        Visit Annotat3D on GitHub
                    </a>
                </div>
            </div>
        </IonAccordion>
    );
};

export default People;
