import './ExploreContainer.css';

/**
 * Interface that contains the ContainerProp
 */
interface ContainerProps {
  name: string;
}

/**
 * Component that creates a container
 * @param name string that contains the container name
 * @todo i need to remove this function later, because this function creates the text in the middle of a screen
 * @constructor
 * @return This function returns the container
 */
const ExploreContainer: React.FC<ContainerProps> = ({name}) => {
  return (
    <div className="container">
      <strong>{name}</strong>
      <p>Explore <a target="_blank" rel="noopener noreferrer" href="https://ionicframework.com/docs/components">UI Components</a></p>
    </div>
  );
};

export default ExploreContainer;
