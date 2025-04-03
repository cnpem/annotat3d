/* eslint-disable @typescript-eslint/no-misused-promises */
import {
    IonInput,
    IonItem,
    IonLabel,
    IonRadio,
    IonRadioGroup,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    useIonToast,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
} from '@ionic/react';
import { useState } from 'react';
import { useStorageState } from 'react-storage-hooks';
import { currentEventValue, dispatch } from '../../../utils/eventbus';
import { sfetch } from '../../../utils/simplerequest';
import LoadingComponent from '../utils/LoadingComponent';
import { ModuleCard, ModuleCardItem } from './ModuleCard';

function onApplyThen(info: { slice: number; axis: string }) {
    dispatch('imageChanged', info);
}

const timeToast = 2000;
const toastMessages = {
    onPreview: 'Preview done!',
    onApply: 'Apply done!',
};

const ClippingModuleCard: React.FC = () => {
    const [showToast] = useIonToast();

    const [disabled, setDisabled] = useState<boolean>(false);

    const [h, setH] = useStorageState<number>(sessionStorage, 'h', 50);
    const [sigma, setSigma] = useStorageState<number>(sessionStorage, 'sigma', 0);
    const [bigWindow, setBigWindow] = useStorageState<number>(sessionStorage, 'bigWindow', 21);
    const [smallWindow, setSmallWindow] = useStorageState<number>(sessionStorage, 'smallWindow', 5);

    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [loadingMsg, setLoadingMsg] = useState<string>('');

    function onPreview() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            h,
            sigma,
            bigWindow,
            smallWindow,
            axis: curSlice.axis,
            slice: curSlice.slice,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Creating the preview');

        sfetch('POST', '/filters/nlm/preview/image/future', JSON.stringify(params))
            .then(() => {
                dispatch('futureChanged', curSlice);
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingComp(false);
                void showToast(toastMessages.onPreview, timeToast);
            });
    }

    function onApply() {
        const curSlice = currentEventValue('sliceChanged') as {
            slice: number;
            axis: string;
        };

        const params = {
            h,
            sigma,
            bigWindow,
            smallWindow,
            axis: curSlice.axis,
        };

        setDisabled(true);
        setShowLoadingComp(true);
        setLoadingMsg('Applying');

        sfetch('POST', '/filters/nlm/apply/image/image', JSON.stringify(params))
            .then(() => {
                onApplyThen(curSlice);
            })
            .finally(() => {
                setDisabled(false);
                setShowLoadingComp(false);
                void showToast(toastMessages.onApply, timeToast);
            });
    }

    return (
        <ModuleCard disabled={disabled} name="Non Local Means Filtering" onPreview={onPreview} onApply={onApply}>
            <ModuleCardItem name="Filter Parameters">
                <IonItem>
                    <IonLabel>h</IonLabel>
                    <IonInput
                        value={h}
                        type="number"
                        step="0.1"
                        min={0.1}
                        onIonChange={(e) => setH(+e.detail.value!)}
                    ></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Sigma</IonLabel>
                    <IonInput
                        value={sigma}
                        type="number"
                        step="0.1"
                        min={0}
                        onIonChange={(e) => setSigma(+e.detail.value!)}
                    ></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Big window</IonLabel>
                    <IonInput
                        value={bigWindow}
                        type="number"
                        step="1"
                        min={3}
                        onIonChange={(e) =>
                            Number.isInteger(+e.detail.value!)
                                ? setBigWindow(+e.detail.value!)
                                : void showToast('Please insert an integer value!', timeToast)
                        }
                    ></IonInput>
                </IonItem>
                <IonItem>
                    <IonLabel>Small window</IonLabel>
                    <IonInput
                        value={smallWindow}
                        type="number"
                        step="1"
                        min={3}
                        onIonChange={(e) =>
                            Number.isInteger(+e.detail.value!)
                                ? setSmallWindow(+e.detail.value!)
                                : void showToast('Please insert an integer value!', timeToast)
                        }
                    ></IonInput>
                </IonItem>
            </ModuleCardItem>
            <LoadingComponent openLoadingWindow={showLoadingComp} loadingText={loadingMsg} />
        </ModuleCard>
    );
};

export { ClippingModuleCard };
