import {book, logoGithub, logoLinkedin, people} from "ionicons/icons";
import {IonAccordion, IonIcon, IonItem, IonLabel, IonList, useIonToast} from "@ionic/react";

const goodbye_messages = [
    "So long and thanks for all the fish",
    "I miss you too <3",
    "Just call me, we can talk",
    "I can see you are really in need",
    "If you keep pressing this button I will get worried",
    "Just send me an email bro, alanpeixinho81@gmail.com",
    "Keep pressing this and I swear I am filling a restriction order",
    "Again, just call me (alanpeixinho81@gmail.com)"
];

const peopleList: Person[] = [
    {
        name: 'Thiago Spina',
        linkedin: 'https://www.linkedin.com/in/thiago-vallin-spina-935563100',
        lattes: 'http://lattes.cnpq.br/1977864892800649'
    },
    {
        name: "Allan Pinto",
        linkedin: "https://www.linkedin.com/in/allansp84/",
        lattes: "https://allansp84.github.io/",
        github: "https://github.com/allansp84"
    },
    {
        name: 'Alan Peixinho',
        linkedin: 'https://www.linkedin.com/in/alan-zanoni-peixinho-2816ab23',
        github: 'https://github.com/alanpeixinho'
    },
    {
        name: 'Matheus BernardiNi',
        linkedin: 'https://www.linkedin.com/in/matheus-bernardi',
    },
    {
        name: 'Gabriel Borin',
        lattes: 'http://lattes.cnpq.br/2649693387467428',
        linkedin: 'https://www.linkedin.com/in/gabriel-borin-3b7b7a14b',
        github: "https://github.com/borin98"
    },
    {
        name: "Bruno Carlos",
        lattes: "https://www.linkedin.com/in/bruno-vasco-de-paula-carlos-711345231/",
        linkedin: "https://www.linkedin.com/in/bruno-vasco-711345231/",

    },
    {
        name: 'Victor Cesaroni',
        linkedin: 'https://www.linkedin.com/in/victorcesaroni'
    },
    {
        name: 'Paulo Mausbach',
        linkedin: 'https://www.linkedin.com/in/paulo-baraldi-mausbach-094b9216a'
    },
    {
        name: 'Giovanna Antonieti',
        linkedin: 'https://www.linkedin.com/in/giovannaantonieti'
    },
    {
        name: 'Henrique Gonçalves',
        linkedin: 'https://www.linkedin.com/in/henrique-machado-gon%C3%A7alves-2393548b'
    },
    {
        name: 'Jhessica Silva',
        linkedin: 'https://www.linkedin.com/in/jhessica'
    },
    {
        name: 'Vitória Pinho',
        lattes: 'http://lattes.cnpq.br/5243670807170633'
    },
    {
        name: 'Matheus Sarmento',
        lattes: 'http://lattes.cnpq.br/1743191077849984'
    }
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
const People : React.FC = () => {

    const [present,] = useIonToast();

    function renderPeople(person: Person) {
        return (
            <IonItem>
                <IonLabel onClick={() => {
                    if (person.name === 'Alan Peixinho') {
                    present(goodbye_messages[0], 2000);
                    if (goodbye_messages.length>1)
                        goodbye_messages.shift();
                    }
                }}>{ person.name }</IonLabel>
                <a hidden={person.linkedin === undefined} href={person.linkedin}>
                    <IonIcon icon={logoLinkedin}/>
                </a>
                <a hidden={person.github === undefined} href={person.github}>
                    <IonIcon icon={logoGithub}/>
                </a>
                <a hidden={person.lattes === undefined} href={person.lattes}>
                    <IonIcon icon={book}/>
                </a>
            </IonItem>
        );
    }

    return (
        <IonAccordion>
            <IonItem slot={"header"}>
                <IonIcon slot={"start"} icon={people}/>
                <IonLabel> People </IonLabel>
            </IonItem>
            <IonList slot={"content"}>
                { peopleList.map(renderPeople) }
            </IonList>
        </IonAccordion>
    );
};

export default People;
