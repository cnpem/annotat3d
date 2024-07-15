import { Component } from 'react';
import { IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { expand, brush, browsers, add, remove, eye, eyeOff, colorFill } from 'ionicons/icons';
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
import { defaultColormap } from '../../utils/colormap';
import { CropAxisInterface, CropShapeInterface } from '../tools_menu/utils/CropInterface';
import { ImageShapeInterface } from '../tools_menu/utils/ImageShapeInterface';
import { ImageInfoInterface } from '../main_menu/file/utils/ImageInfoInterface';
import { ColorOptions } from '../../utils/colormaplist';

type BrushModeType = 'draw_brush' | 'erase_brush' | 'no_brush' | 'magic_wand';

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
        } else {
            this.cursor.visible = false;
        }
        this.updateBrush();
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
        tolerance: 500,
        blur_radius: 1,
    };

    void sfetch('POST', '/magic_wand/image', JSON.stringify(dataWand)).then((success) => {
        console.log(success, 'Magic wand applied!');
        dispatch('annotationChanged', null);
    });
}

class Annotation {
    canvas: HTMLCanvasElement;

    context: CanvasRenderingContext2D;

    sprite: PIXI.Sprite;

    colors: [number, number, number][];

    annotData?: NdArray<TypedArray>;

    constructor(colors: [number, number, number][]) {
        this.canvas = document.createElement('canvas');
        //this.canvas.width = 0;
        //this.canvas.height = 0;

        this.context = this.canvas.getContext('2d')!;

        this.sprite = new PIXI.Sprite();
        //this.sprite.tint = 0x00ff00;

        this.colors = colors;

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

        console.log('draw slice: ', slice.shape);

        this.clear();
        this.setSize(slice.shape[1], slice.shape[0]);

        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

        const data = imageData.data;

        for (let i = 0; i < slice.data.length; i++) {
            if (slice.data[i] >= 0) {
                const color = colors[slice.data[i] % colors.length];
                data[i * 4] = color[0];
                data[i * 4 + 1] = color[1];
                data[i * 4 + 2] = color[2];
                data[i * 4 + 3] = 255;
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

    constructor(div: HTMLDivElement, colors: [number, number, number][], axis: 'XY' | 'XZ' | 'YZ', sliceNum: number) {
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        this.app = new PIXI.Application({
            //backgroundAlpha: 0.99,
            backgroundColor: 0x303030,
        });

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

        this.futureSlice = new PIXI.Sprite();
        this.futureSlice.visible = false;

        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d')!;

        this.superpixelSlice = new PIXI.Sprite();
        this.superpixelSlice.tint = this.superpixelColor;
        this.superpixelSlice.alpha = 0.3;
        this.superpixelSlice.blendMode = PIXI.BLEND_MODES.ADD;
        this.superpixelSlice.scale.x = 0.5;
        this.superpixelSlice.scale.y = 0.5;
        this.superpixelSlice.visible = true;

        this.annotation = new Annotation(colors);
        this.brush = new Brush(colors);
        this.brush_mode = 'draw_brush';

        this.colors = colors;
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

    setColor(colors: { id: number; color: [number, number, number] }[]) {
        colors.forEach((color) => {
            this.colors[color.id] = color.color;
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

    onPointerDown(event: any) {
        if (event.data.pointerType === 'mouse') {
            if (event.data.button !== 0) return;
        } else if (event.data.pointerType === 'touch') {
            this.viewport.plugins.pause('drag');
            // canvas.brush.cursor.visible = false;
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

        this.brush.cursor.position.x = currPosition.x - Math.floor(this.brush.size / 2);
        this.brush.cursor.position.y = currPosition.y - Math.floor(this.brush.size / 2);

        if (!this.isPainting || this.brush_mode === 'magic_wand') return;

        this.pointsBuffer = [...this.pointsBuffer, ...this.draw(currPosition)];

        this.prevPosition = currPosition;
    }

    onPointerUp(event: any) {
        this.viewport.plugins.resume('drag');

        if (!this.isPainting) return;

        if (this.brush_mode === 'magic_wand') {
            this.viewport.plugins.pause('drag');
            void applyMagicWand(this.viewport, this.sliceNum, this.axis, this.brush.label, event);
            this.isPainting = false; // Reset painting flag
            return; // Exit the method early since the magic wand logic is
        }

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

        console.log('finish drawing on onPointerUp in Canvas');
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

        for (let i = 0; i < len; ++i) {
            const idx = i * 4;
            const label = labelSlice.data[i];
            if (label <= 0) continue;

            const color = colors[label];
            rgbaData[idx] = color[0]; //R
            rgbaData[idx + 1] = color[1]; //G
            rgbaData[idx + 2] = color[2]; //B
            rgbaData[idx + 3] = 128; //A
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
        // General scaling function bazsed on whether it's signed or unsigned
        if (isUnsigned) {
            // Assuming imgMax and imgMin are for normalized scaling within the unsigned range
            const max = this.imgMax;
            const min = this.imgMin;
            const range = max - min;
            scaleFunc = (value: number) => 1.0 - (max - clamp(min, value, max)) / range;
        } else {
            // For signed types, adjust min and max if necessary based on expected range adjustments
            const max = this.imgMax;
            const min = this.imgMin;
            const range = max - min;
            scaleFunc = (value: number) => 1.0 - Math.abs((max - clamp(min, value, max)) / range);
        }
        // Generate a colormap, using float for only losting info in the final conversion, not during map
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

const brushList = [
    {
        id: 'draw_brush',
        logo: brush,
    },
    {
        id: 'erase_brush',
        logo: browsers,
    },
    {
        id: 'magic_wand',
        logo: colorFill,
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

    onLabelColorsChanged!: (colors: { id: number; color: [number, number, number] }[]) => void;

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
        return sfetch('POST', '/get_image_slice/image', JSON.stringify(params), 'gzip/numpyndarray').then(
            (imgSlice) => {
                this.canvas!.setImage(imgSlice);
            }
        );
    }

    getFutureSlice() {
        //the preview image is just a single slice
        //so we always get the 0th XY slice
        const params = {
            axis: 'XY',
            slice: 0,
        };

        void sfetch('POST', '/get_image_slice/future', JSON.stringify(params), 'gzip/numpyndarray').then(
            (previewSlice) => {
                this.canvas?.setFutureImage(previewSlice);
                this.canvas?.setPreviewVisibility(true);
                this.setState({ ...this.state, future_sight_on: true });
            }
        );
    }

    getAnnotSlice() {
        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
        };

        console.log('get annot slice', params);
        void sfetch('POST', '/get_annot_slice', JSON.stringify(params), 'gzip/numpyndarray').then((slice) => {
            console.log('annot slice');
            this.canvas!.annotation.draw(slice);
        });
    }

    getLabelSlice() {
        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
            contour: this.state.label_contour,
        };

        void sfetch('POST', '/get_image_slice/label', JSON.stringify(params), 'gzip/numpyndarray').then(
            (labelSlice) => {
                this.canvas!.setLabelImage(labelSlice);
            }
        );
    }

    setBrushMode(brush_mode: BrushModeType) {
        this.setState({ brush_mode });
        this.canvas!.setBrushMode(brush_mode);
    }

    componentDidMount() {
        // the element is the DOM object that we will use as container to add pixi stage(canvas)
        const elem = this.pixi_container;
        if (this && elem) {
            this.canvas = new Canvas(elem, defaultColormap, this.props.axis, this.props.slice);
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
                this.getHistogram();
                void promise?.then(() => {
                    void sfetch('POST', '/is_annotation_empty', '', 'json').then((createNewAnnot: boolean) => {
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
        }
    }

    componentWillUnmount() {
        unsubscribe('futureChanged', this.onFutureChanged);
        unsubscribe('imageChanged', this.onImageChanged);
        unsubscribe('ColorMapChanged', this.onColorMapChanged);
        unsubscribe('labelColorsChanged', this.onLabelColorsChanged);
        unsubscribe('labelContourChanged', this.onLabelContourChanged);
        unsubscribe('labelColorsChanged', this.onLabelColorsChanged);
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
    }

    componentDidUpdate(prevProps: ICanvasProps, prevState: ICanvasState) {
        if (isEqual(prevProps, this.props)) return;

        if (this.props.canvasMode !== prevProps.canvasMode) {
            if (this.props.canvasMode === 'imaging') {
                this.setBrushMode('no_brush');
            } else {
                this.setBrushMode('draw_brush');
            }
        }
        this.setState({ ...this.state, future_sight_on: false });
        this.canvas?.setSliceNum(this.props.slice);
        this.canvas?.setAxis(this.props.axis);
        void this.fetchAllDebounced(true);
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
