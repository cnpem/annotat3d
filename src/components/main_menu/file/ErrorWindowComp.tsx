import React from "react";
import {IonAlert} from "@ionic/react";

export interface ErrorWindowInterface{
    headerMsg: string

    errorMsg: string;
    onErrorMsg: (msg: string) => void;

    errorFlag: boolean;
    onErrorFlag: (errorFlag: boolean) => void;
}

/**
 * Generic component for any error window
 * @param {string} errorMsg - A string that contains the error message
 * @param {string} headerMsg - A string that contains the h
 * @param {(msg: string) => void} onErrorMsg - errorMsg setter
 * @param {boolean} errorFlag - Boolean that opens the ErrorWindowComp if "true" and close otherwise
 * @param {(errorFlag: boolean)} onErrorFlag - errorFlag setter
 */
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