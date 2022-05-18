import React from "react";
import {IonAlert} from "@ionic/react";

export interface ErrorWindowInterface{
    headerMsg: string

    errorMsg: string;
    onErrorMsg: (msg: string) => void;

    errorFlag: boolean;
    onErrorFlag: (errorFlag: boolean) => void;
}

const ErrorWindowComp: React.FC<ErrorWindowInterface> = ({errorMsg,
                                                             headerMsg,
                                                             onErrorMsg,
                                                             errorFlag,
                                                             onErrorFlag}) => {

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
                    header={headerMsg}
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