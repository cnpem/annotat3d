import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Line } from 'react-chartjs-2';

const HistogramPortal: React.FC<{ histogramData: any; histogramOptions: any; containerId: string }> = ({
    histogramData,
    histogramOptions,
    containerId,
}) => {
    const containerRef = useRef(document.getElementById(containerId));

    useEffect(() => {
        containerRef.current = document.getElementById(containerId);
    }, [containerId]);

    return containerRef.current
        ? createPortal(<Line options={histogramOptions} data={histogramData} />, containerRef.current)
        : null;
};

export default HistogramPortal;
