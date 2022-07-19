import { IonItem, IonLabel } from "@ionic/react";
import { Fragment, useState } from "react";
import ErrorWindowComp from "../../file/ErrorWindowComp";

const BoardComp: React.FC = () => {

    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");

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

    return (
        <Fragment>
            <IonItem>
                <IonLabel>BoardComp.tsx says Hello!</IonLabel>
            </IonItem>
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={"Error while loading the file"}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}/>
        </Fragment>
    );
}

export default BoardComp