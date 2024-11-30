import React, { useState } from 'react';
import { IonList, IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import NiblackThreshold from './NiblackThreshold';
import SauvolaThreshold from './SauvolaThreshold';
import LocalGaussianThreshold from './LocalGaussianThreshold';
import LocalMeanThreshold from './LocalMeanThreshold';
import { HistogramInfoPayload } from '../../../../../../components/main_menu/file/utils/HistogramInfoInterface';
import { sfetch } from '../../../../../../utils/simplerequest';
import { dispatch } from '../../../../../../utils/eventbus';

import LoadingComponent from '../../../../utils/LoadingComponent';

const LocalThreshold: React.FC<{ onSubOptionSelect: (option: number) => void }> = ({ onSubOptionSelect }) => {
    const [selectedSubOption, setSelectedSubOption] = useState<number | null>(null);
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingCompPS, setShowLoadingCompPS] = useState<boolean>(false);
    const [markerID, setMarkerId] = useState<number>(-1);
    const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10);
    const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"');

    // Example default values for props
    const [convolutionType, setConvolutionType] = useState<string>('2d');
    const [kernelSize, setKernelSize] = useState(3);
    const [Sigma, setSigma] = useState(3);
    const [Range, setRange] = useState(1);
    const [Weight, setWeight] = useState(0);
    const [Threshold, setThreshold] = useState(0); // Add state for Threshold
    const showToast = (message: string, duration: number) => {
        console.log(`${message} (shown for ${duration}ms)`);
    };
    const timeToast = 3000;

    const thresholdOptions = [
        { value: 1, label: 'Niblack' },
        { value: 2, label: 'Sauvola' },
        { value: 3, label: 'Local Gaussian' },
        { value: 4, label: 'Local Mean' },
    ];

    const handleSubOptionChange = (value: number) => {
        setSelectedSubOption(value);
        onSubOptionSelect(value);
    };

    // Handle Apply for Sauvola Threshold
    const handleApplySauvola = () => {
        if (kernelSize < 3 || Range <= 0 || Weight < 0) {
            showToast(
                'Invalid kernel size, range, or weight. Ensure Kernel >= 3, Range > 0, and Weight >= 0.',
                timeToast
            );
            return;
        }

        setLoadingMsg('Applying Sauvola threshold');
        setShowLoadingCompPS(true);

        console.log('Applying Sauvola threshold with values:', { kernelSize, Range, Weight });

        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);
        const dataThreshold = {
            Kernel: kernelSize,
            Range,
            Weight,
            convolutionType,
            curret_thresh_marker: markerID,
            label: selectedLabel,
            current_slice: sliceValue,
            current_axis: sliceName,
        };

        void sfetch('POST', '/sauvola_apply/image', JSON.stringify(dataThreshold), 'json')
            .then((backendMarkerID) => {
                console.log('Sauvola threshold applied successfully');
                setMarkerId(backendMarkerID);
                dispatch('annotationChanged', null);
                setShowLoadingCompPS(false);
            })
            .catch((error) => {
                console.log('Error applying Sauvola threshold', error);
                setShowLoadingCompPS(false);
            });
    };

    // Handle Apply for Local Gaussian Threshold
    const handleApplyLocalGaussian = () => {
        if (Sigma <= 0 || Threshold < 0) {
            showToast('Invalid Sigma or Threshold. Ensure Sigma > 0 and Threshold >= 0.', timeToast);
            return;
        }

        setLoadingMsg('Applying Local Gaussian threshold');
        setShowLoadingCompPS(true);

        console.log('Applying Local Gaussian threshold with values:', { Sigma, Threshold });

        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);
        const dataThreshold = {
            Sigma,
            Threshold,
            convolutionType,
            curret_thresh_marker: markerID,
            label: selectedLabel,
            current_slice: sliceValue,
            current_axis: sliceName,
        };

        void sfetch('POST', '/local_gaussian_apply/image', JSON.stringify(dataThreshold), 'json')
            .then((backendMarkerID) => {
                console.log('Local Gaussian threshold applied successfully');
                setMarkerId(backendMarkerID);
                dispatch('annotationChanged', null);
                setShowLoadingCompPS(false);
            })
            .catch((error) => {
                console.log('Error applying Local Gaussian threshold', error);
                setShowLoadingCompPS(false);
            });
    };

    // Handle Apply for Local Mean Threshold
    const handleApplyLocalMean = () => {
        if (kernelSize < 3 || Threshold < 0) {
            showToast('Invalid kernel size or threshold. Ensure Kernel >= 3 and Threshold >= 0.', timeToast);
            return;
        }

        setLoadingMsg('Applying Local Mean threshold');
        setShowLoadingCompPS(true);

        console.log('Applying Local Mean threshold with values:', { kernelSize, Threshold });

        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);
        const dataThreshold = {
            Kernel: kernelSize,
            Threshold,
            convolutionType,
            curret_thresh_marker: markerID,
            label: selectedLabel,
            current_slice: sliceValue,
            current_axis: sliceName,
        };

        void sfetch('POST', '/local_mean_apply/image', JSON.stringify(dataThreshold), 'json')
            .then((backendMarkerID) => {
                console.log('Local Mean threshold applied successfully');
                setMarkerId(backendMarkerID);
                dispatch('annotationChanged', null);
                setShowLoadingCompPS(false);
            })
            .catch((error) => {
                console.log('Error applying Local Mean threshold', error);
                setShowLoadingCompPS(false);
            });
    };

    // Define handleApply3D for NiblackThreshold
    const handleApplyNiblack = () => {
        if (kernelSize < 3 || Weight < 0) {
            showToast('Invalid kernel size or weight. Ensure Kernel >= 3 and Weight >= 0.', timeToast);
            return;
        }

        setLoadingMsg('Applying 3D threshold');
        setShowLoadingCompPS(true);

        console.log('Applying 3D threshold with values:', { kernelSize, Weight });

        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);
        const dataThreshold = {
            Kernel: kernelSize,
            Weight,
            convolutionType, // Make sure this is passed to backend
            curret_thresh_marker: markerID,
            label: selectedLabel,
            current_slice: sliceValue,
            current_axis: sliceName,
        };

        void sfetch('POST', '/niblack_apply/image', JSON.stringify(dataThreshold), 'json')
            .then((backendMarkerID) => {
                console.log('Threshold applied successfully');
                setMarkerId(backendMarkerID); // Update markerID with the response
                dispatch('annotationChanged', null); // Notify the app to update
                setShowLoadingCompPS(false);
            })
            .catch((error) => {
                console.log('Error applying threshold', error);
                setShowLoadingCompPS(false);
            });
    };

    // Define the handlePreviewNiblack function
    const handlePreviewNiblack = () => {
        if (kernelSize < 3 || Weight < 0) {
            showToast('Invalid kernel size or weight for preview. Ensure Kernel >= 3 and Weight >= 0.', timeToast);
            return;
        }

        setLoadingMsg('Previewing 3D threshold');
        setShowLoadingCompPS(true);

        console.log('Previewing 3D threshold with values:', { kernelSize, Weight });

        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);
        const dataThreshold = {
            Kernel: kernelSize,
            Weight,
            curret_thresh_marker: markerID,
            label: selectedLabel,
            current_slice: sliceValue,
            current_axis: sliceName,
        };

        void sfetch('POST', '/niblack_preview/image', JSON.stringify(dataThreshold), 'json')
            .then((previewData) => {
                console.log('Threshold preview successful');
                setShowLoadingCompPS(false);
                // Here, you can use previewData to show a preview image or process it further.
            })
            .catch((error) => {
                console.log('Error previewing threshold', error);
                setShowLoadingCompPS(false);
            });
    };

    const renderSubComponent = () => {
        switch (selectedSubOption) {
            case 1:
                return (
                    <NiblackThreshold
                        Kernel={kernelSize}
                        setKernelSize={setKernelSize}
                        Weight={Weight}
                        setWeight={setWeight}
                        ConvolutionType={convolutionType} // Add this prop
                        setConvolutionType={setConvolutionType} // Add this prop
                        showToast={showToast}
                        timeToast={timeToast}
                        handleApplyNiblack={handleApplyNiblack}
                        handlePreviewNiblack={handlePreviewNiblack}
                    />
                );
            case 2:
                return (
                    <SauvolaThreshold
                        Kernel={kernelSize}
                        setKernelSize={setKernelSize}
                        showToast={showToast}
                        timeToast={timeToast}
                        Weight={Weight}
                        setWeight={setWeight}
                        Range={Range}
                        setRange={setRange}
                        ConvolutionType={convolutionType}
                        setConvolutionType={setConvolutionType}
                        handleApplySauvola={handleApplySauvola} // Pass handleApplySauvola
                    />
                );
            case 3:
                return (
                    <LocalGaussianThreshold
                        Sigma={Sigma}
                        setSigma={setSigma}
                        showToast={showToast}
                        timeToast={timeToast}
                        Threshold={Threshold}
                        setThreshold={setThreshold}
                        ConvolutionType={convolutionType}
                        setConvolutionType={setConvolutionType}
                        handleApplyLocalGaussian={handleApplyLocalGaussian} // Pass handleApplyLocalGaussian
                    />
                );
            case 4:
                return (
                    <LocalMeanThreshold
                        Kernel={kernelSize}
                        setKernelSize={setKernelSize}
                        showToast={showToast}
                        timeToast={timeToast}
                        Threshold={Threshold}
                        setThreshold={setThreshold}
                        ConvolutionType={convolutionType}
                        setConvolutionType={setConvolutionType}
                        handleApplyLocalMean={handleApplyLocalMean} // Pass handleApplyLocalMean
                    />
                );
            default:
                return null;
        }
    };

    return (
        <IonList>
            <IonItem>
                <IonLabel>Local Threshold Method</IonLabel>
                <IonSelect
                    aria-label="Local Threshold Method"
                    interface="popover"
                    placeholder="Select Method"
                    value={selectedSubOption}
                    onIonChange={(e) => handleSubOptionChange(e.detail.value)}
                >
                    {thresholdOptions.map((option) => (
                        <IonSelectOption key={option.value} value={option.value}>
                            {option.label}
                        </IonSelectOption>
                    ))}
                </IonSelect>
            </IonItem>
            {renderSubComponent()}
        </IonList>
    );
};

export default LocalThreshold;
