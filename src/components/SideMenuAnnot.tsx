import React from "react";
import {IonCard, IonItemDivider, IonList} from "@ionic/react";
import SlicesSubMenu from "./SlicesSubMenu";
import {useParams} from "react-router";
import ClippingPlane from "./ClippingPlane";

/**
 * @todo i need to remove the slices variables later
 * @constructor
 */
const SideMenuAnnot: React.FC = () => {

    const sliceXY = useParams<number>();
    const sliceXZ = useParams<number>();
    const sliceYZ = useParams<number>();
    const clipPlane = useParams<number>();

    return(
        <IonCard>
            <IonList>
                <SlicesSubMenu numberVal={sliceXY} titleName={"Slice XY"}/>
                <SlicesSubMenu numberVal={sliceXZ} titleName={"Slice XZ"}/>
                <SlicesSubMenu numberVal={sliceYZ} titleName={"Slice YZ"}/>
                <ClippingPlane numberVal={clipPlane} titleName={"Clipping Plane"}/>
                <IonItemDivider/>
            </IonList>
        </IonCard>
    )

};

export default SideMenuAnnot;