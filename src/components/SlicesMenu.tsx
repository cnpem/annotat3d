import React, {useState} from "react";
import {SlicesMenuInterface} from "./TypeScriptFiles/Interfaces/SlicesMenuInterface";
import {
    IonIcon, IonInput, IonItem,
    IonLabel, IonRange, IonSegment,
    IonSegmentButton, IonTitle
} from "@ionic/react";
import {albumsOutline} from "ionicons/icons";

/**
 * @todo i need this component to update the X, Y and Z slice
 * @param args
 * @constructor
 */
const SlicesMenu: React.FC<SlicesMenuInterface> = (args) => {

    const [sliceName, setSliceName] = useState<string>("XY");
    const [sliceValue, setSliceValue] = useState<number>(0);
    const [maxValSlider, setMaxValSlider] = useState<number>(args.imageProps.z);

    const handleSliceValue = (e: CustomEvent) => {
        const val = +e.detail.value!;
        console.log(val);
        setSliceValue(+e.detail.value!);
    }

    const handleSliceName = (e: CustomEvent) => {
        setSliceName(e.detail.value);

        if(sliceName === "XY")
        {

            setMaxValSlider(args.imageProps.z);

        }

        else if(sliceName == "XZ")
        {

            setMaxValSlider(args.imageProps.y);

        }

        else
        {

            setMaxValSlider(args.imageProps.x);

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
                <IonInput type={"number"} min={0} max={maxValSlider} clearInput value={sliceValue} onIonChange={handleSliceValue}/>
            </IonItem>
        </React.Fragment>
    );

}

export default SlicesMenu;