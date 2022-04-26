import React from "react";
import {IonAlert} from "@ionic/react";

interface LoadingComponentInterface{
    openWarningWindow: boolean
    onOpenWarningWindow: (flag: boolean) => void;
}

const LoadingComponent: React.FC<LoadingComponentInterface> = ({openWarningWindow,
                                                               onOpenWarningWindow}) => {

    const closeWarningWindow = () => {
        onOpenWarningWindow(false);
    }

    return(
        <IonAlert
            isOpen={openWarningWindow}
            onDidDismiss={closeWarningWindow}
            header={"Olha que coisa fofa"}
            message={"tá mostrando uma menssagem linda :D"}
            buttons={[
                {
                    text: "No",
                    id: "no-button",
                    handler: () => {
                        closeWarningWindow();
                    }
                },
                {
                    text: "Yes",
                    id: "yes-button",
                    handler: () => {
                        console.log("aoba\n");
                    }
                }
            ]}/>
    )
}
export default LoadingComponent