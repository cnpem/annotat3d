import React from "react";
import {IonAlert} from "@ionic/react";

export interface ErrorWindowInterface{
    errorMsg: string;
    onErrorMsg: (msg: string) => void;

    errorFlag: boolean;
    onErrorFlag: (errorFlag: boolean) => void;
}

const ErrorWindowComp: React.FC<ErrorWindowInterface> = ({errorMsg, onErrorMsg ,errorFlag, onErrorFlag}) => {

    const resetErrorMsg = () => {
        onErrorFlag(false);
        onErrorMsg("");
    }

    return(
        <div>
            {(errorMsg) ?
                <IonAlert
                    isOpen={errorFlag}
                    onDidDismiss={() => resetErrorMsg}
                    header={"Error while trying to load the image"}
                    message={errorMsg}
                    buttons={[
                        {
                            text: "Okay",
                            id: "confirm-button",
                            handler: () => {
                                resetErrorMsg();
                            }
                        }
                    ]}/> :
                        <></>
            }
        </div>
    )
};

export default ErrorWindowComp;