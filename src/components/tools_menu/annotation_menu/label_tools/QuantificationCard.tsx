/* eslint-disable @typescript-eslint/no-misused-promises */
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
} from '@ionic/react';
import { sfetch } from '../../../../utils/simplerequest';

interface QuantificationCardProps {
    isVisible: boolean;
}

const QuantificationCard: React.FC<QuantificationCardProps> = ({ isVisible }) => {
    const [labelsInput, setLabelsInput] = useState<string>('');
    const [dimension, setDimension] = useState<'2D' | '3D'>('2D');
    const [metricsData, setMetricsData] = useState<any[]>([]);
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

    const computeMetrics = async () => {
        const labels = labelsInput.split(',').map((label) => label.trim());
        const selectedLabel = parseInt(sessionStorage.getItem('selectedLabel') || '0', 10);
        const payload = {
            labels,
            dimension,
            current_thresh_marker: markerID,
            current_slice: sliceValue,
            current_axis: sliceName,
            label: selectedLabel,
            metrics: metricsData, // This may be unnecessary or adjusted if the metrics should be sent
        };

        setLoadingMsg('Computing metrics...');
        setShowLoadingCompPS(true);

        try {
            const response = await sfetch('POST', `/quantification_apply/image`, JSON.stringify(payload), 'json');
            if (Array.isArray(response.data) && response.data.length > 0) {
                setMetricsData(response.data);
            } else {
                console.warn('Invalid response data:', response.data);
            }
        } catch (error) {
            console.error('Error computing metrics:', error);
        } finally {
            setShowLoadingCompPS(false);
            setLoadingMsg('');
        }
    };

    useEffect(() => {
        if (labelsInput) {
            const labels = labelsInput.split(',').map((label) => label.trim());
            if (metricsData.length === 0) {
                const initialMetrics = labels.map((label) => ({
                    label,
                    dimension,
                    perimeter: 0,
                    area: 0,
                    surfaceArea: 0, // For 3D case
                    volume: 0, // For 3D case
                }));
                setMetricsData(initialMetrics);
            }
        }
    }, [labelsInput, dimension]);

    useEffect(() => {
        console.log('Updated metricsData:', metricsData);
    }, [metricsData]);

    useEffect(() => {
        if (labelsInput) {
            const labels = labelsInput.split(',').map((label) => label.trim());
            const initialMetrics = labels.map((label) => ({
                label,
                dimension,
                perimeter: 0,
                area: 0,
                surfaceArea: 0, // For 3D case
                volume: 0, // For 3D case
            }));
            setMetricsData(initialMetrics);
        }
    }, [labelsInput, dimension]);

    if (!isVisible) {
        return null;
    }

    return (
        <IonCard>
            <IonCardContent>
                <IonList>
                    <IonItem>
                        <IonLabel>Dimension</IonLabel>
                        <IonRadioGroup value={dimension} onIonChange={(e) => handleDimensionChange(e.detail.value)}>
                            <IonGrid>
                                <IonRow>
                                    <IonCol>
                                        <IonItem lines="none">
                                            <IonLabel>2D</IonLabel>
                                            <IonRadio value="2D" />
                                        </IonItem>
                                    </IonCol>
                                    <IonCol>
                                        <IonItem lines="none">
                                            <IonLabel>3D</IonLabel>
                                            <IonRadio value="3D" />
                                        </IonItem>
                                    </IonCol>
                                </IonRow>
                            </IonGrid>
                        </IonRadioGroup>
                    </IonItem>
                </IonList>
                <IonButton expand="block" onClick={computeMetrics}>
                    Compute Metrics
                </IonButton>

                {showLoadingCompPS && <p>{loadingMsg}</p>}

                {metricsData.length > 0 && (
                    <div className="table-container" style={{ marginTop: '20px', padding: '20px', overflowX: 'auto' }}>
                        <table
                            className="metrics-table"
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                marginTop: '20px',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            border: '1px solid #ddd',
                                            padding: '12px 15px',
                                            textAlign: 'center',
                                            backgroundColor: '',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Label
                                    </th>
                                    <th
                                        style={{
                                            border: '1px solid #ddd',
                                            padding: '12px 15px',
                                            textAlign: 'center',
                                            backgroundColor: '',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Dimension
                                    </th>
                                    {dimension === '2D' && (
                                        <>
                                            <th
                                                style={{
                                                    border: '1px solid #ddd',
                                                    padding: '12px 15px',
                                                    textAlign: 'center',
                                                    backgroundColor: '',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                Perimeter
                                            </th>
                                            <th
                                                style={{
                                                    border: '1px solid #ddd',
                                                    padding: '12px 15px',
                                                    textAlign: 'center',
                                                    backgroundColor: '',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                Area
                                            </th>
                                        </>
                                    )}
                                    {dimension === '3D' && (
                                        <>
                                            <th
                                                style={{
                                                    border: '1px solid #ddd',
                                                    padding: '12px 15px',
                                                    textAlign: 'center',
                                                    backgroundColor: '',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                Surface Area
                                            </th>
                                            <th
                                                style={{
                                                    border: '1px solid #ddd',
                                                    padding: '12px 15px',
                                                    textAlign: 'center',
                                                    backgroundColor: '',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                Volume
                                            </th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {metricsData.map((data, index) => (
                                    <tr key={index}>
                                        <td
                                            style={{
                                                border: '1px solid #ddd',
                                                padding: '12px 15px',
                                                textAlign: 'center',
                                                backgroundColor: '',
                                            }}
                                        >
                                            {data.label}
                                        </td>
                                        <td
                                            style={{
                                                border: '1px solid #ddd',
                                                padding: '12px 15px',
                                                textAlign: 'center',
                                                backgroundColor: '',
                                            }}
                                        >
                                            {data.dimension}
                                        </td>
                                        {dimension === '2D' && (
                                            <>
                                                <td
                                                    style={{
                                                        border: '1px solid #ddd',
                                                        padding: '12px 15px',
                                                        textAlign: 'center',
                                                        backgroundColor: '',
                                                    }}
                                                >
                                                    {data.perimeter}
                                                </td>
                                                <td
                                                    style={{
                                                        border: '1px solid #ddd',
                                                        padding: '12px 15px',
                                                        textAlign: 'center',
                                                        backgroundColor: '',
                                                    }}
                                                >
                                                    {data.area}
                                                </td>
                                            </>
                                        )}
                                        {dimension === '3D' && (
                                            <>
                                                <td
                                                    style={{
                                                        border: '1px solid #ddd',
                                                        padding: '12px 15px',
                                                        textAlign: 'center',
                                                        backgroundColor: '',
                                                    }}
                                                >
                                                    {data.surface_area}
                                                </td>
                                                <td
                                                    style={{
                                                        border: '1px solid #ddd',
                                                        padding: '12px 15px',
                                                        textAlign: 'center',
                                                        backgroundColor: '',
                                                    }}
                                                >
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
