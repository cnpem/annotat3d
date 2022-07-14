import {
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonPopover,
    IonSegment,
    IonSegmentButton,
    SegmentChangeEventDetail
} from "@ionic/react";
import React, {Fragment, useState} from "react";
import {useEventBus} from "../../../../utils/eventbus";
import {checkbox} from "ionicons/icons";
import ErrorWindowComp from "../../file/ErrorWindowComp";
import {useStorageState} from "react-storage-hooks";
import InferenceComp from "./InferenceComp";
import {
    BatchInference, gpu_partition,
    initialOutput,
    initialPatches, OutputInterface,
    PatchesInterface,
    type_network
} from "./BatchInferenceInterfaces";
import Settings from "./Settings";

const menuChoices = ["Inference", "Settings"] as const;
type InputMenuChoicesType = typeof menuChoices[number];

/**
 * Component that create the Batch Inference menu
 * TODO : need to implement the back-end function for all scripts of this directory
 * @example <BatchInferenceComp/>
 */
const BatchInferenceComp: React.FC = () => {

    const [menuOp, setMenuOp] = useStorageState<InputMenuChoicesType>(sessionStorage, "DatasetMenu", "Inference");
    const [disableComp, setDisableComp] = useStorageState<boolean>(sessionStorage, "workspaceLoaded", true);
    const [patches, setPatches] = useStorageState<PatchesInterface>(sessionStorage, "patches", initialPatches)
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [batch, setBatch] = useStorageState<BatchInference>(sessionStorage, "batch", {value: 4, isDisabled: true});
    const [output, setOutput] = useStorageState<OutputInterface>(sessionStorage, "outputBatchInference", initialOutput);
    const [network, setNetwork] = useStorageState<type_network>(sessionStorage, "NetworkType", "u-net-2d");
    const [tepuiGPU, setTepuiGPU] = useStorageState<gpu_partition>(sessionStorage, "tepuiGPU", "1-gpu");

    const handleTepuiGPU = (gpu: gpu_partition) => {
        setTepuiGPU(gpu);
    }

    const handleNetwork = (net: type_network) => {
        setNetwork(net);
    }

    const handleOutput = (newOutput: OutputInterface) => {
        setOutput(newOutput);
    }

    const handleBatch = (batch: BatchInference) => {
        setBatch(batch);
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

    useEventBus("workspaceLoaded", (isDisabled: boolean) => {
        setDisableComp(isDisabled);
    });

    const menus = [<InferenceComp output={output}
                                  onOutput={handleOutput}
                                  network={network}
                                  onNetwork={handleNetwork}/>, <Settings patches={patches}
                                                                         onPatches={handlePatches}
                                                                         batch={batch}
                                                                         tepuiGPU={tepuiGPU}
                                                                         onTepuiGPU={handleTepuiGPU}
                                                                         onBatch={handleBatch}/>];

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
                        console.log("============================== values ===================================\n");
                        console.log("output\n");
                        console.table(output);
                        console.log("\npatches\n");
                        console.table(patches);
                        console.log("\nbatches\n");
                        console.table(batch);
                        console.log("\nNetwork\n");
                        console.table(network);
                        console.log("\ntepuiGPU\n");
                        console.table(tepuiGPU);
                        console.log("==========================================================================\n");
                    }}>
                    Inference
                    <IonIcon
                        icon={checkbox}
                        slot={"end"}/>
                </IonButton>
            </IonPopover>
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={"Error while loading the file"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
        </Fragment>
    );

};

export default BatchInferenceComp