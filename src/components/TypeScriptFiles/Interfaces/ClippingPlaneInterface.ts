/**
 *
 */

/**
 * Interface component with the respective variable and setter
 */
export interface ToolbarCompClip{
    numberVal: number; onNumberVal: (val: number) => void;
    sliceAxis: string; onSliceAxis: (slice: string) => void;
    presentVal: string; onPresentVal: (presentVal: string) => void;
    titleName: string;
}