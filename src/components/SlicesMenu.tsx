import React, {useState} from "react";
import {IonButton, IonButtons, IonIcon,
        IonInput, IonItem, IonLabel,
        IonRange, IonSegment, IonSegmentButton, IonTitle
} from "@ionic/react";
import {albumsOutline} from "ionicons/icons";

import {ImageShapeInterface} from './ImageShapeInterface';

interface SlicesMenuProps{
    imageProps: ImageShapeInterface;
    onImageProps: (image: ImageShapeInterface) => void;
}

/**
 * @param props
 * @constructor
 */
const SlicesMenu: React.FC<SlicesMenuProps> = (props: SlicesMenuProps) => {

    const [sliceName, setSliceName] = useState<string>("XY");
    const [nameButtonSlice, setNameButtonSlice] = useState<string>("Z");
    const [sliceValue, setSliceValue] = useState<number>(0);
    const [maxValSlider, setMaxValSlider] = useState<number>(props.imageProps.z);

    const handleSliceValue = (e: CustomEvent) => {
        setSliceValue(+e.detail.value!);
    }

    const handleSliceName = (e: CustomEvent) => {
        setSliceName(e.detail.value);

        if(e.detail.value === "XY")
        {

            setNameButtonSlice("Z");
            setMaxValSlider(props.imageProps.z);

            if(sliceValue > props.imageProps.z)
            {

                setSliceValue(props.imageProps.z);

            }

        }

        else if(e.detail.value === "XZ")
        {

            setNameButtonSlice("Y");
            setMaxValSlider(props.imageProps.y);

            if(sliceValue > props.imageProps.y)
            {

                setSliceValue(props.imageProps.y);

            }

        }

        else
        {

            setNameButtonSlice("X");
            setMaxValSlider(props.imageProps.x);

            if(sliceValue > props.imageProps.x)
            {

                setSliceValue(props.imageProps.x);

            }

        }

    }

    return(
        <React.Fragment>
            <IonTitle>Slice selector</IonTitle>
            <IonSegment value={sliceName} onIonChange={handleSliceName}>
                <IonSegmentButton value={"XY"}>
                    <IonLabel>{"XY"}</IonLabel>
                </IonSegmentButton>

                <IonSegmentButton value={"XZ"}>
                    <IonLabel>{"XZ"}</IonLabel>
                </IonSegmentButton>

                <IonSegmentButton value={"YZ"}>
                    <IonLabel>{"YZ"}</IonLabel>
                </IonSegmentButton>
            </IonSegment>

            <IonItem>
                <IonRange min={0} max={maxValSlider} pin={true} value={sliceValue} onIonChange={handleSliceValue}>
                    <IonIcon size={"big"} slot={"start"} icon={albumsOutline}/>
                </IonRange>
            </IonItem>
            <IonItem>
                <IonButtons>
                    <IonButton disabled={true} color={"dark"} size={"default"}>{nameButtonSlice}</IonButton>
                </IonButtons>
                <IonInput type={"number"} min={0} max={maxValSlider} clearInput value={sliceValue} onIonChange={handleSliceValue}/>
            </IonItem>
        </React.Fragment>
    );

}

export default SlicesMenu;
