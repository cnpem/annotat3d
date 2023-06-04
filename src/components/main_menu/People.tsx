import { book, logoGithub, logoLinkedin, people } from 'ionicons/icons';
import { IonAccordion, IonIcon, IonItem, IonLabel, IonList } from '@ionic/react';

const peopleList: Person[] = [
    {
        name: 'Alan Peixinho',
        linkedin: 'https://www.linkedin.com/in/alan-zanoni-peixinho-2816ab23',
        github: 'https://github.com/alanpeixinho',
    },
    {
        name: 'Allan Pinto',
        linkedin: 'https://www.linkedin.com/in/allansp84/',
        lattes: 'https://allansp84.github.io/',
        github: 'https://github.com/allansp84',
    },
    {
        name: 'Bruno Carlos',
        lattes: 'https://www.linkedin.com/in/bruno-vasco-de-paula-carlos-711345231/',
        linkedin: 'https://www.linkedin.com/in/bruno-vasco-711345231/',
        github: 'https://github.com/brnovasco',
    },
    {
        name: 'Gabriel Borin',
        lattes: 'http://lattes.cnpq.br/2649693387467428',
        linkedin: 'https://www.linkedin.com/in/gabriel-borin-3b7b7a14b',
        github: 'https://github.com/borin98',
    },
    {
        name: 'Giovanna Antonieti',
        linkedin: 'https://www.linkedin.com/in/giovannaantonieti',
    },
    {
        name: 'Henrique Gonçalves',
        linkedin: 'https://www.linkedin.com/in/henrique-machado-gon%C3%A7alves-2393548b',
    },
    {
        name: 'Jhessica Silva',
        linkedin: 'https://www.linkedin.com/in/jhessica',
    },
    {
        name: 'Matheus Bernardi',
        linkedin: 'https://www.linkedin.com/in/matheus-bernardi',
    },
    {
        name: 'Matheus Sarmento',
        lattes: 'http://lattes.cnpq.br/1743191077849984',
    },
    {
        name: 'Paulo Mausbach',
        linkedin: 'https://www.linkedin.com/in/paulo-baraldi-mausbach-094b9216a',
    },
    {
        name: 'Thiago Spina',
        linkedin: 'https://www.linkedin.com/in/thiago-vallin-spina-935563100',
        lattes: 'http://lattes.cnpq.br/1977864892800649',
    },
    {
        name: 'Victor Cesaroni',
        linkedin: 'https://www.linkedin.com/in/victorcesaroni',
    },
    {
        name: 'Vitória Pinho',
        lattes: 'http://lattes.cnpq.br/5243670807170633',
    },
];

interface Person {
    name: string;
    linkedin?: string;
    github?: string;
    lattes?: string;
}

/**
 * Colormap selector component
 * @constructor
 */
const People: React.FC = () => {
    function renderPeople(person: Person) {
        return (
            <IonItem>
                <IonLabel>{person.name}</IonLabel>
                <a hidden={person.linkedin === undefined} href={person.linkedin}>
                    <IonIcon icon={logoLinkedin} />
                </a>
                <a hidden={person.github === undefined} href={person.github}>
                    <IonIcon icon={logoGithub} />
                </a>
                <a hidden={person.lattes === undefined} href={person.lattes}>
                    <IonIcon icon={book} />
                </a>
            </IonItem>
        );
    }

    return (
        <IonAccordion>
            <IonItem slot={'header'}>
                <IonIcon slot={'start'} icon={people} />
                <IonLabel> Acknowledgements </IonLabel>
            </IonItem>
            <IonList slot={'content'}>{peopleList.map(renderPeople)}</IonList>
        </IonAccordion>
    );
};

export default People;
