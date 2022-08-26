import {
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonPopover,
    IonSegment,
    IonSegmentButton,
    SegmentChangeEventDetail, useIonToast
} from "@ionic/react";
import React, {Fragment, useState} from "react";
import {useEventBus} from "../../../../utils/eventbus";
import {checkbox} from "ionicons/icons";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import {useStorageState} from "react-storage-hooks";
import InferenceComp from "./InferenceComp";
import {
    initialOutput,
    initialPatches, OutputInterface,
    PatchesInterface
} from "./BatchInferenceInterfaces";
import Settings from "./Settings";
import {sfetch} from "../../../../utils/simplerequest";
import ErrorInterface from "../../file/ErrorInterface";
import DeepLoadingComp from "../Utils/DeepLoadingComp";
import { SelectInterface } from "../Utils/WorkspaceInterfaces";

const menuChoices = ["Inference", "Settings"] as const;
type InputMenuChoicesType = typeof menuChoices[number];

interface InferenceBackPayload {
    output: OutputInterface,
    patches: PatchesInterface,
    network: string,
    isInferenceOpChecked: boolean
}

/**
 * Component that create the Batch Inference menu
 * TODO : need to change when the user creates the neural network model
 * TODO : for the Batch Inference button to open this menu. I'll need to change the way networkOptions and availableGpus are created
 * @example <BatchInferenceComp/>
 */
const BatchInferenceComp: React.FC = () => {

    const [menuOp, setMenuOp] = useStorageState<InputMenuChoicesType>(sessionStorage, "DatasetMenu", "Inference");
    const [disableComp, setDisableComp] = useStorageState<boolean>(sessionStorage, "workspaceLoaded", true);
    const [patches, setPatches] = useStorageState<PatchesInterface>(sessionStorage, "patches", initialPatches)
    const [output, setOutput] = useStorageState<OutputInterface>(sessionStorage, "outputBatchInference", initialOutput);
    const [network, setNetwork] = useStorageState<string>(sessionStorage, "NetworkType", "");
    const [availableGpus, setAvailableGpus] = useStorageState<SelectInterface[]>(sessionStorage, "availableGpus", []);
    const [networkOptions, setNetworkOption] = useStorageState<SelectInterface[]>(sessionStorage, "networkOptions", []);
    const [isInferenceOpChecked, setIsInferenceOpChecked] = useStorageState<boolean>(sessionStorage, "isInferenceOpChecked", false);
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [showLoadingComp, setShowLoadingComp] = useState<boolean>(false);
    const [showToast,] = useIonToast();
    const toastTimer = 2000;

    useEventBus("updateNetworkOptions", (newOptions: SelectInterface[]) => {
        setNetworkOption(newOptions);
    });

    useEventBus("workspaceLoaded", (payload: {isDisabled: boolean, gpus: SelectInterface[]}) => {
        setDisableComp(payload.isDisabled);
        setAvailableGpus(payload.gpus);
    });

    const handleIsInferenceChecked = (checked: boolean) => {
        setIsInferenceOpChecked(checked);
    }

    const handleNetwork = (net: string) => {
        setNetwork(net);
    }

    const handleOutput = (newOutput: OutputInterface) => {
        setOutput(newOutput);
    }

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    const handlePatches = (patches: PatchesInterface) => {
        setPatches(patches);
    }

    const menus = [<InferenceComp output={output}
                                  onOutput={handleOutput}
                                  network={network}
                                  networkOptions={networkOptions}
                                  onNetwork={handleNetwork}/>, <Settings patches={patches}
                                                                         onPatches={handlePatches}
                                                                         isInferenceOpChecked={isInferenceOpChecked}
                                                                         onIsInferenceOpChecked={handleIsInferenceChecked}
                                                                         availableGpus={availableGpus}/>];

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowErrorWindow(false);
        setErrorMsg("");
    };

    const selectMenuOp = (e: CustomEvent<SegmentChangeEventDetail>) => {
        setMenuOp(e.detail.value as InputMenuChoicesType);
    };

    const renderMenu = (choice: InputMenuChoicesType, idx: number) => {
        return (
            <div hidden={menuOp !== choice}>{menus[idx]}</div>
        );
    }

    const renderSegmentButton = (choice: InputMenuChoicesType) => {
        return (
            <IonSegmentButton value={choice}>
                <IonLabel>{choice}</IonLabel>
            </IonSegmentButton>
        );
    }

    return (
        <Fragment>
            {/*Button to open the Batch Inference menu*/}
            <IonItem button
                     disabled={disableComp}
                     onClick={() => {
                         sfetch("POST", "/get_frozen_data", "", "json").then((payload: SelectInterface[]) => {
                             console.log(payload);
                             setNetworkOption(payload);
                             setNetwork(payload[0].value);
                         }).catch((error: ErrorInterface) => {
                             console.log("Error in get_frozen_data");
                             console.log(error.error_msg);
                         });
                     }}
                     id={"open-batch-inference"}>
                Batch Inference
            </IonItem>
            <IonPopover
                trigger={"open-batch-inference"}
                onDidDismiss={() => cleanUp()}
                className={"file-popover-dataset"}>
                <IonSegment value={menuOp} onIonChange={selectMenuOp}>
                    {menuChoices.map(renderSegmentButton)}
                </IonSegment>
                {menuChoices.map(renderMenu)}
                <IonButton
                    color={"tertiary"}
                    slot={"end"}
                    onClick={() => {
                        setShowLoadingComp(true);
                        console.log("============================== values ===================================\n");
                        console.log("output\n");
                        console.table(output);
                        console.log("\npatches\n");
                        console.table(patches);
                        console.log("\nNetwork\n");
                        console.table(network);
                        console.log("\nis inference checked\n");
                        console.log(isInferenceOpChecked);
                        console.log("==========================================================================\n");
                        const payload: InferenceBackPayload = {
                            output: output,
                            patches: patches,
                            network: network,
                            isInferenceOpChecked: isInferenceOpChecked
                        };

                        sfetch("POST", "/run_inference", JSON.stringify(payload), "json").then(
                            () => {
                                showToast("Inference Done !", toastTimer);
                            }).catch((error: ErrorInterface) => {
                            console.log("error in run_inference");
                            console.log(error.error_msg);
                            setErrorMsg(error.error_msg);
                            setShowErrorWindow(true);
                        }).finally(() => setShowLoadingComp(false));

                    }}>
                    Inference !
                    <IonIcon
                        icon={checkbox}
                        slot={"end"}/>
                </IonButton>
            </IonPopover>
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={"Error while doing the inference"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
            <DeepLoadingComp
                openLoadingWindow={showLoadingComp}
                loadingText={"Doing the inference"}/>
        </Fragment>
    );

};

export default BatchInferenceComp