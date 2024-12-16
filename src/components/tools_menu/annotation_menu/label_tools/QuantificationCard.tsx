import React, { useState, useEffect } from 'react';
import {
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonRadioGroup,
    IonRadio,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    IonSelect,
    IonSelectOption,
} from '@ionic/react';
import { sfetch } from '../../../../utils/simplerequest';

interface QuantificationCardProps {
    isVisible: boolean;
}

const QuantificationCard: React.FC<QuantificationCardProps> = ({ isVisible }) => {
    const [labelsInput, setLabelsInput] = useState<string>('');
    const [dimension, setDimension] = useState<'2D' | '3D'>('2D');
    const [metricsData, setMetricsData] = useState<any[]>([]);
    const [adjustedMetricsData, setAdjustedMetricsData] = useState<any[]>([]);
    const [pixelSize, setPixelSize] = useState<number>(1); // Default pixel size
    const [unit, setUnit] = useState<'μm' | 'mm' | 'cm'>('μm'); // Default unit
    const [loadingMsg, setLoadingMsg] = useState<string>('');
    const [showLoadingCompPS, setShowLoadingCompPS] = useState<boolean>(false);
    const [markerID, setMarkerId] = useState<number>(-1);
    const sliceValue = parseInt(sessionStorage.getItem('sliceValue') || '0', 10);
    const sliceName = JSON.parse(sessionStorage.getItem('sliceName') || '"XY"');

    const handleInputChange = (event: CustomEvent) => {
        const value = (event.target as HTMLInputElement).value ?? '';
        setLabelsInput(value);
    };

    const handleDimensionChange = (value: '2D' | '3D') => {
        setDimension(value);
    };

    const handlePixelSizeChange = (value: string | null) => {
        if (value !== null) {
            const numericValue = parseFloat(value);
            if (!isNaN(numericValue) && numericValue > 0) {
                setPixelSize(numericValue);
            }
        }
    };

    const handleUnitChange = (selectedUnit: 'μm' | 'mm' | 'cm') => {
        setUnit(selectedUnit);
    };

    const applyPixelSizeAdjustment = () => {
        const adjustedData = metricsData.map((data) => {
            const pixelArea = pixelSize * pixelSize;
            const pixelVolume = pixelArea * pixelSize;

            return {
                ...data,
                perimeter: data.perimeter * pixelSize,
                area: data.area * pixelArea,
                surface_area: data.surface_area * pixelArea,
                volume: data.volume * pixelVolume,
            };
        });
        setAdjustedMetricsData(adjustedData);
    };

    const getLabelNameById = (id: number): string => {
        try {
            const labelListJSON = sessionStorage.getItem('labelList');
            if (!labelListJSON) return `Label ${id}`;

            // Parse the JSON string to an object
            const labelList = JSON.parse(labelListJSON);

            // Find the label by ID and return its name
            const labelItem = labelList.find((item: { id: number }) => item.id === id);
            return labelItem ? labelItem.labelName : `Label ${id}`;
        } catch (error) {
            console.error('Error parsing labelList from sessionStorage:', error);
            return `Label ${id}`;
        }
    };

    const computeMetrics = () => {
        const labels = labelsInput.split(',').map((label) => label.trim());
        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);
        const payload = {
            labels,
            dimension,
            current_thresh_marker: markerID,
            current_slice: sliceValue,
            current_axis: sliceName,
            label: selectedLabel,
            metrics: metricsData,
        };

        setLoadingMsg('Computing metrics...');
        setShowLoadingCompPS(true);

        sfetch('POST', `/quantification_apply/image`, JSON.stringify(payload), 'json')
            .then((response) => {
                if (Array.isArray(response.data) && response.data.length > 0) {
                    setMetricsData(response.data);
                } else {
                    console.warn('Invalid response data:', response.data);
                }
            })
            .catch((error) => {
                console.error('Error computing metrics:', error);
            })
            .finally(() => {
                setShowLoadingCompPS(false);
                setLoadingMsg('');
            });
    };

    useEffect(() => {
        if (labelsInput) {
            const labels = labelsInput.split(',').map((label) => label.trim());
            const initialMetrics = labels.map((label) => ({
                label,
                dimension,
                perimeter: 0,
                area: 0,
                surface_area: 0, // For 3D case
                volume: 0, // For 3D case
            }));
            setMetricsData(initialMetrics);
        }
    }, [labelsInput, dimension]);

    useEffect(() => {
        applyPixelSizeAdjustment();
    }, [metricsData, pixelSize]);

    if (!isVisible) {
        return null;
    }

    return (
        <IonCard>
            <IonCardContent>
                <IonList>
                    <IonItem>
                        <IonRadioGroup
                            value={dimension}
                            onIonChange={(e) => handleDimensionChange(e.detail.value)}
                            style={{ width: '100%' }}
                        >
                            <IonGrid>
                                <IonRow class="ion-justify-content-center ion-align-items-center">
                                    <IonCol size="auto">
                                        <IonItem lines="none">
                                            <IonRadio slot="start" value="2D" />
                                            <IonLabel>Annotation (2D)</IonLabel>
                                        </IonItem>
                                    </IonCol>
                                    <IonCol size="auto">
                                        <IonItem lines="none">
                                            <IonRadio slot="start" value="3D" />
                                            <IonLabel>Label (3D)</IonLabel>
                                        </IonItem>
                                    </IonCol>
                                </IonRow>
                            </IonGrid>
                        </IonRadioGroup>
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Pixel Size</IonLabel>
                        <IonInput
                            type="number"
                            value={pixelSize}
                            onIonChange={(e) => handlePixelSizeChange(e.detail.value!)}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Units</IonLabel>
                        <IonSelect
                            value={unit}
                            placeholder="Select Unit"
                            onIonChange={(e) => handleUnitChange(e.detail.value)}
                        >
                            <IonSelectOption value="μm">Micrometers (μm)</IonSelectOption>
                            <IonSelectOption value="mm">Millimeters (mm)</IonSelectOption>
                            <IonSelectOption value="cm">Centimeters (cm)</IonSelectOption>
                        </IonSelect>
                    </IonItem>
                </IonList>
                <IonButton expand="block" onClick={computeMetrics}>
                    Compute Metrics
                </IonButton>

                {showLoadingCompPS && <p>{loadingMsg}</p>}

                {adjustedMetricsData.length > 0 && (
                    <div
                        className="table-container"
                        style={{
                            marginTop: '20px',
                            padding: '20px',
                            overflowX: 'auto',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '8px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <table
                            className="metrics-table"
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                textAlign: 'left',
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                overflow: 'hidden',
                            }}
                        >
                            <thead>
                                <tr style={{ backgroundColor: '#007bff', color: '#ffffff', textAlign: 'center' }}>
                                    <th style={{ padding: '12px 15px', border: '1px solid #ddd' }}>Label</th>
                                    {dimension === '2D' && (
                                        <>
                                            <th style={{ padding: '12px 15px', border: '1px solid #ddd' }}>
                                                Perimeter ({unit})
                                            </th>
                                            <th style={{ padding: '12px 15px', border: '1px solid #ddd' }}>
                                                Area ({unit}²)
                                            </th>
                                        </>
                                    )}
                                    {dimension === '3D' && (
                                        <>
                                            <th style={{ padding: '12px 15px', border: '1px solid #ddd' }}>
                                                Surface Area ({unit}²)
                                            </th>
                                            <th style={{ padding: '12px 15px', border: '1px solid #ddd' }}>
                                                Volume ({unit}³)
                                            </th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {adjustedMetricsData.map((data, index) => (
                                    <tr
                                        key={index}
                                        style={{
                                            backgroundColor: index % 2 === 0 ? '#f2f2f2' : '#ffffff',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <td style={{ padding: '12px 15px', border: '1px solid #ddd' }}>
                                            {getLabelNameById(Number(data.label))}
                                        </td>
                                        {dimension === '2D' && (
                                            <>
                                                <td style={{ padding: '12px 15px', border: '1px solid #ddd' }}>
                                                    {data.perimeter}
                                                </td>
                                                <td style={{ padding: '12px 15px', border: '1px solid #ddd' }}>
                                                    {data.area}
                                                </td>
                                            </>
                                        )}
                                        {dimension === '3D' && (
                                            <>
                                                <td style={{ padding: '12px 15px', border: '1px solid #ddd' }}>
                                                    {data.surface_area}
                                                </td>
                                                <td style={{ padding: '12px 15px', border: '1px solid #ddd' }}>
                                                    {data.volume}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {metricsData.length === 0 && !showLoadingCompPS && <p>No data available or failed to fetch metrics.</p>}
            </IonCardContent>
        </IonCard>
    );
};

export default QuantificationCard;
