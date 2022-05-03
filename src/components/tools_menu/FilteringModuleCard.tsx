import {IonInput, IonItem, IonLabel, IonToggle} from "@ionic/react";
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

        console.log(curSlice);

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
    
    const [sigma, setSigma] = useStorageState<number>(sessionStorage, "gaussianSigma", 1024); 

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number,
            axis: string
        };

        const params = {
            sigma: sigma,
            axis: curSlice.axis,
            slice: curSlice.slice
        };

        console.log(curSlice);
        console.log("hello 1");
        console.log(params);

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

        const params = {
            sigma: sigma
        };

        setDisabled(true);
        sfetch('POST', '/bm3d/preview/image/image', JSON.stringify(params))
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
            </ModuleCardItem>
        </ModuleCard>
    );
}

export {BM3DFilteringModuleCard, GaussianFilteringModuleCard};
