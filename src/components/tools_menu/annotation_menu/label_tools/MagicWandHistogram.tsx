import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(annotationPlugin);

interface HistogramProps {
    histogramData: any;
    histogramOptions: any;
    verticalLinePosition: number;
}

const MagicWandHistogram: React.FC<HistogramProps> = ({ histogramData, histogramOptions, verticalLinePosition }) => {
    // Function to find the closest label index using binary search
    const getClosestLabelIndex = (labels: number[], position: number) => {
        let left = 0;
        let right = labels.length - 1;

        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (labels[mid] < position) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        // Check if left is the closest index
        if (left > 0 && Math.abs(labels[left] - position) >= Math.abs(labels[left - 1] - position)) {
            return left - 1;
        }
        return left;
    };

    // Find the index of the closest label to the verticalLinePosition
    const labelIndex = getClosestLabelIndex(histogramData.labels, verticalLinePosition);

    // Merge the vertical line annotation with existing options
    const optionsWithAnnotation = {
        ...histogramOptions,
        plugins: {
            ...histogramOptions.plugins,
            annotation: {
                annotations: {
                    verticalLine: {
                        type: 'line',
                        xMin: labelIndex,
                        xMax: labelIndex,
                        borderColor: 'red',
                        borderWidth: 2,
                    },
                },
            },
        },
    };

    return <Line options={optionsWithAnnotation} data={histogramData} />;
};

export default MagicWandHistogram;
