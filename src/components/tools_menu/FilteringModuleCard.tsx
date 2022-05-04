import {IonInput, IonItem, IonLabel, IonListHeader, IonRadio, IonRadioGroup, IonToggle} from "@ionic/react";
import {useState} from "react";
import {useStorageState} from "react-storage-hooks";
import {currentEventValue, dispatch} from "../../utils/eventbus";
import {sfetch} from "../../utils/simplerequest";
import {ModuleCard, ModuleCardItem} from "./ModuleCard";


const BM3DFilteringModuleCard: React.FC = () => {

    const [disabled, setDisabled] = useState<boolean>(false);

    const [sigma, setSigma] = useStorageState<number>(sessionStorage, "bm3dSigma", 1024);
    const [twostep, setTwostep] = useStorageState<boolean>(sessionStorage, 'bm3dTwostep', false);

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number,
            axis: string
        };

        const params = {
            sigma: sigma,
            twostep: twostep,
            axis: curSlice.axis,
            slice: curSlice.slice
        };

        setDisabled(true);
        sfetch('POST', '/filters/bm3d/preview/image/future', JSON.stringify(params))
        .then(() => {
            dispatch('futureChanged', curSlice);
        })
        .finally(() => {
            setDisabled(false);
        });
    }

    function onApply() {

        const params = {
            sigma: sigma,
            twostep: twostep
        };

        setDisabled(true);
        sfetch('POST', '/filters/bm3d/apply/image/image', JSON.stringify(params))
        .then(() => {
            dispatch('ImageLoaded', null);
        })
        .finally(() => {
            setDisabled(false);
        });
    }

    return (
        <ModuleCard disabled={disabled} name="BM3D Smooth Filtering"
            onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <IonItem>
                    <IonLabel>Sigma</IonLabel>
                    <IonInput value={sigma}
                        type="number" step="0.1" min={0.1}
                        onIonChange={ (e) => setSigma(+(e.detail.value!!)) }>
                    </IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Two Step</IonLabel>
                    <IonToggle checked={twostep}
                        onIonChange={(e) => setTwostep(e.detail.checked)}>
                    </IonToggle>
                </IonItem>
            </ModuleCardItem>
        </ModuleCard>
    );
}

const GaussianFilteringModuleCard: React.FC = () => {

    const [disabled, setDisabled] = useState<boolean>(false);
    
    const [sigma, setSigma] = useStorageState<number>(sessionStorage, "gaussianSigma", 2); 
    const [convType, setConvType] = useStorageState<string>(sessionStorage, "gaussianConvType", "2d"); 

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number,
            axis: string
        };

        const params = {
            sigma: sigma,
            convType: convType,
            axis: curSlice.axis,
            slice: curSlice.slice
        };

        setDisabled(true);
        sfetch('POST', '/filters/gaussian/preview/image/future', JSON.stringify(params))
        .then(() => {
            dispatch('futureChanged', curSlice);
        })
        .finally(() => {
            setDisabled(false);
        });
    }

    function onApply() {

        // const curSlice = currentEventValue('sliceChanged') as {
        //     slice: number,
        //     axis: string
        // };

        const params = {
            sigma: sigma,
            convType: convType,
            // axis: curSlice.axis,
        };

        setDisabled(true);
        sfetch('POST', '/filters/gaussian/apply/image/image', JSON.stringify(params))
        .then(() => {
            dispatch('ImageLoaded', null);
        })
        .finally(() => {
            setDisabled(false);
        });
    }

    return (
        <ModuleCard disabled={disabled} name="Gaussian Filtering"
            onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <IonItem>
                    <IonLabel>Sigma</IonLabel>
                    <IonInput value={sigma}
                        type="number" step="0.1" min={0.1}
                        onIonChange={ (e) => setSigma(+(e.detail.value!!)) }>
                    </IonInput>
                </IonItem>
                <IonRadioGroup value={convType} onIonChange={e => setConvType(e.detail.value)}>
                    <IonItem>
                        <IonLabel>2D Convolution</IonLabel>
                        <IonRadio value="2d"/>
                    </IonItem>
                    <IonItem>
                        <IonLabel>3D Convolution</IonLabel>
                        <IonRadio value="3d"></IonRadio>
                    </IonItem>
                </IonRadioGroup>
            </ModuleCardItem>
        </ModuleCard>
    );
}

export {BM3DFilteringModuleCard, GaussianFilteringModuleCard};
