import { IonAccordion, IonAccordionGroup, IonButton, IonContent, IonInput, IonItem, IonLabel, IonList } from "@ionic/react";
import { useState } from "react";
import ErrorWindowComp from "../../file/ErrorWindowComp";

const NetworkComp: React.FC = () => {

    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [importNetworkPath, setImportNetworkPath] = useState<string>("");
    const [importNetworkName, setImportNetworkName] = useState<string>("");

    // const changeCheckedStatus = (index: number) => {
    //     const newCheckedVector = augmentationOpSelected.map(
    //         element => element.checkedId === index
    //             ? {...element, isChecked: !element.isChecked} : element
    //     );
    //     setAugmentationOpSelected(newCheckedVector);
    // }

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    }

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    }

    const readFile = (path: string) => {
        console.log('NetworkComp Import Dataset readFile path:',path)

        // sfetch("POST", `???`, JSON.stringify(path), "json").then(
        //     (element: TableElement) => {
        //         console.log("Backend response");
        //         console.table(element);
        //         pathFiles.file = element
        //         onTableVec(pathFiles);
        //         pathFiles.id += 1;

        //     }).catch((error: ErrorInterface) => {
        //     console.log("error while trying to add an image")
        //     console.log(error.error_msg);
        //     setErrorMsg(error.error_msg);
        //     setShowErrorWindow(true);
        // })
    }

    // /**
    //  * Clean up popover dialog
    //  */
    // const cleanUp = () => {
    //     setShowErrorWindow(false);
    //     setErrorMsg("");
    // };
    return (
            <small>
            <IonContent scrollEvents={true}>
                <IonAccordionGroup multiple={true}> 
                    <IonAccordion>
                            <IonItem slot={"header"}>
                                <IonLabel><small>Import Network</small></IonLabel>
                            </IonItem>
                            {/*Ion select option*/}
                            <IonList slot={"content"}>
                                {/* Import Network */}
                                <IonItem>
                                    <IonLabel position={"fixed"}><small>Network Path</small></IonLabel>
                                    <IonInput
                                        value={importNetworkPath}
                                        placeholder={"/Path/to/Network.model.tar.gz"}
                                        onIonChange={(e: CustomEvent) => {
                                            setImportNetworkPath(e.detail.value as string);
                                        }}
                                    />
                                </IonItem>
                                <IonItem>
                                    <IonLabel position={"fixed"}><small>Network Name</small></IonLabel>
                                    <IonInput
                                        value={importNetworkName}
                                        placeholder={"YourNetworkName"}
                                        onIonChange={(e: CustomEvent) => {
                                            setImportNetworkName(e.detail.value as string);
                                        }}
                                    />
                                    <IonButton
                                            slot={"end"}
                                            size={"default"}
                                            color={"tertiary"}
                                            onClick={() => {
                                                // console.log(workspacePath);
                                                // console.log(filePath);
                                                readFile(importNetworkPath);
                                            }}>Import</IonButton>
                                </IonItem>
                            </IonList>
                    </IonAccordion>
                </IonAccordionGroup>
            </IonContent>
            
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={"Error while loading the file"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
        </small>
    );
}

export default NetworkComp