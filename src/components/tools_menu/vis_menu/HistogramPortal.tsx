import React, { useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { createPortal } from 'react-dom';

const HistogramPortal: React.FC<{ containerId: string; histogramData: any; histogramOptions: any }> = ({
    containerId,
    histogramData,
    histogramOptions,
}) => {
    const containerRef = useRef(document.getElementById(containerId));
    const [annotations, setAnnotations] = useState<any[]>([]);

    useEffect(() => {
        containerRef.current = document.getElementById(containerId);
    }, [containerId]);

    useEffect(() => {
        const handleAddVerticalLine = (event: CustomEvent) => {
            const { value } = event.detail;
            const newAnnotation = {
                type: 'line',
                mode: 'vertical',
                scaleID: 'x-axis-0',
                value,
                borderColor: 'red',
                borderWidth: 2,
            };
            setAnnotations([newAnnotation]);
        };

        window.addEventListener('addVerticalLine', handleAddVerticalLine);

        return () => {
            window.removeEventListener('addVerticalLine', handleAddVerticalLine);
        };
    }, []);

    const updatedOptions = {
        ...histogramOptions,
        plugins: {
            ...histogramOptions.plugins,
            annotation: {
                annotations,
            },
        },
    };

    return containerRef.current
        ? createPortal(<Line options={updatedOptions} data={histogramData} />, containerRef.current)
        : null;
};

export default HistogramPortal;
