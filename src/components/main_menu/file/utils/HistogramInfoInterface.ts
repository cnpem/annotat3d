/**
 * Interface for the histogram info
 */

export interface HistogramInfoPayload {
    data: number[];
    bins: number[];
    maxValue: number;
    minValue: number;
    otsu: number;
    dataType: string;
}
