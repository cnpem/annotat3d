import React, { useState } from 'react';
import {
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList,
    IonPopover,
    IonSelect,
    IonSelectOption,
    IonAccordion,
    IonAccordionGroup,
    IonContent,
    IonToast,
} from '@ionic/react';
import '../../../styles/FileDialog.css';
import { barChart, construct, create, extensionPuzzle, image, images, information } from 'ionicons/icons';
import { sfetch } from '../../../utils/simplerequest';
import { dispatch, useEventBus } from '../../../utils/eventbus';
import ErrorWindowComp from './utils/ErrorWindowComp';
import { ImageInfoInterface } from './utils/ImageInfoInterface';
import ErrorInterface from './utils/ErrorInterface';
import LoadingComponent from '../../tools_menu/utils/LoadingComponent';
import { useStorageState } from 'react-storage-hooks';
import { DtypeType, dtypeList, ImgOperation, MultiplesPath, QueueToast } from './utils/FileLoadInterface';

/**
 * Save Image dialog
 * @param {string} name - Name of the submenu to open this window
 */
const FileSaveDialog: React.FC<{ name: string }> = ({ name }) => {
    const [showPopover, setShowPopover] = useState<{ open: boolean; event: Event | undefined }>({
        open: false,
        event: undefined,
    });

    const [pathSaveFiles, setSavePathFiles] = useState<MultiplesPath>({
        workspacePath: process.env.REACT_APP_WORKSPACE_PATH || '',
        imagePath: '',
        superpixelPath: '',
        labelPath: '',
        annotPath: '',
        classificationPath: '',
    });

    const [openLoadingMenu, setOpenLoadingMenu] = useState<boolean>(false);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMsg, setToastMsg] = useState<string>('');
    const toastTime = 10000;
    const [dtype, setDtype] = useState<DtypeType>('uint16');
    const [showErrorWindow, setShowErrorWindow] = useState<boolean>(false);
    const [useSuperpixelModule, setUseSuperpixelModule] = useStorageState<boolean>(
        sessionStorage,
        'useSuperpixelModule',
        true
    );
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [headerErrorMsg, setHeaderErrorMsg] = useState<string>('');

    useEventBus('useSuperpixelModule', (flag: boolean) => {
        setUseSuperpixelModule(flag);
    });

    const handleErrorMsg = (msg: string) => {
        setErrorMsg(msg);
    };

    const handleErrorWindow = (flag: boolean) => {
        setShowErrorWindow(flag);
    };

    /**
     * Function that save the image and dispatch to the backend
     * @param {string} imgPath - string that contains the file path
     * @param {ImgOperation} saveImgOp - image operation to read. It can be "image", "superpixel" or "label"
     */
    const handleSaveImageAction = async (imgPath: string, saveImgOp: ImgOperation) => {
        const params = {
            image_path: imgPath,
            image_dtype: dtype,
        };

        let msgReturned = '';
        let isError = false;
        await sfetch('POST', '/save_image/' + saveImgOp, JSON.stringify(params), 'json')
            .then((img: ImageInfoInterface) => {
                const imgName = imgPath.split('/');
                msgReturned = `${imgName[imgName.length - 1]} saved as ${saveImgOp}`;

                const info: ImageInfoInterface = {
                    imageShape: img.imageShape,
                    imageDtype: img.imageDtype,
                    imageName: img.imageName,
                    imageExt: img.imageExt,
                    imageFullPath: img.imageFullPath,
                };

                setShowErrorWindow(false);
                dispatch('SaveImage', info);
            })
            .catch((error: ErrorInterface) => {
                msgReturned = error.error_msg;
                isError = true;
                console.log('error while loading the ', saveImgOp);
                console.log(error.error_msg);
                setShowErrorWindow(true);
                setHeaderErrorMsg(`error while loading the ${saveImgOp}`);
                setErrorMsg(error.error_msg);
            });

        const returnedObj: QueueToast = { message: msgReturned, isError };
        return returnedObj;
    };

    /**
     * Function that Saves the annotation_menu .pkl file and send to the backend
     */
    const dispatchSaveAnnot = async () => {
        const annotPath = {
            annot_path:
                pathSaveFiles.workspacePath !== ''
                    ? pathSaveFiles.workspacePath + pathSaveFiles.annotPath
                    : pathSaveFiles.annotPath,
        };
        let msgReturned = '';
        let isError = false;
        await sfetch('POST', '/save_annot', JSON.stringify(annotPath), '')
            .then((success: string) => {
                const imgName = pathSaveFiles.annotPath.split('/');
                msgReturned = `${imgName[imgName.length - 1]} saved as annotation`;
                console.log(success);
            })
            .catch((error: ErrorInterface) => {
                msgReturned = error.error_msg;
                isError = true;
                console.log('Error message while trying to save the Annotation', error.error_msg);
                setHeaderErrorMsg(`error while saving the annotation`);
                setErrorMsg(error.error_msg);
                setShowErrorWindow(true);
            });

        const returnedObj: QueueToast = { message: msgReturned, isError };
        return returnedObj;
    };

    /**
     * Function that Saves the classifier model .model file and send to the backend
     */
    const dispatchSaveClassifier = async () => {
        const backendPayload: { classificationPath: string } = {
            classificationPath:
                pathSaveFiles.workspacePath !== ''
                    ? pathSaveFiles.workspacePath + pathSaveFiles.classificationPath
                    : pathSaveFiles.classificationPath,
        };

        let msgReturned = '';
        let isError = false;

        if (useSuperpixelModule) {
            await sfetch('POST', '/save_classifier', JSON.stringify(backendPayload), 'json')
                .then((success: string) => {
                    msgReturned = `${pathSaveFiles.classificationPath} saved as .model`;
                    console.log(success);
                })
                .catch((error: ErrorInterface) => {
                    msgReturned = error.error_msg;
                    isError = true;
                    console.log('Error message while trying to save the classifier model', error.error_msg);
                    setHeaderErrorMsg(`error while saving the classifier model`);
                    setErrorMsg(error.error_msg);
                    setShowErrorWindow(true);
                });
        } else {
            await sfetch('POST', '/save_classifier_pixel', JSON.stringify(backendPayload), 'json')
                .then((success: string) => {
                    msgReturned = `${pathSaveFiles.classificationPath} saved as .model`;
                    console.log(success);
                })
                .catch((error: ErrorInterface) => {
                    msgReturned = error.error_msg;
                    isError = true;
                    console.log('Error message while trying to save the classifier model', error.error_msg);
                    setHeaderErrorMsg(`error while saving the classifier model`);
                    setErrorMsg(error.error_msg);
                    setShowErrorWindow(true);
                });
        }

        const returnedObj: QueueToast = { message: msgReturned, isError };
        return returnedObj;
    };

    const handleLoadImageAction = async () => {
        /**
         * Dispatch for images, label and superpixel
         */

        setOpenLoadingMenu(true);

        const queueToast: QueueToast[] = [
            {
                message: '',
                isError: false, //Image
            },
            {
                message: '',
                isError: false, //Superpixel
            },
            {
                message: '',
                isError: false, //Label
            },
            {
                message: '',
                isError: false, //Annotation
            },
            {
                message: '',
                isError: false, //Classifier
            },
        ];

        if (pathSaveFiles.imagePath !== '') {
            const imgPath =
                pathSaveFiles.workspacePath !== ''
                    ? pathSaveFiles.workspacePath + pathSaveFiles.imagePath
                    : pathSaveFiles.imagePath;
            const promise = handleSaveImageAction(imgPath, 'image');
            await promise.then((item: QueueToast) => {
                queueToast[0] = item;
            });
        }

        if (pathSaveFiles.superpixelPath !== '') {
            const superpixelPath =
                pathSaveFiles.workspacePath !== ''
                    ? pathSaveFiles.workspacePath + pathSaveFiles.superpixelPath
                    : pathSaveFiles.superpixelPath;
            const promise = handleSaveImageAction(superpixelPath, 'superpixel');
            await promise.then((item: QueueToast) => {
                queueToast[1] = item;
            });
        }

        if (pathSaveFiles.labelPath !== '') {
            const labelPath =
                pathSaveFiles.workspacePath !== ''
                    ? pathSaveFiles.workspacePath + pathSaveFiles.labelPath
                    : pathSaveFiles.labelPath;
            const promise = handleSaveImageAction(labelPath, 'label');
            await promise.then((item: QueueToast) => {
                queueToast[2] = item;
            });
        }

        if (pathSaveFiles.annotPath !== '') {
            const promise = dispatchSaveAnnot();
            await promise.then((item: QueueToast) => {
                queueToast[3] = item;
            });
        }

        if (pathSaveFiles.classificationPath !== '') {
            const promise = dispatchSaveClassifier();
            await promise.then((item: QueueToast) => {
                queueToast[4] = item;
            });
        }

        let finalMsg = '';
        const flagShowToast =
            (!queueToast[0].isError && queueToast[0].message !== '') ||
            (!queueToast[1].isError && queueToast[1].message !== '') ||
            (!queueToast[2].isError && queueToast[2].message !== '') ||
            (!queueToast[3].isError && queueToast[3].message !== '') ||
            (!queueToast[4].isError && queueToast[4].message !== '');

        for (let i = 0; i < queueToast.length; i++) {
            if (queueToast[i].message !== '' && !queueToast[i].isError) {
                finalMsg += `|| ${queueToast[i].message} `;
            }
        }

        setToastMsg(finalMsg);
        setOpenLoadingMenu(false);
        setShowToast(flagShowToast);
    };

    /**
     * Clean up popover dialog
     */
    const cleanUp = () => {
        setShowPopover({ open: false, event: undefined });
        setDtype('uint16');
        setShowErrorWindow(false);
        setErrorMsg('');
        setToastMsg('');
        setOpenLoadingMenu(false);
        setShowToast(false);
        setHeaderErrorMsg('');
    };
    return (
        <>
            <IonPopover
                isOpen={showPopover.open}
                event={showPopover.event}
                onDidDismiss={() => cleanUp()}
                className={'file-popover-save'}
            >
                {/* Save file accordion */}
                <small>
                    <IonContent
                        scrollEvents={true}
                        onIonScrollStart={() => {}}
                        onIonScroll={() => {}}
                        onIonScrollEnd={() => {}}
                    >
                        <IonAccordionGroup multiple={true}>
                            {/* Load Workspace option */}
                            <IonAccordion>
                                <IonItem slot={'header'}>
                                    <IonIcon slot={'start'} icon={construct} />
                                    <IonLabel>
                                        <small>Load Workspace</small>
                                    </IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    <IonItem>
                                        <IonLabel position="stacked">{'Workspace Path'}</IonLabel>
                                        <IonInput
                                            clearInput
                                            placeholder={'/path/to/workspace'}
                                            value={pathSaveFiles.workspacePath}
                                            onIonChange={(e: CustomEvent) =>
                                                setSavePathFiles({
                                                    ...pathSaveFiles,
                                                    workspacePath: e.detail.value!,
                                                })
                                            }
                                        />
                                    </IonItem>
                                    <IonItemDivider />
                                </IonList>
                            </IonAccordion>
                            {/* Save image option */}
                            <IonAccordion>
                                <IonItem slot={'header'}>
                                    <IonIcon slot={'start'} icon={image} />
                                    <IonLabel>
                                        <small>Save Image</small>
                                    </IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    {/* Image Path Text Input*/}
                                    <IonItem>
                                        <IonLabel position="stacked">Image Path</IonLabel>
                                        <IonInput
                                            clearInput
                                            placeholder={'/path/to/file.tif, .tiff, .raw or .b'}
                                            value={pathSaveFiles.imagePath}
                                            onIonChange={(e: CustomEvent) =>
                                                setSavePathFiles({
                                                    ...pathSaveFiles,
                                                    imagePath: e.detail.value!,
                                                })
                                            }
                                        />
                                    </IonItem>
                                    {/* Image Size Grid*/}
                                    <IonItem>
                                        {/* Select dtype */}
                                        <IonLabel position="stacked">Image Type</IonLabel>
                                        <IonSelect
                                            style={{ maxWidth: '100%' }}
                                            interface={'popover'}
                                            value={dtype}
                                            placeholder={'Select One'}
                                            onIonChange={(e) => setDtype(e.detail.value)}
                                        >
                                            {dtypeList.map((type) => {
                                                return (
                                                    <IonSelectOption key={type.value} value={type.value}>
                                                        {type.label}
                                                    </IonSelectOption>
                                                );
                                            })}
                                        </IonSelect>
                                    </IonItem>
                                    <IonItemDivider />
                                </IonList>
                            </IonAccordion>
                            {/* Save superpixel option */}
                            <IonAccordion>
                                <IonItem slot={'header'}>
                                    <IonIcon slot={'start'} icon={extensionPuzzle} />
                                    <IonLabel>
                                        <small>Save Superpixel</small>
                                    </IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    <IonItem>
                                        <IonLabel position="stacked">{'Superpixel Path'}</IonLabel>
                                        <IonInput
                                            clearInput
                                            placeholder={'/path/to/Superpixel.tif, .tiff, .raw or .b'}
                                            value={pathSaveFiles.superpixelPath}
                                            onIonChange={(e: CustomEvent) =>
                                                setSavePathFiles({
                                                    ...pathSaveFiles,
                                                    superpixelPath: e.detail.value!,
                                                })
                                            }
                                        />
                                    </IonItem>
                                    <IonItemDivider />
                                </IonList>
                            </IonAccordion>
                            {/* Save label image option */}
                            <IonAccordion>
                                <IonItem slot={'header'}>
                                    <IonIcon slot={'start'} icon={images} />
                                    <IonLabel>
                                        <small>Save Label Image</small>
                                    </IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    <IonItem>
                                        <IonLabel position="stacked">{'Label image'}</IonLabel>
                                        <IonInput
                                            clearInput
                                            placeholder={'/path/to/Label.tif, .tiff, .raw or .b'}
                                            value={pathSaveFiles.labelPath}
                                            onIonChange={(e: CustomEvent) =>
                                                setSavePathFiles({
                                                    ...pathSaveFiles,
                                                    labelPath: e.detail.value!,
                                                })
                                            }
                                        />
                                    </IonItem>
                                    <IonItemDivider />
                                </IonList>
                            </IonAccordion>
                            {/* Save annotation_menu file option */}
                            <IonAccordion>
                                <IonItem slot={'header'}>
                                    <IonIcon slot={'start'} icon={create} />
                                    <IonLabel>
                                        <small>Save Annotation File</small>
                                    </IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    <IonItem>
                                        <IonLabel position="stacked">{'Annotation file'}</IonLabel>
                                        <IonInput
                                            clearInput
                                            placeholder={'/path/to/Annotation.pkl'}
                                            value={pathSaveFiles.annotPath}
                                            onIonChange={(e: CustomEvent) =>
                                                setSavePathFiles({
                                                    ...pathSaveFiles,
                                                    annotPath: e.detail.value!,
                                                })
                                            }
                                        />
                                    </IonItem>
                                    <IonItemDivider />
                                </IonList>
                            </IonAccordion>
                            {/*Save classifier file option*/}
                            <IonAccordion>
                                <IonItem slot={'header'}>
                                    <IonIcon slot={'start'} icon={barChart} />
                                    <IonLabel>
                                        <small>Save Classifier</small>
                                    </IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    <IonItem>
                                        <IonLabel position="stacked">Classifier Path</IonLabel>
                                        <IonInput
                                            clearInput
                                            placeholder={'/path/to/classifier.model'}
                                            value={pathSaveFiles.classificationPath}
                                            onIonChange={(e: CustomEvent) =>
                                                setSavePathFiles({
                                                    ...pathSaveFiles,
                                                    classificationPath: e.detail.value!,
                                                })
                                            }
                                        />
                                    </IonItem>
                                    <IonItemDivider />
                                </IonList>
                            </IonAccordion>
                        </IonAccordionGroup>
                    </IonContent>
                </small>
                <IonButton color={'tertiary'} slot={'end'} onClick={() => void handleLoadImageAction()}>
                    Save!
                </IonButton>
            </IonPopover>
            {/* Load Button */}
            <IonItem button onClick={(e) => setShowPopover({ open: true, event: e.nativeEvent })}>
                {name}
            </IonItem>
            {/*Error window*/}
            <ErrorWindowComp
                errorMsg={errorMsg}
                headerMsg={headerErrorMsg}
                onErrorMsg={handleErrorMsg}
                errorFlag={showErrorWindow}
                onErrorFlag={handleErrorWindow}
            />
            {/*Toast component*/}
            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMsg}
                icon={information}
                duration={toastTime}
            />
            {/*Loading component*/}
            <LoadingComponent openLoadingWindow={openLoadingMenu} loadingText={'Saving the files'} />
        </>
    );
};

export default FileSaveDialog;
