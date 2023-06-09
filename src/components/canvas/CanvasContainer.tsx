import { Component } from 'react';
import { IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { expand, brush, browsers, add, remove, eye, eyeOff } from 'ionicons/icons';
import * as isEqual from 'lodash.isequal';
import * as debounce from 'lodash.debounce';
import * as PIXI from 'pixi.js';
//warning: this pixi.js version is modified to use a custom loader on webgl with gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
// https://stackoverflow.com/questions/42789896/webgl-error-arraybuffer-not-big-enough-for-request-in-case-of-gl-luminance
// this fix is on the import on utils/pixibufferloader
import '../../utils/pixibufferloader';
import * as pixi_viewport from 'pixi-viewport';

import { NdArray, TypedArray } from 'ndarray';
import { clamp } from '../../utils/math';
import { sfetch } from '../../utils/simplerequest';

import '../../styles/CanvasContainer.css';
import MenuFabButton from './MenuFabButton';
import { dispatch, subscribe, unsubscribe } from '../../utils/eventbus';
import { defaultColormap } from '../../utils/colormap';
import { CropAxisInterface, CropShapeInterface } from '../tools_menu/utils/CropInterface';
import { ImageShapeInterface } from '../tools_menu/utils/ImageShapeInterface';
import { ImageInfoInterface } from '../main_menu/file/utils/ImageInfoInterface';

type BrushModeType = 'draw_brush' | 'erase_brush' | 'no_brush';

class Brush {
    label: number;

    size = 0;

    color: number;

    radius = 0;

    mode: BrushModeType = 'draw_brush';

    maintainExtendLabel: boolean;

    canvas: HTMLCanvasElement;

    context: CanvasRenderingContext2D;

    cursor: PIXI.Graphics;

    colors: Array<[number, number, number]>;

    constructor(colors: [number, number, number][]) {
        this.label = 0;
        this.color = 0xffffff;
        this.maintainExtendLabel = false;

        this.canvas = document.createElement('canvas');

        this.context = this.canvas.getContext('2d')!;

        this.colors = colors;

        this.cursor = this.createBrush();

        this.setSize(4);

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
        context.fillStyle = `rgb(${r},${g},${b})`;
        context.arc(x, y, this.radius, 0, 2 * Math.PI);
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

    extendLabel: boolean;

    maintainExtendLabel: boolean;

    mergeLabel: boolean;

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
        this.extendLabel = false;
        this.maintainExtendLabel = false;
        this.mergeLabel = false;

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
    }

    onPointerMove(event: any) {
        let currPosition;

        if (event.type === 'wheel') {
            this.viewport.plugins.resume('drag');
            currPosition = this.viewport.toWorld(event.offsetX, event.offsetY);
        } else {
            currPosition = this.viewport.toWorld(event.data.global);
            if (event.data.pointerType === 'touch' && event.data.originalEvent.touches.length > 1) {
                this.isPainting = false;
                return;
            }
        }

        this.brush.cursor.position.x = currPosition.x - this.brush.size / 2;
        this.brush.cursor.position.y = currPosition.y - this.brush.size / 2;

        if (!this.isPainting) return;

        this.pointsBuffer = [...this.pointsBuffer, ...this.draw(currPosition)];

        this.prevPosition = currPosition;
    }

    onPointerUp(event: any) {
        this.viewport.plugins.resume('drag');

        if (!this.isPainting) return;

        const currPosition = this.viewport.toWorld(event.data.global);
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

    setExtendLabel(flag: boolean) {
        this.extendLabel = flag;
    }

    draw(currPosition: PIXI.Point): [number, number][] {
        const context = this.annotation.context;
        const mode = this.brush_mode;

        if (mode === 'no_brush') {
            return [];
        } else if (this.extendLabel) {
            this.extendLabel = false;
            this.brush.cursor.visible = false;

            const data = {
                x_coord: Math.round(this.prevPosition.x),
                y_coord: Math.round(this.prevPosition.y),
                slice: this.sliceNum,
                axis: this.axis,
            };

            console.log('Finding label by click');
            void sfetch('POST', '/find_label_by_click', JSON.stringify(data), 'json').then((labelId: number) => {
                console.log('label ID found : ', labelId);
                if (labelId >= 0) {
                    this.brush.setLabel(labelId);
                    this.brush.updateColor();
                    this.setBrushMode('draw_brush');
                }
                this.brush.cursor.visible = true;
                dispatch('changeSelectedLabel', labelId);
                dispatch('isExtendLabelActivated', false);
            });
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

            dispatch('extendLabelOnMerge', this.maintainExtendLabel);

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
            rgbaData[idx] = color[0];
            rgbaData[idx + 1] = color[1];
            rgbaData[idx + 2] = color[2];
            rgbaData[idx + 3] = 128;
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

    private toUint8Array(img: NdArray<TypedArray>): Uint8Array {
        let uint8data: Uint8Array;

        let x = img.shape[1];
        const y = img.shape[0];

        const len = x * y;

        //TODO: implement for another dtypes
        if (img.dtype === 'uint8') {
            uint8data = img.data as Uint8Array;
        } else if (img.dtype === 'uint16') {
            const max = 65535.0 * this.imgMax;
            const min = 65535.0 * this.imgMin;
            const range = max - min;
            uint8data = new Uint8Array(len);
            for (let i = 0; i < len; ++i) {
                const val = clamp(min, img.data[i], max);
                x = 255 * (1.0 - (max - val) / range);
                uint8data[i] = x;
            }
        } else {
            uint8data = new Uint8Array(len);
            for (let i = 0; i < len; ++i) {
                const val = clamp(0.0, img.data[i], 1.0);
                x = 255 * val;
                uint8data[i] = x;
            }
        }

        return uint8data;
    }

    setFutureImage(futureSlice: NdArray<TypedArray>) {
        this.futureData = futureSlice;

        const x = futureSlice.shape[1];
        const y = futureSlice.shape[0];

        const uint8data = this.toUint8Array(futureSlice);
        const texture = this.textureFromSlice(uint8data, x, y);

        this.futureSlice.texture = texture;
    }

    deleteFutureImage() {
        this.futureData = undefined;
        this.futureSlice.texture = PIXI.Texture.EMPTY;
    }

    setMaintainExtend(flag: boolean) {
        this.maintainExtendLabel = flag;
    }

    setImage(imgSlice: NdArray<TypedArray>) {
        this.imgData = imgSlice;

        const uint8data = this.toUint8Array(imgSlice);

        const x = imgSlice.shape[1];
        const y = imgSlice.shape[0];

        this.x = x;
        this.y = y;

        this.annotation.setSize(x, y);

        const texture = this.textureFromSlice(uint8data, x, y);
        this.slice.texture = texture;

        // console.log('Image exists: Unlocking components.');
        // dispatch('LockComponents', false);
    }

    increaseBrushSize() {
        this.brush.setSize(this.brush.size + 1);
    }

    decreaseBrushSize() {
        if (this.brush.size <= 2) return;
        this.brush.setSize(this.brush.size - 1);
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
];

class CanvasContainer extends Component<ICanvasProps, ICanvasState> {
    pixi_container: HTMLDivElement | null;

    canvas: Canvas | null;

    onLabelSelected: (payload: any) => void = () => {};

    onImageLoaded: (payload: any) => void = () => {};

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

    onChangeStateBrush: (mode: BrushModeType) => void = () => {};

    onExtendLabel: (flag: boolean) => void = () => {};

    onExtendLabelOnMerge: (flag: boolean) => void = () => {};

    onCropPreviewMode: (activateCropPreview: boolean) => void = () => {};

    onCropShape: (cropShape: CropShapeInterface) => void = () => {};

    onCropPreviewColorChanged: (color: any) => void = () => {};

    onActivateSL: (sequentialLabelPayload: { isActivated: boolean; id: number }) => void = () => {};

    onSplitLabel: (flag: boolean) => void = () => {};

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

    getImageSlice() {
        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
        };

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
                void promise?.then(() => {
                    void sfetch('POST', '/is_annotation_empty', '', 'json').then((createNewAnnot: boolean) => {
                        if (createNewAnnot) {
                            this.newAnnotation();
                        }
                    });
                });
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

            this.onChangeStateBrush = (mode: BrushModeType) => {
                this.setBrushMode(mode);
            };

            this.onExtendLabel = (flag: boolean) => {
                console.log('flag val : ', flag);
                this.canvas!.setExtendLabel(flag);
                this.canvas!.showBrush(false);
            };

            this.onExtendLabelOnMerge = (flag: boolean) => {
                this.canvas!.setMaintainExtend(flag);
                if (flag) {
                    this.onExtendLabel(flag);
                }
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

            this.onSplitLabel = (flag: boolean) => {
                this.onActivateSL({
                    isActivated: flag,
                    id: this.canvas!.getLabelTableLen(),
                });
            };

            subscribe('futureChanged', this.onFutureChanged);
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
            subscribe('ExtendLabel', this.onExtendLabel);
            subscribe('extendLabelOnMerge', this.onExtendLabelOnMerge);
            subscribe('cropShape', this.onCropShape);
            subscribe('cropPreviewMode', this.onCropPreviewMode);
            subscribe('cropPreviewColorchanged', this.onCropPreviewColorChanged);
            subscribe('activateSL', this.onActivateSL);
            subscribe('splitLabel', this.onSplitLabel);
        }
    }

    componentWillUnmount() {
        unsubscribe('futureChanged', this.onFutureChanged);
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
        unsubscribe('ExtendLabel', this.onExtendLabel);
        unsubscribe('extendLabelOnMerge', this.onExtendLabelOnMerge);
        unsubscribe('cropShape', this.onCropShape);
        unsubscribe('cropPreviewMode', this.onCropPreviewMode);
        unsubscribe('cropPreviewColorchanged', this.onCropPreviewColorChanged);
        unsubscribe('activateSL', this.onActivateSL);
        unsubscribe('splitLabel', this.onSplitLabel);
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
                        onClick={() => {
                            this.canvas?.increaseBrushSize();
                        }}
                    >
                        <IonIcon icon={add} />
                    </IonFabButton>
                    <IonFabButton
                        size="small"
                        title="Decrease brush/eraser size"
                        onClick={() => {
                            this.canvas?.decreaseBrushSize();
                        }}
                    >
                        <IonIcon icon={remove} />
                    </IonFabButton>
                </IonFab>
            </div>
        );
    }
}

export default CanvasContainer;
