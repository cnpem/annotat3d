import './ExploreContainer.css';

import {useState, useEffect} from 'react';

import { mean } from '../utils/math.js';

import {sfetch} from '../utils/simplerequest.js';

interface ContainerProps {
  name: string;
}



const ExploreContainer: React.FC<ContainerProps> = ({ name }) => {

    const [hue, setHue] = useState('kkk');

  useEffect(() => {
      sfetch('POST', 'http://0.0.0.0:5000/test', '', 'text')
      .then(async (text) => {
          console.log("response await");
          console.log('text: ', text);
          console.log(mean([12, 24]));
          setHue(text);
      })
    .catch(res => {
        console.log('erroooou ', res.status);
        console.log(mean([12, 2, 24]));
        setHue(res.status);
    });
  }, []);


  return (
    <div className="container">
      <h1>{hue}</h1>
      <strong>{name}</strong>
      <p>Explore <a target="_blank" rel="noopener noreferrer" href="https://ionicframework.com/docs/components">UI Components</a></p>
    </div>
  );
};

export default ExploreContainer;
