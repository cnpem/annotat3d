import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(annotationPlugin);

interface HistogramProps {
    histogramData: any;
    histogramOptions: any;
    verticalLine1Position: number;
    verticalLine2Position: number;
}

const ThresholdHistogram: React.FC<HistogramProps> = ({ histogramData, histogramOptions, verticalLine1Position, verticalLine2Position }) => {

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
    const label1Index = getClosestLabelIndex(histogramData.labels, verticalLine1Position);
    const label2Index = getClosestLabelIndex(histogramData.labels, verticalLine2Position);

    // Merge the vertical line annotation with existing options
    const optionsWithAnnotation = {
        ...histogramOptions,
        plugins: {
            ...histogramOptions.plugins,
            annotation: {
                annotations: {
                    verticalLine1: {
                        type: 'line',
                        xMin: label1Index,
                        xMax: label1Index,
                        borderColor: 'red',
                        borderWidth: 2,
                    },
                    verticalLine2: {
                        type: 'line',
                        xMin: label2Index,
                        xMax: label2Index,
                        borderColor: 'red',
                        borderWidth: 2,
                    },
                },
            },
        },
    };

    return <Line options={optionsWithAnnotation} data={histogramData} />;
};

export default ThresholdHistogram;
