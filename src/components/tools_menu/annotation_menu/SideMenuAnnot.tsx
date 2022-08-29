import React from "react";
import {IonCard, IonCardContent} from "@ionic/react";
import LabelTable from "./label_table/LabelTable";
import {defaultColormap} from '../../../utils/colormap';
import AnnotationCard from "./AnnotationCard";

/**
 * Component that creates the lateral bar menu
 * @constructor
 * @return this function return a list of all lateral components
 */
const SideMenuAnnot: React.FC = () => {

    return(
        <div>
            <IonCard>
                <IonCardContent>
                    <LabelTable colors={defaultColormap}/>
                </IonCardContent>
            </IonCard>

            <AnnotationCard/>

        </div>
    )

};

export default SideMenuAnnot;
