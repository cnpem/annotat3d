/* eslint-disable @typescript-eslint/no-floating-promises */
import { Component } from 'react';
import { IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { expand, brush, browsers, add, remove, eye, eyeOff, colorFill, colorWand, eyedrop } from 'ionicons/icons';
import isEqual from 'lodash.isequal';
import debounce from 'lodash.debounce';
import * as PIXI from 'pixi.js';
//warning: this pixi.js version is modified to use a custom loader on webgl with gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
// https://stackoverflow.com/questions/42789896/webgl-error-arraybuffer-not-big-enough-for-request-in-case-of-gl-luminance
// this fix is on the import on utils/pixibufferloader
import '../../utils/pixibufferloader';
import * as pixi_viewport from 'pixi-viewport';
import colormap from 'colormap';

import { NdArray, TypedArray } from 'ndarray';
import { clamp } from '../../utils/math';
import { sfetch } from '../../utils/simplerequest';
import { HistogramInfoPayload } from '../../components/main_menu/file/utils/HistogramInfoInterface';

import '../../styles/CanvasContainer.css';
import MenuFabButton from './MenuFabButton';
import { dispatch, subscribe, unsubscribe } from '../../utils/eventbus';
import { CropAxisInterface, CropShapeInterface } from '../tools_menu/utils/CropInterface';
import { ImageShapeInterface } from '../tools_menu/utils/ImageShapeInterface';
import { ImageInfoInterface } from '../main_menu/file/utils/ImageInfoInterface';
import { ColorOptions } from '../../utils/colormaplist';
import fillCursor from '../../public/fill_cursor.png';
import lassoCursor from '../../public/lasso_cursor.png';
import snakesCursor from '../../public/snakes_cursor.png';
import eraserIcon from '../../public/eraser_icon.svg';
import eraserCursor from '../../public/eraser.png';
import brushCursor from '../../public/ion_brush.png';
import dropperCursor from '../../public/dropper_cursor.png';

import { LabelInterface } from '../tools_menu/annotation_menu/label_table/LabelInterface';
import { colorFromId, defaultColormap } from '../../utils/colormap';

type BrushModeType = 'draw_brush' | 'erase_brush' | 'no_brush' | 'magic_wand' | 'lasso' | 'snakes' | 'dropper_brush';

class Brush {
    label: number;

    size = 0;

    color: number;

    radius = 0;

    mode: BrushModeType = 'draw_brush';

    canvas: HTMLCanvasElement;

    context: CanvasRenderingContext2D;

    cursor: PIXI.Graphics;

    colors: Array<[number, number, number]>;

    constructor(colors: [number, number, number][]) {
        this.label = 0;
        this.color = 0xffffff;

        this.canvas = document.createElement('canvas');

        this.context = this.canvas.getContext('2d')!;

        this.colors = colors;

        this.cursor = this.createBrush();

        this.setSize(5);

        this.update();
    }

    setMode(mode: BrushModeType) {
        console.log('set mode: ', mode);
        this.mode = mode;
        this.update();
    }

    private updateDropperCursor() {
        const gr = this.cursor;
        gr.clear();
        gr.lineStyle(2, 0x000000, 0.8);
        gr.moveTo(0, 0);
        gr.lineTo(this.size, this.size);
        gr.moveTo(this.size, 0);
        gr.lineTo(0, this.size);
        gr.endFill();
    }

    private updateBrush() {
        const gr = this.cursor;
        gr.clear();
        gr.beginFill(this.color);
        gr.drawCircle(this.size / 2, this.size / 2, this.radius);
        gr.endFill();
        console.log(this.color);
    }

    private createBrush() {
        const cursor = new PIXI.Graphics();
        cursor.alpha = 0.5;
        return cursor;
    }

    contextDrawBrush(context: CanvasRenderingContext2D, x: number, y: number) {
        const [r, g, b] = this.colors[this.label % this.colors.length];
        context.beginPath();
        context.fillStyle = `rgb(${r},${g},${b}, 1)`;
        // needs to add 0.5 to center the drawing in the center of the pixel square
        context.arc(x + 0.5, y + 0.5, this.radius, 0, 2 * Math.PI);
        context.fill();
    }

    setLabel(l: number) {
        this.label = l;
        this.update();
        this.updateColor();
    }

    setSize(s: number) {
        this.size = s;

        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.radius = s / 2;

        this.update();
    }

    updateColor() {
        const color = this.colors[this.label % this.colors.length];
        console.log('color type : ', color);
        this.color = this.rgbToHex(...color);
    }

    private rgbToHex(r: number, g: number, b: number) {
        const bin = (r << 16) | (g << 8) | b;
        return bin;
    }

    update() {
        if (this.mode === 'draw_brush') {
            const color = this.colors[this.label % this.colors.length];
            this.color = this.rgbToHex(...color);
            this.cursor.visible = true;
        } else if (this.mode === 'erase_brush') {
            this.color = 0xffffff;
            this.cursor.visible = true;
        } else if (this.mode === 'dropper_brush') {
            const color = this.colors[this.label % this.colors.length];
            this.color = this.rgbToHex(...color);
            this.cursor.visible = true;
            this.updateDropperCursor();
        } else {
            this.cursor.visible = false;
        }
        this.updateBrush();
    }
}

class Lasso {
    color: number;

    canvas: HTMLCanvasElement;

    context: CanvasRenderingContext2D;

    points: PIXI.Point[];

    tempLine: PIXI.Graphics;

    constructor() {
        this.color = 0xffffff; // Default color (can be updated)
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d')!;
        this.points = [];
        this.tempLine = new PIXI.Graphics();
    }

    // Start the lasso by setting the initial point and activating drawing mode
    startLasso(x: number, y: number, color: number, context: CanvasRenderingContext2D) {
        console.log('Lasso drawing', color, x, y);
        this.color = color;
        this.context = context;
        this.points = [new PIXI.Point(x, y)];
    }

    // Add points to draw the straight lines between them
    addPoint(x: number, y: number, context: CanvasRenderingContext2D) {
        const lastPoint = this.points[this.points.length - 1];
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(x, y);
        context.strokeStyle = this.hexColor(this.color);
        context.lineWidth = 2;
        context.stroke();
        this.points.push(new PIXI.Point(x, y));
    }

    // Finalize the lasso and fill the area inside
    endLasso(context: CanvasRenderingContext2D, label: number, sliceNum: number, Currentaxis: string) {
        console.log('Lasso endLasso');
        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);
        console.log(this.points);
        const lassoData = { lasso_points: this.points, slice_num: sliceNum, axis: Currentaxis, label };
        sfetch('POST', '/apply_lasso/annotation', JSON.stringify(lassoData), 'json')
            .then(() => {
                dispatch('annotationChanged', null);
            })
            .catch((error) => {
                console.log('Error while applying lasso');
                console.log(error.error_msg);
            });

        /* // Connect the last point to the first point
        for (let i = 1; i < this.points.length; i++) {
            this.context.lineTo(this.points[i].x, this.points[i].y);
        }
        context.closePath();
        context.fillStyle = this.hexColor(this.color);
        context.fill(); */
    }

    private hexColor(color: number) {
        return `#${color.toString(16).padStart(6, '0')}`;
    }

    drawTempLine(currentX: number, currentY: number) {
        if (this.points.length > 0) {
            const startPoint = this.points[0];
            this.tempLine.clear();
            this.tempLine.lineStyle(2, this.color, 1);
            this.tempLine.moveTo(startPoint.x, startPoint.y);
            this.tempLine.lineTo(currentX, currentY);
        }
    }

    clearTempLine() {
        this.tempLine.clear();
    }
}

function applyMagicWand(
    viewport: pixi_viewport.Viewport,
    sliceNum: number,
    Currentaxis: string,
    brush_label: number,
    event: any
) {
    const currPositionw = viewport.toWorld(event.data.global);
    const dataWand = {
        slice: sliceNum,
        axis: Currentaxis,
        label: brush_label,
        x_coord: Math.round(currPositionw.x),
        y_coord: Math.round(currPositionw.y),
    };

    dispatch('magicwand', dataWand);
}

class ActiveContour {
    private canvas: HTMLCanvasElement;

    private context: CanvasRenderingContext2D;

    private points: PIXI.Point[] = [];

    private lastSendTime = 0;

    private debounceTime = 150; // 100ms debounce

    private radius = 3; // Fixed radius

    constructor() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d')!;
    }

    drawContour(
        x: number,
        y: number,
        label: number,
        sliceNum: number,
        axis: string,
        process: string
    ): Promise<[number[], number[]] | null> {
        // Draw locally
        this.context.beginPath();
        this.context.arc(x + 0.5, y + 0.5, this.radius, 0, 2 * Math.PI);
        this.context.fill();

        // Add the point
        this.points.push(new PIXI.Point(x, y));

        const currentTime = Date.now();

        // If debounce time has passed, send to the backend
        if (currentTime - this.lastSendTime >= this.debounceTime) {
            // Prepare parameters
            const params = {
                points: this.points,
                label,
                slice_num: sliceNum,
                axis,
                iterations: parseInt(sessionStorage.getItem('ActiveContourIterations') || '10', 10),
                smoothing: parseInt(sessionStorage.getItem('ActiveContourSmoothing') || '1', 10),
                weight: parseFloat(sessionStorage.getItem('ActiveContourWeight') || '1.0'),
                method: (sessionStorage.getItem('ActiveContourMethod') || 'chan-vese').replace(/^"|"$/g, ''), // Retrieve method from sessionStorage and sanitize
                threshold: parseFloat(sessionStorage.getItem('GeodesicThreshold') || '0.5'),
                balloon_force: sessionStorage.getItem('BalloonForce') === 'true', // Boolean stored as string
                sigma: parseFloat(sessionStorage.getItem('GeodesicSigma') || '1.0'),
            };
            // Update the last send time
            this.lastSendTime = currentTime;

            // Return the backend response as a promise
            return sfetch('POST', '/active_contour/image/' + process, JSON.stringify(params), 'json')
                .then((response) => {
                    if (response && Array.isArray(response[0]) && Array.isArray(response[1])) {
                        return response as [number[], number[]];
                    } else {
                        console.error('Invalid response format:', response);
                        return null;
                    }
                })
                .catch((error) => {
                    console.error('Error updating active contour:', error);
                    return null;
                });
        }

        // If debounce time has not passed, return null
        return Promise.resolve(null);
    }

    finalize(label: number, sliceNum: number, axis: string): void {
        if (this.points.length === 0) return; // Ensure points exist before finalizing

        // Prepare parameters
        const params = {
            points: this.points,
            label,
            slice_num: sliceNum,
            axis,
            iterations: parseInt(sessionStorage.getItem('ActiveContourIterations') || '10', 10),
            smoothing: parseInt(sessionStorage.getItem('ActiveContourSmoothing') || '1', 10),
            weight: parseFloat(sessionStorage.getItem('ActiveContourWeight') || '1.0'),
            method: (sessionStorage.getItem('ActiveContourMethod') || 'chan-vese').replace(/^"|"$/g, ''), // Retrieve method from sessionStorage and sanitize
            threshold: parseFloat(sessionStorage.getItem('GeodesicThreshold') || '0.5'),
            balloon_force: sessionStorage.getItem('BalloonForce') === 'true', // Boolean stored as string
            sigma: parseFloat(sessionStorage.getItem('GeodesicSigma') || '1.0'),
        };

        // Send finalization request to backend
        sfetch('POST', '/active_contour/image/finalize', JSON.stringify(params), 'json')
            .then((finalizeReponse) => {
                console.log('Active contour finalized:', finalizeReponse);
                this.points = []; // Clear points after successful finalization
                dispatch('annotationChanged', null); // Notify annotation changes
            })
            .catch((error) => {
                console.error('Error finalizing active contour:', error);
            });
    }

    clear(): void {
        this.points = []; // Clear stored points
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the canvas
    }
}

class Annotation {
    canvas: HTMLCanvasElement;

    context: CanvasRenderingContext2D;

    sprite: PIXI.Sprite;

    colors: [number, number, number][];

    alphas: number[];

    annotData?: NdArray<TypedArray>;

    private previousData: Uint8ClampedArray | null = null;

    private originalImageData: ImageData | null = null; // Preserve the original image data

    constructor(colors: [number, number, number][], alphas: number[]) {
        this.canvas = document.createElement('canvas');
        //this.canvas.width = 0;
        //this.canvas.height = 0;

        this.context = this.canvas.getContext('2d')!;

        this.sprite = new PIXI.Sprite();
        //this.sprite.tint = 0x00ff00;

        this.colors = colors;
        this.alphas = alphas;

        this.sprite.texture = PIXI.Texture.from(this.canvas);
    }

    setSize(x: number, y: number) {
        //avoid calling canvas resize unecessarily
        if (this.canvas.width !== x || this.canvas.height !== y) {
            this.canvas.width = x;
            this.canvas.height = y;
        }
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.sprite.texture.update();
    }

    update() {
        if (this.annotData) {
            this.draw(this.annotData);
        }
    }

    draw(slice: NdArray<TypedArray>) {
        this.annotData = slice;

        const colors = this.colors;
        const alphas = this.alphas;

        console.log('draw slice: ', slice.shape);

        this.clear();
        this.setSize(slice.shape[1], slice.shape[0]);

        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

        const data = imageData.data;

        for (let i = 0; i < slice.data.length; i++) {
            if (slice.data[i] >= 0) {
                const color = colors[slice.data[i] % colors.length];
                const alpha = alphas[slice.data[i] % alphas.length];
                data[i * 4] = color[0];
                data[i * 4 + 1] = color[1];
                data[i * 4 + 2] = color[2];
                data[i * 4 + 3] = alpha * 255;
            }
        }
        this.context.putImageData(imageData, 0, 0);
        this.sprite.texture.update();
    }

    drawOver(coords: [number[], number[]], label: number) {
        if (!this.annotData) return;

        // Get the current image data
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Update `previousData` if not already set
        if (!this.previousData) {
            console.log('initializing previous data');
            this.previousData = new Uint8ClampedArray(imageData.data); // Create a copy of the initial data
        }

        // Use existing `previousData` or initialize it
        const data = new Uint8ClampedArray(this.previousData);

        const colors = this.colors[label % this.colors.length];
        const alpha = this.alphas[label % this.alphas.length];

        // Define a helper function to set pixel data
        const setPixel = (x: number, y: number, r: number, g: number, b: number, a: number) => {
            const idx = (y * this.canvas.width + x) * 4;
            data[idx] = r; // Red
            data[idx + 1] = g; // Green
            data[idx + 2] = b; // Blue
            data[idx + 3] = a; // Alpha
        };

        // Update pixels with new coordinates
        coords[0].forEach((y, i) => {
            const x = coords[1][i];
            setPixel(x, y, colors[0], colors[1], colors[2], Math.round(alpha * 255));
        });

        // Write back the updated data to imageData
        imageData.data.set(data);

        // Apply the updated image data back to the canvas
        this.context.putImageData(imageData, 0, 0);
        this.sprite.texture.update();
    }

    resetPreviousData() {
        this.previousData = null;
        this.originalImageData = null;
        this.sprite.texture.update();
    }

    /**
     * Saves the current image state as `originalImageData`.
     * This should be called before applying any annotations or thresholding.
     */
    saveOriginalImageData() {
        this.originalImageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Applies a threshold overlay on the annotation layer.
     * @param imgData - The image slice as NdArray.
     * @param lower - Lower threshold value.
     * @param upper - Upper threshold value.
     * @param label - Label index to determine color.
     */
    applyThreshold(imgData: NdArray<TypedArray>, lower: number, upper: number, label: number): void {
        const { data, shape } = imgData;

        // Restore the original image data before applying threshold
        if (this.originalImageData) {
            this.context.putImageData(this.originalImageData, 0, 0);
        } else {
            this.saveOriginalImageData();
        }
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const canvasData = imageData.data;
        const color = this.colors[label];
        for (let i = 0; i < data.length; i++) {
            const value = data[i];
            if (value >= lower && value <= upper) {
                const idx = i * 4;
                canvasData[idx] = color[0]; // Red
                canvasData[idx + 1] = color[1]; // Green
                canvasData[idx + 2] = color[2]; // Blue
                canvasData[idx + 3] = 255; // Alpha
            }
        }

        this.context.putImageData(imageData, 0, 0);
        this.sprite.texture.update();
    }
}
class Canvas {
    /* ... */

    app: PIXI.Application;

    viewport: pixi_viewport.Viewport;

    div: HTMLDivElement;

    prevPosition: PIXI.Point;

    isPainting: boolean;

    annotation: Annotation;

    brush: Brush;

    brush_mode: BrushModeType;

    canvas: HTMLCanvasElement;

    context: CanvasRenderingContext2D;

    slice: PIXI.Sprite;

    labelSlice: PIXI.Sprite;

    superpixelSlice: PIXI.Sprite;

    futureSlice: PIXI.Sprite;

    cropSlice: PIXI.Sprite;

    cmap: ColorOptions;

    superpixelColor = 0xff0000;

    cropColor = 0xff0000;

    colors: [number, number, number][];

    alphas: number[];

    x: number;

    y: number;

    imgData?: NdArray<TypedArray>;

    labelData?: NdArray<TypedArray>;

    futureData?: NdArray<TypedArray>;

    imageShape?: ImageShapeInterface;

    cropShape?: CropShapeInterface;

    labelTableLen = 0;

    imgMin = 0.0;

    imgMax = 1.0;

    axis: 'XY' | 'XZ' | 'YZ';

    sliceNum: number;

    pointsBuffer: [number, number][] = [];

    activateSequentialLabel: boolean;

    lasso: Lasso;

    activeContour: ActiveContour;

    parentLabel: number | null = null;

    labelMap: Record<number, number> = {};

    prevClickedLabel: number | null = null;

    childLabels: Set<number> = new Set();

    lastClickTime = 0;

    lastClickedLabelForDoubleClick: number | null = null;

    singleClickThreshold = 20;

    doubleClickThreshold = 100; // ms (adjust to feel right)

    clickTimer: number | null = null;

    longClickThreshold = 2000; // ms — adjust to feel right

    popupDelay = 800; // wait before showing popup

    loadingTimer: number | null = null;

    loadingPopup: HTMLDivElement | null = null;

    progressBar: HTMLDivElement | null = null;

    longClickTimer: number | null = null;

    isLongClickActive = false;

    longClickTriggered = false;

    constructor(
        div: HTMLDivElement,
        colors: [number, number, number][],
        alphas: number[],
        axis: 'XY' | 'XZ' | 'YZ',
        sliceNum: number
    ) {
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        this.app = new PIXI.Application({
            //backgroundAlpha: 0.99,
            backgroundColor: 0x303030,
        });
        //cursor styles here
        if (this.app.renderer.plugins.interaction) {
            this.app.renderer.plugins.interaction.cursorStyles = {
                default: 'default',
                draw_brush: `url(${brushCursor}) 0 32, auto`,
                erase_brush: `url(${eraserCursor}) 0 32, auto`,
                magic_wand: `url(${fillCursor}) 0 0, auto`,
                lasso: `url(${lassoCursor}) 16 16, auto`,
                snakes: `url(${snakesCursor}) 16 16, auto`,
                dropper_brush: `url(${dropperCursor}) 0 32, auto`,
            };
        }

        this.viewport = new pixi_viewport.Viewport({
            interaction: this.app.renderer.plugins.interaction,
        });
        this.viewport.drag({
            mouseButtons: 'middle',
        });
        this.viewport.wheel();
        this.viewport.pinch();

        this.slice = new PIXI.Sprite();
        this.slice.visible = true;

        this.labelSlice = new PIXI.Sprite();

        this.cropSlice = new PIXI.Sprite();
        this.cropSlice.tint = this.cropColor;
        this.cropSlice.alpha = 0.2;
        this.cropSlice.blendMode = PIXI.BLEND_MODES.ADD;
        this.cropSlice.visible = false;
        this.cropShape = {
            cropX: { lower: 0, upper: 0 },
            cropY: { lower: 0, upper: 0 },
            cropZ: { lower: 0, upper: 0 },
        }; // initialize crop to avoid annoying msg of undefined in dev

        this.futureSlice = new PIXI.Sprite();
        this.futureSlice.visible = false;

        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d')!;

        this.superpixelSlice = new PIXI.Sprite();
        this.superpixelSlice.tint = this.superpixelColor;
        this.superpixelSlice.alpha = 0.3;
        this.superpixelSlice.blendMode = PIXI.BLEND_MODES.ADD;
        this.superpixelSlice.scale.x = 1;
        this.superpixelSlice.scale.y = 1;
        this.superpixelSlice.visible = true;

        this.annotation = new Annotation(colors, alphas);
        this.brush = new Brush(colors);
        this.lasso = new Lasso();
        this.activeContour = new ActiveContour();
        this.brush_mode = 'draw_brush';

        this.colors = colors;
        this.alphas = alphas;
        this.cmap = 'greys';

        this.isPainting = false;
        this.prevPosition = new PIXI.Point();

        this.app.stage.addChild(this.viewport);
        this.viewport.addChild(this.slice);
        this.viewport.addChild(this.futureSlice);
        this.viewport.addChild(this.superpixelSlice);
        this.viewport.addChild(this.labelSlice);
        this.viewport.addChild(this.cropSlice);
        this.viewport.addChild(this.annotation.sprite);
        this.viewport.addChild(this.brush.cursor);

        this.viewport.on('pointerdown', (e) => this.onPointerDown(e));
        this.viewport.on('pointerup', (e) => this.onPointerUp(e));
        this.viewport.on('pointerout', (e) => this.onPointerUp(e));
        this.viewport.on('pointermove', (e) => this.onPointerMove(e));
        this.viewport.on('wheel', (e) => this.onPointerMove(e.event));

        this.div = div;
        this.div.appendChild(this.app.view);

        this.x = this.y = 0;

        this.axis = axis;
        this.sliceNum = sliceNum;

        this.activateSequentialLabel = false;

        this.setLabelVisibility(true);
    }

    setColor(colors: { id: number; color: [number, number, number]; alpha: number }[]) {
        colors.forEach((color) => {
            this.colors[color.id] = color.color;
            this.alphas[color.id] = color.alpha;
        });

        this.labelTableLen = colors.length;

        if (this.labelData) {
            this.setLabelImage(this.labelData);
        }
        this.annotation.update();
        this.brush.update();
    }

    getLabelTableLen() {
        return this.labelTableLen;
    }

    showLoadingPopup() {
        // Clean any previous popup
        this.hideLoadingPopup();

        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.width = '160px';
        popup.style.height = '40px';
        popup.style.background = 'rgba(30,30,30,0.9)';
        popup.style.border = '1px solid #aaa';
        popup.style.borderRadius = '8px';
        popup.style.display = 'flex';
        popup.style.alignItems = 'center';
        popup.style.justifyContent = 'center';
        popup.style.zIndex = '9999';

        const barContainer = document.createElement('div');
        barContainer.style.width = '120px';
        barContainer.style.height = '8px';
        barContainer.style.background = '#444';
        barContainer.style.borderRadius = '4px';
        barContainer.style.overflow = 'hidden';

        const bar = document.createElement('div');
        bar.style.width = '0%';
        bar.style.height = '100%';
        bar.style.background = '#4caf50';
        bar.style.transition = 'none'; // disable until animation starts
        barContainer.appendChild(bar);

        popup.appendChild(barContainer);
        document.body.appendChild(popup);

        this.loadingPopup = popup;
        this.progressBar = bar;
    }

    hideLoadingPopup() {
        if (this.loadingPopup) {
            document.body.removeChild(this.loadingPopup);
            this.loadingPopup = null;
            this.progressBar = null;
        }
    }

    animateLoadingBar(duration: number) {
        if (!this.progressBar) return;

        // reset to 0 width instantly
        this.progressBar.style.transition = 'none';
        this.progressBar.style.width = '0%';

        // Force a reflow so browser applies the initial width
        void this.progressBar.offsetWidth;

        // Then animate to 100%
        requestAnimationFrame(() => {
            if (!this.progressBar) return;
            this.progressBar.style.transition = `width ${duration}ms linear`;
            this.progressBar.style.width = '100%';
        });
    }

    setImageShape() {
        void sfetch('POST', '/get_image_info/image_info', '', 'json').then((imgInfo: ImageInfoInterface) => {
            const imageShape: ImageShapeInterface = {
                x: imgInfo.imageShape.x,
                y: imgInfo.imageShape.y,
                z: imgInfo.imageShape.z,
            };
            this.imageShape = imageShape;
            console.log('Canvas: Getting imageShape from the backend: ', imageShape);
        });
    }

    setSliceNum(sliceNum: number) {
        this.sliceNum = sliceNum;
    }

    showBrush(flag: boolean) {
        this.brush.cursor.visible = flag;
    }

    setAxis(axis: 'XY' | 'XZ' | 'YZ') {
        this.axis = axis;
    }

    getLabelAtPointer(event: any): number {
        if (!this.labelData) return -1;

        const pos = this.viewport.toWorld(event.data.global);

        // Clamp to image bounds
        const x = Math.max(0, Math.min(Math.floor(pos.x), this.labelData.shape[1] - 1));
        const y = Math.max(0, Math.min(Math.floor(pos.y), this.labelData.shape[0] - 1));

        const labelValue = this.labelData.data[y * this.labelData.shape[1] + x];

        console.log('Pointer world:', pos.x, pos.y);
        console.log('Mapped to label array:', x, y);
        console.log('Label at pointer:', this.labelData.data[y * this.labelData.shape[1] + x]);
        return labelValue >= 0 ? labelValue : -1;
    }

    restoreOriginalLabels() {
        if (!this.labelData) return;

        const width = this.labelData.shape[1];
        const height = this.labelData.shape[0];
        const len = this.labelData.data.length;
        const rgbaData = new Uint8Array(len * 4);

        for (let i = 0; i < len; ++i) {
            const idx = i * 4;
            const pixelLabel = this.labelData.data[i];
            if (pixelLabel < 0) continue;

            const baseColor = this.colors[pixelLabel] || [128, 128, 128];
            const alpha = this.alphas[pixelLabel] || 1.0;

            rgbaData[idx] = baseColor[0];
            rgbaData[idx + 1] = baseColor[1];
            rgbaData[idx + 2] = baseColor[2];
            rgbaData[idx + 3] = alpha * 255;
        }

        const texture = this.textureFromSlice(rgbaData, width, height, PIXI.FORMATS.RGBA);
        this.labelSlice.texture = texture;
    }

    handleSingleClick(event: any) {
        const clickedLabel = this.getLabelAtPointer(event);
        if (clickedLabel < 0) return;

        console.log('Single click on label:', clickedLabel);

        // --- Parent/Child logic ---
        if (this.parentLabel === null) {
            // No parent yet → this becomes the parent
            this.parentLabel = clickedLabel;
            this.labelMap = {};
            this.highlightMergedLabels();
        } else if (clickedLabel !== this.parentLabel) {
            // If clicked on a new label, add as child
            this.labelMap[clickedLabel] = this.parentLabel;
            this.highlightMergedLabels();
        }
    }

    handleDoubleClick(event: any) {
        const clickedLabel = this.getLabelAtPointer(event);
        if (clickedLabel < 0) return;

        console.log('Double click on label:', clickedLabel);

        if (clickedLabel === this.parentLabel) {
            // Double-click parent → clear everything
            this.parentLabel = null;
            this.labelMap = {};
            this.restoreOriginalLabels();
            console.log('Cleared all merge highlights');
        } else if (this.labelMap[clickedLabel]) {
            // Double-click child → remove just that child
            delete this.labelMap[clickedLabel];
            this.highlightMergedLabels();
            console.log('Removed child label:', clickedLabel);
        }
    }

    handleLongClick(label: number) {
        if (!this.parentLabel) return;

        //loading bar
        this.showLoadingPopup();
        this.animateLoadingBar(3000);

        //message during merge operation
        const loadingMsg = document.createElement('div');
        loadingMsg.innerText = 'Merging superpixels...';
        loadingMsg.style.position = 'fixed';
        loadingMsg.style.top = '50%';
        loadingMsg.style.left = '50%';
        loadingMsg.style.transform = 'translate(-50%, -50%)';
        loadingMsg.style.background = 'rgba(30,30,30,0.9)';
        loadingMsg.style.color = 'white';
        loadingMsg.style.padding = '10px 16px';
        loadingMsg.style.borderRadius = '6px';
        loadingMsg.style.fontSize = '14px';
        loadingMsg.style.zIndex = '10000';
        document.body.appendChild(loadingMsg);

        const payload = {
            parent: this.parentLabel,
            children: Array.from(this.childLabels),
        };

        void sfetch('POST', '/merge_superpixels', JSON.stringify(payload), 'json')
            .then((result) => {
                if (Array.isArray(result)) {
                    const coloredLabels = result.map((lbl: LabelInterface) => ({
                        ...lbl,
                        color: colorFromId(defaultColormap, lbl.id),
                    }));

                    dispatch('LabelLoaded', coloredLabels);
                    dispatch('labelChanged', '');
                    console.log('Label table updated successfully after merge.');
                } else {
                    console.log('Merge completed without label output (labels = false).');
                    dispatch('LabelLoaded', []);
                }

                dispatch('labelChanged', '');
            })
            .catch((err) => console.error('Error while merging superpixels:', err))
            .finally(() => {
                //reset states
                this.hideLoadingPopup();
                document.body.removeChild(loadingMsg);

                //reset states for another merge operation
                this.restoreOriginalLabels();
                this.parentLabel = null;
                this.childLabels.clear();
                this.labelMap = {};
                this.isLongClickActive = false;
                this.isPainting = false;

                dispatch('labelChanged', '');
            });
    }

    highlightLabelPattern(label: number) {
        if (!this.labelData) return;

        if (!this.labelData) return;
        if (label < 0) {
            this.labelSlice.texture = PIXI.Texture.EMPTY;
            return;
        }

        const width = this.labelData.shape[1];
        const height = this.labelData.shape[0];
        const len = this.labelData.data.length;
        const rgbaData = new Uint8Array(len * 4);

        for (let i = 0; i < len; ++i) {
            const idx = i * 4;
            const pixelLabel = this.labelData.data[i];
            if (pixelLabel < 0) continue;

            const baseColor = this.colors[pixelLabel] || [128, 128, 128];
            const alpha = this.alphas[pixelLabel] || 1.0;

            // Basic pattern logic: e.g., stripes every 4 pixels
            const y = Math.floor(i / width);
            const x = i % width;

            let patternAlpha = alpha;
            if (pixelLabel === label) {
                // example: simple diagonal stripes
                if ((x + y) % 6 < 3) {
                    patternAlpha = 0.8; // visible pattern
                } else {
                    patternAlpha = 0.2; // fade rest
                }
            }

            rgbaData[idx] = baseColor[0];
            rgbaData[idx + 1] = baseColor[1];
            rgbaData[idx + 2] = baseColor[2];
            rgbaData[idx + 3] = patternAlpha * 255;
        }

        const texture = this.textureFromSlice(rgbaData, width, height, PIXI.FORMATS.RGBA);
        this.labelSlice.texture = texture;
    }

    highlightMergedLabels() {
        if (!this.labelData || this.parentLabel === null) return;

        const width = this.labelData.shape[1];
        const height = this.labelData.shape[0];
        const len = this.labelData.data.length;
        const rgbaData = new Uint8Array(len * 4);

        for (let i = 0; i < len; ++i) {
            const idx = i * 4;
            const pixelLabel = this.labelData.data[i];
            if (pixelLabel < 0) continue;

            const baseColor = this.colors[pixelLabel] || [128, 128, 128];
            const alpha = this.alphas[pixelLabel] || 1.0;

            let patternAlpha = alpha;

            const y = Math.floor(i / width);
            const x = i % width;

            if (pixelLabel === this.parentLabel) {
                const cx = 4; // pattern repeat size
                const dx = x % cx;
                const dy = y % cx;

                // Creates a star-like shape by combining crosses and diagonals
                const isStar = dx === 0 || dy === 0 || dx === dy || dx + dy === cx - 1;

                if (isStar) {
                    patternAlpha = 1.0; // bright "star" pixels
                } else {
                    patternAlpha = 0.4; // background fade
                }
            } else if (this.childLabels.has(pixelLabel)) {
                // Children: diagonal stripe pattern
                if ((x + y) % 6 < 3) patternAlpha = 1;
                else patternAlpha = 0.4;
            }

            rgbaData[idx] = baseColor[0];
            rgbaData[idx + 1] = baseColor[1];
            rgbaData[idx + 2] = baseColor[2];
            rgbaData[idx + 3] = patternAlpha * 255;
        }

        const texture = this.textureFromSlice(rgbaData, width, height, PIXI.FORMATS.RGBA);
        this.labelSlice.texture = texture;
    }

    onPointerDown(event: any) {
        if (event.data.pointerType === 'mouse') {
            if (event.data.button !== 0) return;
        } else if (event.data.pointerType === 'touch') {
            this.viewport.plugins.pause('drag');
            // canvas.brush.cursor.visible = false;
        }
        if (this.brush_mode === 'dropper_brush') {
            const clickedLabel = this.getLabelAtPointer(event);
            if (clickedLabel < 0) return;

            // --- Reset timers and flags ---
            if (this.clickTimer) clearTimeout(this.clickTimer);
            if (this.loadingTimer) clearTimeout(this.loadingTimer);
            if (this.longClickTimer) clearTimeout(this.longClickTimer);

            this.hideLoadingPopup();
            this.isLongClickActive = false;
            this.longClickTriggered = false;
            this.isPainting = true; // pressing

            const now = performance.now();
            const timeSinceLastClick = now - this.lastClickTime;
            const isDoubleClick =
                this.lastClickedLabelForDoubleClick === clickedLabel && timeSinceLastClick < this.doubleClickThreshold;

            this.lastClickTime = now;
            this.lastClickedLabelForDoubleClick = clickedLabel;

            // --- Handle double-click ---
            if (isDoubleClick) {
                this.handleDoubleClick(event);
                return;
            }

            // --- Setup long-click timers ---
            this.loadingTimer = window.setTimeout(() => {
                // show progress bar only after delay
                if (!this.isPainting) return; // released before popup delay
                this.showLoadingPopup();
                this.animateLoadingBar(this.longClickThreshold - this.popupDelay);
            }, this.popupDelay);

            this.longClickTimer = window.setTimeout(() => {
                // safeguard: only trigger if still pressing
                if (!this.isPainting) return;
                this.isLongClickActive = true;
                this.longClickTriggered = true;
                this.handleLongClick(clickedLabel);
                this.hideLoadingPopup();
            }, this.longClickThreshold);

            return;
        }

        if (this.brush_mode === 'lasso') {
            this.isPainting = true;
            const position = this.viewport.toWorld(event.data.global);
            const context = this.annotation.context;
            this.lasso.startLasso(position.x, position.y, this.brush.color, context);
            this.annotation.sprite.texture.update();
            this.viewport.addChild(this.lasso.tempLine);
            return;
        }
        if (this.brush_mode === 'snakes') {
            this.isPainting = true;
            const position = this.viewport.toWorld(event.data.global);
            const start = performance.now();
            this.activeContour
                .drawContour(
                    Math.floor(position.x),
                    Math.floor(position.y),
                    this.brush.label,
                    this.sliceNum,
                    this.axis,
                    'start'
                )
                .then((coords) => {
                    // Ensure coords is not null before using it
                    if (coords !== null) {
                        this.annotation.drawOver(coords, this.brush.label);
                        const end = performance.now();
                        console.log(`Execution time activeContour Pointerdown: ${end - start} ms`);
                    }
                })
                .catch((error) => {
                    console.error('Error during drawPoint:', error);
                });
        }

        this.isPainting = true;
        this.prevPosition = this.viewport.toWorld(event.data.global);
        /* Floor the coordinates of the returned PIXI.Point. This is relevant for forcing the canvas to show discrete positions for the user
        since we are painting in a discrete manner in the backend and make both compatible, making a friendly user experience :)
        */
        this.prevPosition.x = Math.floor(this.prevPosition.x);
        this.prevPosition.y = Math.floor(this.prevPosition.y);
    }

    onPointerMove(event: any) {
        let currPosition;

        if (event.type === 'wheel') {
            this.viewport.plugins.resume('drag');
            currPosition = this.viewport.toWorld(event.offsetX, event.offsetY);
            currPosition.x = Math.floor(currPosition.x);
            currPosition.y = Math.floor(currPosition.y);
        } else {
            currPosition = this.viewport.toWorld(event.data.global);
            currPosition.x = Math.floor(currPosition.x);
            currPosition.y = Math.floor(currPosition.y);
            if (event.data.pointerType === 'touch' && event.data.originalEvent.touches.length > 1) {
                this.isPainting = false;
                return;
            }
        }
        if (this.brush_mode === 'lasso' && this.isPainting) {
            const position = this.viewport.toWorld(event.data.global);
            const context = this.annotation.context;
            this.lasso.addPoint(position.x, position.y, context);
            this.annotation.sprite.texture.update();
            this.lasso.drawTempLine(position.x, position.y);
            return;
        }

        if (this.brush_mode === 'snakes' && this.isPainting) {
            const position = this.viewport.toWorld(event.data.global);
            const start = performance.now();
            this.activeContour
                .drawContour(
                    Math.floor(position.x),
                    Math.floor(position.y),
                    this.brush.label,
                    this.sliceNum,
                    this.axis,
                    'execute'
                )
                .then((coords) => {
                    // Ensure coords is not null before using it
                    if (coords !== null) {
                        this.annotation.drawOver(coords, this.brush.label);
                        const end = performance.now();
                        console.log(`Execution time activeContour Pointerdown: ${end - start} ms`);
                    }
                })
                .catch((error) => {
                    console.error('Error during drawPoint:', error);
                });
            return;
        }
        this.brush.cursor.position.x = currPosition.x - Math.floor(this.brush.size / 2);
        this.brush.cursor.position.y = currPosition.y - Math.floor(this.brush.size / 2);

        if (!this.isPainting || this.brush_mode === 'magic_wand') return;
        if (!this.isPainting || this.brush_mode === 'dropper_brush') return;

        this.pointsBuffer = [...this.pointsBuffer, ...this.draw(currPosition)];

        this.prevPosition = currPosition;
    }

    onPointerUp(event: any) {
        this.viewport.plugins.resume('drag');
        if (!this.isPainting) return;

        // --- Cancel all timers ---
        if (this.loadingTimer) clearTimeout(this.loadingTimer);
        if (this.longClickTimer) clearTimeout(this.longClickTimer);
        if (this.clickTimer) clearTimeout(this.clickTimer);

        // --- Handle dropper mode ---
        if (this.brush_mode === 'dropper_brush') {
            const wasPainting = this.isPainting;
            this.isPainting = false; // <— ensures long click can't trigger after release
            this.hideLoadingPopup();

            const clickedLabel = this.getLabelAtPointer(event);
            if (clickedLabel < 0) return;

            // If long click was already triggered → nothing else to do
            if (this.longClickTriggered) {
                console.log('✅ Long click already triggered → ignoring release.');
                this.isLongClickActive = false;
                this.longClickTriggered = false;
                return;
            }

            // Ensure long click is cancelled when released early
            this.isLongClickActive = false;
            this.longClickTriggered = false;

            const now = performance.now();
            const timeSinceLastClick = now - this.lastClickTime;
            const isDoubleClick =
                this.lastClickedLabelForDoubleClick === clickedLabel && timeSinceLastClick < this.doubleClickThreshold;

            this.lastClickTime = now;
            this.lastClickedLabelForDoubleClick = clickedLabel;

            // --- Double click ---
            if (isDoubleClick) {
                if (this.clickTimer) clearTimeout(this.clickTimer);
                if (clickedLabel === this.parentLabel) {
                    console.log('Double-click parent → clearing all merges');
                    this.parentLabel = null;
                    this.childLabels.clear();
                    this.restoreOriginalLabels();
                } else if (this.childLabels.has(clickedLabel)) {
                    console.log('Double-click child → removing from merge');
                    this.childLabels.delete(clickedLabel);
                    this.highlightMergedLabels();
                }
                return;
            }

            // --- Single click (delayed to avoid false double clicks) ---
            if (this.clickTimer) clearTimeout(this.clickTimer);
            this.clickTimer = window.setTimeout(() => {
                if (this.isLongClickActive || this.longClickTriggered) return;

                if (this.parentLabel === null) {
                    this.parentLabel = clickedLabel;
                    this.childLabels.clear();
                    this.highlightMergedLabels();
                } else if (clickedLabel !== this.parentLabel) {
                    if (!this.childLabels.has(clickedLabel)) {
                        this.childLabels.add(clickedLabel);
                        this.highlightMergedLabels();
                    }
                }

                window.dispatchEvent(
                    new CustomEvent('labelSelected', {
                        detail: {
                            parent: this.parentLabel,
                            children: Array.from(this.childLabels),
                        },
                    })
                );
            }, this.singleClickThreshold);

            return;
        }

        // ===========================================
        // === OTHER MODES (lasso, snakes, brush) ====
        // ===========================================

        if (this.brush_mode === 'magic_wand') {
            this.viewport.plugins.pause('drag');
            void applyMagicWand(this.viewport, this.sliceNum, this.axis, this.brush.label, event);
            this.isPainting = false;
            return;
        }

        if (this.brush_mode === 'lasso') {
            this.isPainting = false;
            const context = this.annotation.context;
            this.lasso.endLasso(context, this.brush.label, this.sliceNum, this.axis);
            this.lasso.clearTempLine();
            this.viewport.removeChild(this.lasso.tempLine);
            this.annotation.sprite.texture.update();
            return;
        }

        if (this.brush_mode === 'snakes') {
            void this.activeContour.finalize(this.brush.label, this.sliceNum, this.axis);
            this.activeContour.clear();
            this.isPainting = false;
            this.annotation.resetPreviousData();
            return;
        }

        // --- Normal brush mode finalize ---
        const currPosition = this.viewport.toWorld(event.data.global);
        currPosition.x = Math.floor(currPosition.x);
        currPosition.y = Math.floor(currPosition.y);
        this.prevPosition = currPosition;
        this.pointsBuffer = [...this.pointsBuffer, ...this.draw(currPosition)];

        const data = {
            coords: this.pointsBuffer,
            slice: this.sliceNum,
            axis: this.axis,
            size: this.brush.size,
            label: this.brush.label,
            mode: this.brush_mode,
        };

        void sfetch('POST', '/draw', JSON.stringify(data)).then((success) => {
            console.log(success);
            dispatch('annotationChanged', null);
        });

        this.pointsBuffer = [];

        if (this.activateSequentialLabel) {
            dispatch('sequentialLabelUpdate', {
                id: this.brush.label,
                tableLen: this.labelTableLen,
            });
            this.brush.setLabel(this.brush.label + 1);
        }

        this.isPainting = false;
    }

    distanceBetween(point1: PIXI.Point, point2: PIXI.Point) {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    angleBetween(point1: PIXI.Point, point2: PIXI.Point) {
        return Math.atan2(point2.x - point1.x, point2.y - point1.y);
    }

    adjustContrast(minimum: number, maximum: number) {
        this.imgMax = maximum;
        this.imgMin = minimum;
        if (this.imgData) {
            this.setImage(this.imgData);
        }
    }

    draw(currPosition: PIXI.Point): [number, number][] {
        const context = this.annotation.context;
        const mode = this.brush_mode;

        if (mode === 'no_brush') {
            return [];
        } else if (mode === 'erase_brush') {
            this.annotation.context.globalCompositeOperation = 'destination-out';
        } else {
            this.annotation.context.globalCompositeOperation = 'source-over';
        }

        if (currPosition === this.prevPosition) {
            const x = this.prevPosition.x;
            const y = this.prevPosition.y;
            console.log("They're equal :D ", currPosition);
            this.brush.contextDrawBrush(context, x, y);

            this.annotation.sprite.texture.update();

            return [[x, y]];
        }

        const coords: [number, number][] = [];
        const dist = this.distanceBetween(this.prevPosition, currPosition);
        const angle = this.angleBetween(this.prevPosition, currPosition);
        for (let i = 0; i < dist; i++) {
            const x = this.prevPosition.x + Math.sin(angle) * i;
            const y = this.prevPosition.y + Math.cos(angle) * i;
            this.brush.contextDrawBrush(context, x, y);
            coords.push([x, y]);
        }
        this.annotation.sprite.texture.update();
        return coords;
    }

    setBrushMode(mode: BrushModeType) {
        this.brush_mode = mode;
        this.brush.setMode(mode);
        // Set the cursor mode
        console.log('setting brush to mode:', mode);
        this.viewport.cursor = mode;
    }

    setSuperpixelVisibility(visible = true) {
        this.superpixelSlice.visible = visible;
    }

    setAnnotationVisibility(visible = true) {
        this.annotation.sprite.visible = visible;
    }

    setAnnotationAlpha(alpha: number) {
        this.annotation.sprite.alpha = alpha;
    }

    setLabelAlpha(alpha: number) {
        this.labelSlice.alpha = alpha;
    }

    setCropAlpha(alpha: number) {
        this.cropSlice.alpha = alpha;
    }

    setPreviewVisibility(visible = true) {
        this.futureSlice.visible = visible;
    }

    setLabelVisibility(visible = true) {
        this.labelSlice.visible = visible;
    }

    /** Changes the visibility of the crop layer listening an event on CanvasContainer */
    setCropVisibility(visible = false) {
        console.log('Canvas: Changing visibility', visible);
        if (visible) {
            this.setCropPreviewMaskImage();
        }
        this.cropSlice.visible = visible;
    }

    setSequentialLabel(payload: boolean) {
        this.activateSequentialLabel = payload;
    }

    /** From an event listener of changes in axis and slices,
     * checks if the canvas is in crop preview mode and calls the
     * function that builds the preview mask if so. */
    checkUpdateCropPreview() {
        if (this.cropSlice.visible) {
            this.setCropPreviewMaskImage();
        }
    }

    private textureFromSlice(slice: Uint8Array, x: number, y: number, pformat = PIXI.FORMATS.LUMINANCE) {
        const texture = PIXI.Texture.fromBuffer(slice, x, y, {
            type: PIXI.TYPES.UNSIGNED_BYTE,
            format: pformat,
        });
        return texture;
    }

    private colortextureFromSlice(slice: Float32Array, x: number, y: number, pformat = PIXI.FORMATS.RGBA) {
        const texture = PIXI.Texture.fromBuffer(slice, x, y, {
            type: PIXI.TYPES.FLOAT,
            format: pformat,
        });
        return texture;
    }

    setLabelImage(labelSlice: NdArray<TypedArray>) {
        this.labelData = labelSlice;

        const width = labelSlice.shape[1];
        const height = labelSlice.shape[0];

        const len = labelSlice.data.length;
        const rgbaData = new Uint8Array(len * 4);

        const colors = this.colors;

        const alphas = this.alphas;

        for (let i = 0; i < len; ++i) {
            const idx = i * 4;
            const label = labelSlice.data[i];
            // Skip calculations if there is no label
            if (label < 0) continue;

            const color = colors[label];
            const alpha = alphas[label];

            rgbaData[idx] = color[0]; //R
            rgbaData[idx + 1] = color[1]; //G
            rgbaData[idx + 2] = color[2]; //B
            rgbaData[idx + 3] = alpha * 255; //A
        }

        const texture = this.textureFromSlice(rgbaData, width, height, PIXI.FORMATS.RGBA);
        this.labelSlice.texture = texture;
    }

    /** Sets the crop shape from an envent listener on CanvasContainer */
    setCropShape(cropShape: CropShapeInterface) {
        this.cropShape = cropShape;
    }

    /**
     * Builds a mask layer for the preview mode for the current slice and axis on canvas
     * with information set on Canvas by event listeners.
     * The resulting image is set on the cropSlice layer on canvas.
     */
    private setCropPreviewMaskImage() {
        let error: string;

        if (this.imageShape === undefined) {
            error = 'Canvas.setCropPreviewMaskImage: imageShape is undefined';
            console.log(error);
            return;
        }

        let width: number;
        let height: number;
        const depth = this.sliceNum;

        let cropW: CropAxisInterface;
        let cropH: CropAxisInterface;
        let cropD: CropAxisInterface;

        if (this.axis === 'XY') {
            width = this.imageShape.x;
            height = this.imageShape.y;
            cropW = this.cropShape!.cropX;
            cropH = this.cropShape!.cropY;
            cropD = this.cropShape!.cropZ;
        } else if (this.axis === 'XZ') {
            width = this.imageShape.x;
            height = this.imageShape.z;
            cropW = this.cropShape!.cropX;
            cropH = this.cropShape!.cropZ;
            cropD = this.cropShape!.cropY;
        } else if (this.axis === 'YZ') {
            width = this.imageShape.y;
            height = this.imageShape.z;
            cropW = this.cropShape!.cropY;
            cropH = this.cropShape!.cropZ;
            cropD = this.cropShape!.cropX;
        } else {
            if (this.cropShape === undefined) {
                error = 'Canvas.setCropPreviewMaskImage: cropShape is undefined';
            } else {
                error = 'Canvas.setCropPreviewMaskImage: error setting dimensions in axis: ' + String(this.axis);
            }
            console.log(error);
            return;
        }

        const insideBox = (y: number, x: number) => {
            const uIn = (u: number, cropU: CropAxisInterface) => {
                return cropU.lower <= u && u <= cropU.upper;
            };
            return uIn(depth, cropD) && uIn(y, cropH) && uIn(x, cropW);
        };

        const len: number = width * height;
        const uint8data = new Uint8Array(len);

        const rowMajIdx = (yi: number, xj: number) => {
            return xj + yi * width;
        };

        for (let yi = 0; yi < height; ++yi) {
            for (let xj = 0; xj < width; ++xj) {
                if (!insideBox(yi, xj)) {
                    const idx = rowMajIdx(yi, xj); //* 4;
                    uint8data[idx] = 255;
                }
            }
        }
        const texture = this.textureFromSlice(uint8data, width, height);
        this.cropSlice.texture = texture;
    }

    /*     private toUint8Array(img: NdArray<TypedArray>): Uint8Array {
        const len = img.shape[1] * img.shape[0];
        console.log('toUint8Array exec');
        let scaleFunc: (value: number) => number;
        console.log(img.dtype);
        // Generalized function to extract bit depth and determine if it's unsigned
        const getBitDepthAndUnsigned = (dtype: string): [number, boolean] => {
            const isUnsigned = dtype.startsWith('u');
            const bitDepth = parseInt(dtype.replace(/\D/g, ''), 10);
            return [bitDepth, isUnsigned];
        };

        const [bitDepth, isUnsigned] = getBitDepthAndUnsigned(img.dtype);
        const maxDataTypeValue = isUnsigned ? Math.pow(2, bitDepth) - 1 : Math.pow(2, bitDepth - 1) - 1;
        console.log('imgminmax', this.imgMin, this.imgMax);
        // General scaling function bazsed on whether it's signed or unsigned
        if (isUnsigned) {
            // Assuming imgMax and imgMin are for normalized scaling within the unsigned range
            const max = this.imgMax;
            const min = this.imgMin;
            const range = max - min;
            scaleFunc = (value: number) => 255 * (1.0 - (max - clamp(min, value, max)) / range);
        } else {
            // For signed types, adjust min and max if necessary based on expected range adjustments
            const max = this.imgMax;
            const min = this.imgMin;
            const range = max - min;
            scaleFunc = (value: number) => 255 * (1.0 - Math.abs((max - clamp(min, value, max)) / range));
        }

        // Apply the scaling function to each pixel
        const uint8data = new Uint8Array(len);
        for (let i = 0; i < len; ++i) {
            uint8data[i] = Math.round(scaleFunc(img.data[i]));
        }

        return uint8data;
    } */

    private toFloat32ColorArray(img: NdArray<TypedArray>, colorname: ColorOptions): Float32Array {
        const len = img.shape[1] * img.shape[0];
        console.log('toFloat32ColorArray exec');
        let scaleFunc: (value: number) => number;
        console.log(img.dtype);

        // Generalized function to extract bit depth and determine if it's unsigned
        const getBitDepthAndUnsigned = (dtype: string): [number, boolean] => {
            const isUnsigned = dtype.startsWith('u');
            const bitDepth = parseInt(dtype.replace(/\D/g, ''), 10);
            return [bitDepth, isUnsigned];
        };

        const [bitDepth, isUnsigned] = getBitDepthAndUnsigned(img.dtype);
        const maxDataTypeValue = isUnsigned ? Math.pow(2, bitDepth) - 1 : Math.pow(2, bitDepth - 1) - 1;
        console.log('imgminmax', this.imgMin, this.imgMax);

        // General scaling function based on whether it's signed or unsigned
        const max = this.imgMax;
        const min = this.imgMin;
        const range = max - min;

        // Handle constant image values by checking if the range is zero.
        if (range === 0) {
            // In a constant image, you might choose to return a fixed intensity.
            // For example, returning 1.0 for every value.
            scaleFunc = (value: number) => 0.5;
        } else if (isUnsigned) {
            scaleFunc = (value: number) => 1.0 - (max - clamp(min, value, max)) / range;
        } else {
            scaleFunc = (value: number) => 1.0 - Math.abs((max - clamp(min, value, max)) / range);
        }

        // Generate a colormap, using float for only loss of info in the final conversion, not during map
        const colors = colormap({
            colormap: colorname,
            nshades: 256,
            format: 'float',
        });

        // Apply the scaling function to each pixel
        const rgbaData = new Float32Array(len * 4);
        for (let i = 0; i < len; ++i) {
            const intensity = scaleFunc(img.data[i]);
            const color = colors[Math.floor(intensity * 255)];
            const baseIndex = i * 4;
            rgbaData[baseIndex] = color[0]; // R
            rgbaData[baseIndex + 1] = color[1]; // G
            rgbaData[baseIndex + 2] = color[2]; // B
            rgbaData[baseIndex + 3] = 1; // A
        }

        return rgbaData;
    }

    setFutureImage(futureSlice: NdArray<TypedArray>) {
        this.futureData = futureSlice;

        const x = futureSlice.shape[1];
        const y = futureSlice.shape[0];

        const floatdata = this.toFloat32ColorArray(futureSlice, this.cmap);
        const texture = this.colortextureFromSlice(floatdata, x, y, PIXI.FORMATS.RGBA);

        this.futureSlice.texture = texture;
    }

    deleteFutureImage() {
        this.futureData = undefined;
        this.futureSlice.texture = PIXI.Texture.EMPTY;
    }

    setImage(imgSlice: NdArray<TypedArray>) {
        this.imgData = imgSlice;

        const x = imgSlice.shape[1];
        const y = imgSlice.shape[0];

        this.x = x;
        this.y = y;

        this.annotation.setSize(x, y);

        const floatdata = this.toFloat32ColorArray(imgSlice, this.cmap);
        const texture = this.colortextureFromSlice(floatdata, x, y, PIXI.FORMATS.RGBA);
        this.slice.texture = texture;
        // console.log('Image exists: Unlocking components.');
        // dispatch('LockComponents', false);
    }

    setColorMap(cmap: ColorOptions) {
        this.cmap = cmap;
        const imgSlice = this.imgData;
        if (imgSlice === undefined) {
            console.error('Image is not open yet');
            return;
        }

        const x = imgSlice.shape[1];
        const y = imgSlice.shape[0];

        this.x = x;
        this.y = y;

        this.annotation.setSize(x, y);

        const floatdata = this.toFloat32ColorArray(imgSlice, this.cmap);
        const texture = this.colortextureFromSlice(floatdata, x, y, PIXI.FORMATS.RGBA);
        this.slice.texture = texture;
    }

    setSuperpixelColor(color: number) {
        this.superpixelColor = color;
        this.superpixelSlice.tint = this.superpixelColor;
    }

    setCropColor(color: number) {
        this.cropColor = color;
        this.cropSlice.tint = this.cropColor;
    }

    setSuperpixelImage(superpixel_slice: NdArray<TypedArray>) {
        const uint8data = superpixel_slice.data.map((x) => x * 255) as Uint8Array;
        const x = superpixel_slice.shape[1];
        const y = superpixel_slice.shape[0];
        const texture = this.textureFromSlice(uint8data, x, y);
        this.superpixelSlice.texture = texture;
        console.log('x: ', x);
    }

    destroyImage() {
        this.slice.texture.destroy();
        this.slice.texture = PIXI.Texture.EMPTY;
    }

    destroySuperpixelImage() {
        this.superpixelSlice.texture.destroy();
        this.superpixelSlice.texture = PIXI.Texture.EMPTY;
    }

    resize() {
        console.log('Canvas: resize');
        const center = this.viewport.center;

        this.app.renderer.resize(this.div.offsetWidth, this.div.offsetHeight);
        this.viewport.resize(this.div.offsetWidth, this.div.offsetHeight);

        this.viewport.moveCenter(center);
    }

    recenter(w: number = this.x, h: number = this.y) {
        this.viewport.moveCenter(w / 2, h / 2);
        this.viewport.fit(true, w, h);
    }
}

interface ICanvasProps {
    slice: number;
    axis: 'XY' | 'XZ' | 'YZ';
    canvasMode: 'drawing' | 'imaging';
}

interface ICanvasState {
    brush_mode: BrushModeType;
    label_contour: boolean;
    future_sight_on: boolean;
}
//here we do not change the cursor
const brushList = [
    {
        id: 'draw_brush',
        logo: brush,
    },
    {
        id: 'erase_brush',
        logo: eraserIcon,
    },
    {
        id: 'dropper_brush',
        logo: eyedrop,
    },
];

function timeout(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

class CanvasContainer extends Component<ICanvasProps, ICanvasState> {
    pixi_container: HTMLDivElement | null;

    canvas: Canvas | null;

    onLabelSelected: (payload: any) => void = () => {};

    onImageLoaded: (payload: any) => void = () => {};

    onColorMapChanged: (payload: any) => void = () => {};

    onContrastChanged: (payload: number[]) => void = () => {};

    onSuperpixelChanged: () => void = () => {};

    onLabelChanged: () => void = () => {};

    onSuperpixelColorChanged: (color: any) => void = () => {};

    onSuperpixelVisibilityChanged: (visible: boolean) => void = () => {};

    onLabelVisibilityChanged: (visible: boolean) => void = () => {};

    onLabelAlphaChanged: (alpha: number) => void = () => {};

    onAnnotanionAlphaChanged!: (alpha: number) => void;

    onAnnotanionVisibilityChanged!: (visible: boolean) => void;

    onLabelColorsChanged!: (colors: { id: number; color: [number, number, number]; alpha: number }[]) => void;

    onAnnotationChanged!: () => void;

    onLabelContourChanged!: (contour: boolean) => void;

    onFutureChanged!: (hasPreview: boolean) => void;

    onImageChanged!: (hasPreview: boolean) => void;

    onChangeStateBrush: (mode: BrushModeType) => void = () => {};

    onCropPreviewMode: (activateCropPreview: boolean) => void = () => {};

    onCropShape: (cropShape: CropShapeInterface) => void = () => {};

    onCropPreviewColorChanged: (color: any) => void = () => {};

    onActivateSL: (sequentialLabelPayload: { isActivated: boolean; id: number }) => void = () => {};

    constructor(props: ICanvasProps) {
        super(props);
        this.pixi_container = null;
        this.canvas = null;
        this.state = {
            brush_mode: 'draw_brush',
            label_contour: false,
            future_sight_on: false,
        };
    }

    fetchAll = (recenter = false) => {
        console.log(colormap);
        console.log('update ...', this.props.slice);
        return this.getImageSlice().then(() => {
            console.log('Canvas: ImageSlice exists: Unlocking components.');
            dispatch('LockComponents', false);
            this.canvas!.setImageShape();
            if (recenter) {
                this.canvas!.recenter();
            }
            this.getSuperpixelSlice();
            this.getAnnotSlice();
            this.getLabelSlice();
            this.getFutureSlice();
            this.getHistogram();
        });
    };

    fetchAllDebounced = debounce(this.fetchAll, 250);

    newAnnotation() {
        void sfetch('POST', '/new_annot/annotation');
        console.log('new annotation_menu, hue');
    }

    getSuperpixelSlice() {
        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
        };

        void sfetch('POST', '/get_superpixel_slice', JSON.stringify(params), 'gzip/numpyndarray')
            .then((superpixelSlice) => {
                this.canvas!.setSuperpixelImage(superpixelSlice);
            })
            .catch(() => {
                this.canvas!.destroySuperpixelImage();
            });
    }

    getHistogram() {
        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
        };
        sfetch('POST', '/get_image_histogram/image', JSON.stringify(params), 'json')
            .then((histogram: HistogramInfoPayload) => {
                dispatch('ImageHistogramLoaded', histogram);
            })
            .catch((error) => {
                console.log('Error while acquiring histogram');
                console.log(error.error_msg);
            });
    }

    getImageSlice() {
        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
        };
        console.log('Slice changed', this.props.axis, this.props.slice);
        return sfetch('POST', '/get_image_slice/image', JSON.stringify(params), 'gzip/numpyndarray')
            .then((imgSlice) => {
                this.canvas!.setImage(imgSlice);
            })
            .catch((error) => {
                console.log('getImageSlice() error:', error);
            });
    }

    getFutureSlice() {
        //the preview image is just a single slice
        //so we always get the 0th XY slice
        const params = {
            axis: 'XY',
            slice: 0,
        };

        void sfetch('POST', '/get_image_slice/future', JSON.stringify(params), 'gzip/numpyndarray')
            .then((previewSlice) => {
                this.canvas?.setFutureImage(previewSlice);
                this.canvas?.setPreviewVisibility(true);
                this.setState({ ...this.state, future_sight_on: true });
            })
            .catch((error) => {
                console.log('getFutureslice() error:', error);
            });
    }

    getAnnotSlice() {
        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
        };

        console.log('get annot slice', params);
        void sfetch('POST', '/get_annot_slice', JSON.stringify(params), 'gzip/numpyndarray')
            .then((slice) => {
                console.log('annot slice');
                this.canvas!.annotation.draw(slice);
            })
            .catch((error) => {
                console.log('getAnnotSlice() error:', error);
            });
    }

    getLabelSlice() {
        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
            contour: this.state.label_contour,
        };

        console.log('child labels:', this.canvas?.childLabels);
        console.log('parent label:', this.canvas?.parentLabel);
        void sfetch('POST', '/get_image_slice/label', JSON.stringify(params), 'gzip/numpyndarray')
            .then((labelSlice) => {
                this.canvas!.setLabelImage(labelSlice);
                this.canvas!.highlightMergedLabels();
            })
            .catch((error) => {
                console.error('Error fetching label slice:', error);
                // Execute another function in case of error
            });
    }

    setBrushMode(brush_mode: BrushModeType) {
        this.setState({ brush_mode });
        this.canvas!.setBrushMode(brush_mode);
    }

    GlobalThreshold = (payload: { lower: number; upper: number; action: 'render' | 'delete'; label: number }) => {
        const { lower, upper, action } = payload;

        if (!this.canvas || !this.canvas.annotation) {
            console.error('Canvas or Annotation not initialized.');
            return;
        }
        if (action === 'render') {
            // Render the threshold annotation
            this.canvas.annotation.applyThreshold(this.canvas.imgData!, lower, upper, this.canvas.brush.label);
        } else if (action === 'delete') {
            // Clear the annotation overlay
            this.canvas.annotation.resetPreviousData();
            this.onAnnotationChanged(); // force the annotation to be rerendered, small fix
        }
    };

    componentDidMount() {
        // the element is the DOM object that we will use as container to add pixi stage(canvas)
        const elem = this.pixi_container;
        if (this && elem) {
            const alphas = defaultColormap.map(() => 1); // Default to full opacity
            this.canvas = new Canvas(elem, defaultColormap, alphas, this.props.axis, this.props.slice);
            setTimeout(() => this.canvas!.resize(), 200);
            console.log(this.canvas.viewport);
            console.log(this.pixi_container);

            window.addEventListener('resize', (evt) => {
                console.log('resize ', evt);
                this.canvas!.resize();
            });

            void this.fetchAll(true);

            this.onLabelSelected = (payload: { id: number }) => {
                console.log(payload);
                console.log('label selected');
                this.canvas?.brush.setLabel(payload.id);
            };

            this.onImageLoaded = (payload) => {
                const promise = this.fetchAll(true);
                void promise?.then(() => {
                    // ensures the image is rendered when loaded
                    this.canvas!.recenter();
                    void sfetch('POST', '/is_annotation_empty', '', 'json').then((createNewAnnot: boolean) => {
                        //creates new annotation if necessary
                        if (createNewAnnot) {
                            this.newAnnotation();
                        }
                    });
                });
            };

            this.onColorMapChanged = (payload) => {
                this.canvas!.setColorMap(payload);
                console.log('Canvas cmap changed to:', payload);
            };

            this.onSuperpixelChanged = () => {
                this.getSuperpixelSlice();
            };

            this.onSuperpixelColorChanged = (color) => {
                console.log('superpixel color changed: ', color);
                this.canvas?.setSuperpixelColor(color);
            };

            this.onCropPreviewColorChanged = (color) => {
                console.log('crop preview color changed: ', color);
                this.canvas?.setCropColor(color);
            };

            this.onContrastChanged = (payload: number[]) => {
                console.log('Adjusting constrast', payload);
                this.adjustContrast(payload[0], payload[1]);
            };

            this.onLabelChanged = () => {
                console.log('onlabelchanged ...');
                this.getLabelSlice();
            };

            this.onSuperpixelVisibilityChanged = (visible: boolean) => {
                this.canvas?.setSuperpixelVisibility(visible);
            };

            this.onLabelVisibilityChanged = (visible: boolean) => {
                this.canvas?.setLabelVisibility(visible);
            };

            this.onLabelAlphaChanged = (alpha: number) => {
                this.canvas?.setLabelAlpha(alpha);
            };

            this.onAnnotanionAlphaChanged = (alpha: number) => {
                this.canvas?.setAnnotationAlpha(alpha);
            };

            this.onAnnotanionVisibilityChanged = (visible: boolean) => {
                this.canvas?.setAnnotationVisibility(visible);
            };

            this.onLabelColorsChanged = (colors) => {
                this.canvas?.setColor(colors);
                console.log('colors received: ', colors);
            };

            this.onAnnotationChanged = () => {
                this.getAnnotSlice();
            };

            this.onLabelContourChanged = (contour: boolean) => {
                this.setState({ ...this.state, label_contour: contour });
                this.getLabelSlice();
                console.log('contour changed: ', contour);
            };

            this.onFutureChanged = (hasSlice: boolean) => {
                if (hasSlice) {
                    this.getFutureSlice();
                } else {
                    this.canvas?.deleteFutureImage();
                    this.setState({ ...this.state, future_sight_on: false });
                }
            };

            this.onImageChanged = (hasSlice: boolean) => {
                if (hasSlice) {
                    const hatch = this.getImageSlice().then(() => {
                        console.log('Image Filtered.');
                    });
                }
            };

            this.onChangeStateBrush = (mode: BrushModeType) => {
                this.setBrushMode(mode);
            };

            this.onCropPreviewMode = (activateCropPreview: boolean) => {
                this.cropPreviewMode(activateCropPreview);
            };

            this.onCropShape = (cropShape: CropShapeInterface) => {
                this.setCropShape(cropShape);
            };

            this.onActivateSL = (sequentialLabelPayload: { isActivated: boolean; id: number }) => {
                this.canvas?.setSequentialLabel(sequentialLabelPayload.isActivated);
                this.canvas?.brush.setLabel(sequentialLabelPayload.id);
            };

            subscribe('futureChanged', this.onFutureChanged);
            subscribe('imageChanged', this.onImageChanged);
            subscribe('ColorMapChanged', this.onColorMapChanged);
            subscribe('labelColorsChanged', this.onLabelColorsChanged);
            subscribe('labelContourChanged', this.onLabelContourChanged);
            subscribe('annotationChanged', this.onAnnotationChanged);
            subscribe('annotationVisibilityChanged', this.onAnnotanionVisibilityChanged);
            subscribe('annotationAlphaChanged', this.onAnnotanionAlphaChanged);
            subscribe('labelAlphaChanged', this.onLabelAlphaChanged);
            subscribe('labelVisibilityChanged', this.onLabelVisibilityChanged);
            subscribe('superpixelVisibilityChanged', this.onSuperpixelVisibilityChanged);
            subscribe('superpixelColorChanged', this.onSuperpixelColorChanged);
            subscribe('labelSelected', this.onLabelSelected);
            subscribe('superpixelChanged', this.onSuperpixelChanged);
            subscribe('contrastChanged', this.onContrastChanged);
            subscribe('labelChanged', this.onLabelChanged);
            subscribe('ImageLoaded', this.onImageLoaded);
            subscribe('ChangeStateBrush', this.onChangeStateBrush);
            subscribe('cropShape', this.onCropShape);
            subscribe('cropPreviewMode', this.onCropPreviewMode);
            subscribe('cropPreviewColorchanged', this.onCropPreviewColorChanged);
            subscribe('activateSL', this.onActivateSL);
            subscribe('globalThresholdPreview', this.GlobalThreshold); // Subscribe to the event
        }
    }

    componentWillUnmount() {
        unsubscribe('futureChanged', this.onFutureChanged);
        unsubscribe('imageChanged', this.onImageChanged);
        unsubscribe('ColorMapChanged', this.onColorMapChanged);
        unsubscribe('labelColorsChanged', this.onLabelColorsChanged);
        unsubscribe('labelContourChanged', this.onLabelContourChanged);
        unsubscribe('annotationChanged', this.onAnnotationChanged);
        unsubscribe('annotationVisibilityChanged', this.onAnnotanionVisibilityChanged);
        unsubscribe('annotationAlphaChanged', this.onAnnotanionAlphaChanged);
        unsubscribe('labelAlphaChanged', this.onLabelAlphaChanged);
        unsubscribe('labelVisibilityChanged', this.onLabelVisibilityChanged);
        unsubscribe('superpixelVisibilityChanged', this.onSuperpixelVisibilityChanged);
        unsubscribe('superpixelColorChanged', this.onSuperpixelColorChanged);
        unsubscribe('labelSelected', this.onLabelSelected);
        unsubscribe('ImageLoaded', this.onImageLoaded);
        unsubscribe('superpixelChanged', this.onSuperpixelChanged);
        unsubscribe('contrastChanged', this.onContrastChanged);
        unsubscribe('labelChanged', this.onLabelChanged);
        unsubscribe('ChangeStateBrush', this.onChangeStateBrush);
        unsubscribe('cropShape', this.onCropShape);
        unsubscribe('cropPreviewMode', this.onCropPreviewMode);
        unsubscribe('cropPreviewColorchanged', this.onCropPreviewColorChanged);
        unsubscribe('activateSL', this.onActivateSL);
        unsubscribe('globalThresholdPreview', this.GlobalThreshold); // Subscribe to the event
    }

    componentDidUpdate(prevProps: ICanvasProps, prevState: ICanvasState) {
        // If no property has changed, do nothing.
        if (isEqual(prevProps, this.props)) return;

        // If the slice or the axis has changed, then reload the image, histogram, etc.
        if (prevProps.slice !== this.props.slice || prevProps.axis !== this.props.axis) {
            // Reinitialize any state that depends on these parameters.
            this.setState({ ...this.state, future_sight_on: false });
            this.canvas?.setSliceNum(this.props.slice);
            this.canvas?.setAxis(this.props.axis);
            void this.fetchAllDebounced(true);
        }
    }

    adjustContrast(minimum: number, maximum: number) {
        //this.setState({...this.state, contrastMin: minimum});
        this.canvas?.adjustContrast(minimum, maximum);
    }

    updateCropPreview = () => {
        this.canvas?.checkUpdateCropPreview();
    };

    cropPreviewMode(activateCropPreview: boolean) {
        this.canvas?.setCropVisibility(activateCropPreview);
    }

    setCropShape(cropShape: CropShapeInterface) {
        this.canvas?.setCropShape(cropShape);
    }

    increaseIntervalId: NodeJS.Timeout | null = null;

    decreaseIntervalId: NodeJS.Timeout | null = null;

    initialTimeoutId: NodeJS.Timeout | null = null;

    increaseBrushSize = () => {
        // Brush size should be an odd number, as the kernel in backend needs an unambiguous center
        this.canvas?.brush.setSize(this.canvas?.brush.size + 2);
    };

    decreaseBrushSize = () => {
        if (this.canvas?.brush.size === undefined) return;
        if (this.canvas?.brush.size <= 1) return;
        // Brush size should be an odd number, as the kernel in backend needs an unambiguous center
        this.canvas?.brush.setSize(this.canvas?.brush.size - 2);
    };

    handleIncreaseMouseDown = () => {
        this.increaseBrushSize();
        this.initialTimeoutId = setTimeout(() => {
            this.increaseIntervalId = setInterval(() => {
                this.increaseBrushSize();
            }, 20);
        }, 200);
    };

    handleDecreaseMouseDown = () => {
        this.decreaseBrushSize();
        this.initialTimeoutId = setTimeout(() => {
            this.decreaseIntervalId = setInterval(() => {
                this.decreaseBrushSize();
            }, 20);
        }, 200);
    };

    handleMouseUp = () => {
        if (this.initialTimeoutId) {
            clearTimeout(this.initialTimeoutId);
            this.initialTimeoutId = null;
        }
        if (this.increaseIntervalId) {
            clearInterval(this.increaseIntervalId);
            this.increaseIntervalId = null;
        }
        if (this.decreaseIntervalId) {
            clearInterval(this.decreaseIntervalId);
            this.decreaseIntervalId = null;
        }
    };

    render() {
        return (
            <div
                id="root"
                className="canvas"
                style={{ backgroundColor: 'transparent' }}
                ref={(elem) => (this.pixi_container = elem)}
            >
                <IonFab vertical="bottom" horizontal="start">
                    <IonFabButton color="medium" onClick={() => this.canvas?.recenter()}>
                        <IonIcon icon={expand} />
                    </IonFabButton>
                </IonFab>

                <IonFab hidden={this.props.canvasMode !== 'imaging'} vertical="bottom" horizontal="end">
                    <IonFabButton
                        color="dark"
                        onClick={() => {
                            const futureSightVisibility = !this.state.future_sight_on;
                            this.setState({ ...this.state, future_sight_on: futureSightVisibility });
                            this.canvas?.setPreviewVisibility(futureSightVisibility);
                        }}
                    >
                        <IonIcon icon={this.state.future_sight_on ? eye : eyeOff} />
                    </IonFabButton>
                </IonFab>

                <IonFab hidden={this.props.canvasMode !== 'drawing'} vertical="bottom" horizontal="end">
                    <MenuFabButton
                        value={this.state.brush_mode}
                        openSide="start"
                        buttonsList={brushList}
                        onChange={(b) => {
                            console.log('change icon : ', b.id);
                            this.setBrushMode(b.id as BrushModeType);
                        }}
                    />
                </IonFab>
                <IonFab vertical="bottom" horizontal="end" style={{ marginBottom: '4em' }}>
                    <IonFabButton
                        size="small"
                        onMouseDown={this.handleIncreaseMouseDown}
                        onMouseUp={this.handleMouseUp}
                        onMouseLeave={this.handleMouseUp}
                    >
                        <IonIcon icon={add} />
                    </IonFabButton>
                    <IonFabButton
                        size="small"
                        title="Decrease brush/eraser size"
                        onMouseDown={this.handleDecreaseMouseDown}
                        onMouseUp={this.handleMouseUp}
                        onMouseLeave={this.handleMouseUp}
                    >
                        <IonIcon icon={remove} />
                    </IonFabButton>
                </IonFab>
            </div>
        );
    }
}

export default CanvasContainer;
