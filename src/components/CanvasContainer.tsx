import {Component} from 'react';
import {IonFab, IonFabButton, IonIcon} from '@ionic/react';
import { expand, brush, browsers, add, remove } from 'ionicons/icons';
import { debounce, isEqual } from "lodash";
import * as PIXI from 'pixi.js';
//warning: this pixi.js version is modified to use a custom loader on webgl with gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
// https://stackoverflow.com/questions/42789896/webgl-error-arraybuffer-not-big-enough-for-request-in-case-of-gl-luminance
// this fix is on the import on utils/pixibufferloader
import '../utils/pixibufferloader';
import * as pixi_viewport from 'pixi-viewport';
//import npyjs from 'npyjs';
import { NdArray, TypedArray } from 'ndarray';
import { mean, std } from '../utils/math';
import { sfetch } from '../utils/simplerequest';

import './styles/CanvasContainer.css';
import MenuFabButton from './MenuFabButton';
import {subscribe, unsubscribe} from '../utils/eventbus';

class Brush {

    label: number;
    size: number = 0;
    color: number;
    radius: number = 0;

    mode: brush_mode_type = 'draw_brush';

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

        this.setSize(4);

        this.update();
    }

    setMode(mode: brush_mode_type) {
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
        const [r, g, b] = this.colors[(this.label) % this.colors.length];
        context.beginPath();
        context.fillStyle = `rgb(${r},${g},${b})`;
        context.arc(x + this.size / 2, y + this.size / 2, this.radius, 0, 2 * Math.PI);
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

    private rgbToHex(r: number, g: number, b: number) {
        const bin = (r << 16) | (g << 8) | b;
        return bin;
    }

    update() {
        if (this.mode === 'draw_brush') {
            const color = this.colors[(this.label) % this.colors.length];
            this.color = this.rgbToHex(...color);
        } else {
            this.color = 0xFFFFFF;
        }

        this.updateBrush();
    }
}


class Annotation {

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    sprite: PIXI.Sprite;

    colors: [number, number, number][];

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
        this.canvas.width = x;
        this.canvas.height = y;
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.sprite.texture.update();
    }

    draw(slice: NdArray<TypedArray>) {
        const colors = this.colors;

        console.log('draw slice: ', slice.shape);

        this.canvas.width = slice.shape[1];
        this.canvas.height = slice.shape[0];

        //console.log("draw slice: ", mean(slice), std(slice));

        //this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

        const data = imageData.data;
        for (let i = 0; i < slice.data.length; i++) {
            if (slice.data[i] >= 0) {
                const color = colors[(slice.data[i]) % colors.length];
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

    app: PIXI.Application;
    viewport: pixi_viewport.Viewport;

    div: HTMLDivElement;

    prevPosition: any;

    isPainting: boolean;

    annotation: Annotation;
    brush: Brush;

    brush_mode: 'draw_brush' | 'erase_brush';

    slice: PIXI.Sprite;
    labelSlice: PIXI.Sprite;
    superpixelSlice: PIXI.Sprite;

    colors: [number, number, number][];

    x: number;
    y: number;

    axis: 'XY' | 'XZ' | 'YZ';
    sliceNum: number;

    newAnnotation() {
        sfetch('POST', '/new_annot');
    }

    constructor(div: HTMLDivElement, colors: [number, number, number][], axis: 'XY' | 'XZ' | 'YZ', sliceNum: number) {
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        this.app = new PIXI.Application({
            backgroundAlpha: 0.1,
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

        this.superpixelSlice = new PIXI.Sprite();
        this.superpixelSlice.tint = 0xff00ff
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
        this.prevPosition = null;

        this.app.stage.addChild(this.viewport);
        this.viewport.addChild(this.slice);
        this.viewport.addChild(this.superpixelSlice);
        this.viewport.addChild(this.labelSlice);
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

        //this.setSuperpixelVisibility(false);
        this.setLabelVisibility(true);

        this.newAnnotation();
    }

    setSliceNum(sliceNum: number) {
        this.sliceNum = sliceNum;
    }

    setAxis(axis: 'XY' | 'XZ' | 'YZ') {
        this.axis = axis;
    }

    onPointerDown(event: any) {
        if (event.data.pointerType === 'mouse') {
            if (event.data.button !== 0) return;
        } else if (event.data.pointerType === 'touch') {
            this.viewport.plugins.pause('drag');
            // canvas.brush.cursor.visible = false
        }

        console.log("down");

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

        //document.getElementById('brush_x').value = currPosition.x;
        //document.getElementById('brush_y').value = currPosition.y;

        this.brush.cursor.position.x = currPosition.x - this.brush.size / 2;
        this.brush.cursor.position.y = currPosition.y - this.brush.size / 2;

        if (!this.isPainting) return;

        const data = {
            'coords': this.draw(currPosition),
            'axis': this.axis,
            'slice': this.sliceNum,
            'size': this.brush.size,
            'label': this.brush.label,
            'mode': this.brush_mode,
        };

        sfetch('POST', '/draw', JSON.stringify(data));

        this.prevPosition = currPosition;
    }


    onPointerUp(event: any) {

        this.viewport.plugins.resume('drag');

        const currPosition = this.viewport.toWorld(event.data.global);
        this.prevPosition = currPosition;

        if (this.isPainting) {
            const data = {
                'coords': this.draw(currPosition),
                'slice': this.sliceNum,
                'axis': this.axis,
                'size': this.brush.size,
                'label': this.brush.label,
                'mode': this.brush_mode,
            };
            sfetch('POST', '/draw', JSON.stringify(data));
        }

        console.log("up");
        this.isPainting = false;
    }

    distanceBetween(point1: PIXI.Point, point2: PIXI.Point) {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    angleBetween(point1: PIXI.Point, point2: PIXI.Point) {
        return Math.atan2(point2.x - point1.x, point2.y - point1.y);
    }

    draw(currPosition: PIXI.Point) {

        const context = this.annotation.context;
        const mode = this.brush_mode;

        console.log('draw');

        if (mode === 'erase_brush') {
            this.annotation.context.globalCompositeOperation = 'destination-out';
        } else {
            this.annotation.context.globalCompositeOperation = 'source-over';
        }

        if (currPosition === this.prevPosition) {
            const x = Math.round(this.prevPosition.x - this.brush.size / 2);
            const y = Math.round(this.prevPosition.y - this.brush.size / 2);
            console.log('context draw image 1');

            this.brush.contextDrawBrush(context, x, y);

            this.annotation.sprite.texture.update();
            return [
                [x, y],
            ];
        }

        const coords = [];
        const dist = this.distanceBetween(this.prevPosition, currPosition);
        const angle = this.angleBetween(this.prevPosition, currPosition);
        for (let i = 0; i < dist; i++) {
            const x = Math.round(this.prevPosition.x + Math.sin(angle) * i - this.brush.size / 2);
            const y = Math.round(this.prevPosition.y + Math.cos(angle) * i - this.brush.size / 2);
            console.log('context draw image 2');
            this.brush.contextDrawBrush(context, x, y);
            coords.push([x, y]);
        }
        this.annotation.sprite.texture.update();
        return coords;
    }

    setBrushMode(mode: brush_mode_type) {
        this.brush_mode = mode;
        this.brush.setMode(mode);
    }

    setSuperpixelVisibility(visible: boolean = true) {
        this.superpixelSlice.visible = visible;
    }

    setLabelVisibility(visible: boolean = true) {
        this.labelSlice.visible = visible;
    }

    private textureFromSlice(slice: Uint8Array, x: number, y: number, pformat = PIXI.FORMATS.LUMINANCE) {
        const texture = PIXI.Texture.fromBuffer(slice, x, y, {
            type: PIXI.TYPES.UNSIGNED_BYTE,
            format: pformat,
        });
        return texture;
    }

    setLabelImage(labelSlice: NdArray<TypedArray>) {
        const x = labelSlice.shape[1];
        const y = labelSlice.shape[0];

        console.log("set label image: ", labelSlice);
        console.log(mean(labelSlice.data), std(labelSlice.data));

        const len = labelSlice.data.length;
        let rgbaData = new Uint8Array(len * 4);

        const colors = this.colors;

        for (let i = 0; i < len; ++i) {
            const idx = i * 4;
            const label = labelSlice.data[i];
            if (label <= 0)
                continue;
            const color = colors[label];
            rgbaData[idx] = color[0];
            rgbaData[idx + 1] = color[1];
            rgbaData[idx + 2] = color[2];
            rgbaData[idx + 3] = 128;
        }
        const texture = this.textureFromSlice(rgbaData, x, y, PIXI.FORMATS.RGBA);
        this.labelSlice.texture = texture;
    }

    setImage(img_slice: NdArray<TypedArray>) {

        let uint8data: Uint8Array;

        const x = img_slice.shape[1];
        const y = img_slice.shape[0];

        const len = x*y;

        //TODO: implement for another dtypes
        if (img_slice.dtype === 'uint8') {
            uint8data = img_slice.data as Uint8Array;
        } else {
            uint8data = new Uint8Array(len);
            for (let i = 0; i < len; ++i) {
                const x = 255 * (1 - (65535.0 - img_slice.data[i]) / 65535);
                uint8data[i] = x;
                //console.log(uint8data[i]);
            }
        }

        this.x = x;
        this.y = y;

        this.annotation.setSize(x, y);
        this.annotation.clear();

        const texture = this.textureFromSlice(uint8data, x, y);
        this.slice.texture = texture;
    }

    increaseBrushSize() {
        this.brush.setSize(this.brush.size + 1);
    }

    decreaseBrushSize() {
        if (this.brush.size <= 1)
            return;
        this.brush.setSize(this.brush.size - 1);
    }

    setSuperpixelImage(superpixel_slice: NdArray<TypedArray>) {
        const uint8data = superpixel_slice.data.map(x => x * 255) as Uint8Array;
        const x = superpixel_slice.shape[1];
        const y = superpixel_slice.shape[0];
        //console.log("I am setting superpixel hue hue huei: ", x, y);
        //console.log(mean(uint8data), std(uint8data));
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

type brush_mode_type = 'draw_brush' | 'erase_brush';

interface ICanvasProps {
    slice: number;
    axis: 'XY' | 'XZ' | 'YZ';
    colors: [number, number, number][];
}

interface ICanvasState {
    brush_mode: brush_mode_type;
}

const brushList = [
    {
        id: 'draw_brush',
        logo: brush
    },
    {
        id: 'erase_brush',
        logo: browsers
    }
];

class CanvasContainer extends Component<ICanvasProps, ICanvasState> {


    pixi_container: HTMLDivElement | null;
    canvas: Canvas | null;
    onLabelSelected: (payload: any) => void = () => {};
    onImageLoaded: () => void = () => {};

    constructor(props: ICanvasProps) {
        super(props);
        this.pixi_container = null;
        this.canvas = null;
        this.state = { brush_mode: 'draw_brush' };
    }

    fetchAllDebounced = debounce( (recenter: boolean = false) => {
        console.log("update ...", this.props.slice);
        this.getImageSlice()
        .then(() => {
            if (recenter) {
                this.canvas!.recenter();
            }
            this.getSuperpixelSlice();
            this.getAnnotSlice();
            this.get_label_slice();
        });
    }, 250);

    getSuperpixelSlice() {

        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
        };

        sfetch('POST', '/get_superpixel_slice', JSON.stringify(params), 'gzip/numpyndarray')
        .then((superpixelSlice) => {
            this.canvas!!.setSuperpixelImage(superpixelSlice);
        });
    }

    getImageSlice() {

        const params = {
            'axis': this.props.axis,
            'slice': this.props.slice,
        };

        return sfetch('POST', '/get_image_slice/image', JSON.stringify(params), 'gzip/numpyndarray')
        .then(imgSlice => {
            this.canvas!!.setImage(imgSlice);
        });
    }

    getAnnotSlice() {

        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
        };

        console.log('get annot slice');
        sfetch('POST', '/get_annot_slice', JSON.stringify(params), 'gzip/numpyndarray')
        .then((slice) => {
            console.log('annot slice');
            this.canvas!!.annotation.draw(slice);
        });
    }

    get_label_slice() {

        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
        };

        sfetch('POST', '/get_image_slice/label', JSON.stringify(params), 'gzip/numpyndarray')
        .then(labelSlice => {
            this.canvas!!.setLabelImage(labelSlice);
        });

    }

    setBrushMode(brush_mode: brush_mode_type) {
        this.setState({brush_mode: brush_mode});
        this.canvas!!.setBrushMode(brush_mode);
    }

    componentDidMount() {
        // the element is the DOM object that we will use as container to add pixi stage(canvas)
        const elem = this.pixi_container;
        if (this && elem) {
            this.canvas = new Canvas(elem, this.props.colors,
                                     this.props.axis, this.props.slice);
            setTimeout(() => this.canvas!.resize(), 200);
            console.log(this.canvas.viewport);
            console.log(this.pixi_container);

            window.addEventListener('resize', (evt) => {
                console.log('resize ', evt);
                this.canvas!.resize();
            });

            this.fetchAllDebounced(true);
            this.onLabelSelected =  (payload) => {
                console.log(payload);
                console.log('label selected');
                this.canvas?.brush.setLabel(payload.id);
            };

            this.onImageLoaded = () => {
                //page refresher
                this.fetchAllDebounced(true)
            }

            subscribe("ImageLoaded", this.onImageLoaded);
            subscribe('labelSelected', this.onLabelSelected);
        }
    }

    componentWillUnmount() {
        unsubscribe('labelSelected', this.onLabelSelected);
        unsubscribe("ImageLoaded", this.onImageLoaded)
    }

    componentDidUpdate(prevProps: ICanvasProps, prevState: ICanvasState) {
        if (isEqual(prevProps, this.props)) //if all properties are the same (deep comparison)
            return;
        this.canvas?.setSliceNum(this.props.slice);
        this.canvas?.setAxis(this.props.axis);
        this.fetchAllDebounced(prevProps.axis !== this.props.axis);
    }

    render() {
        return (
            <div id="root" className="canvas" style={ {"backgroundColor": "transparent"}  } ref={elem => this.pixi_container = elem} >
                <IonFab vertical="bottom" horizontal="start">
                    <IonFabButton color="medium" onClick={() => this.canvas?.recenter()}>
                        <IonIcon icon={expand}/>
                    </IonFabButton>
                </IonFab>
                <IonFab vertical="bottom" horizontal="end">

                    <MenuFabButton openSide="start" buttonsList={brushList} onChange={ (b) => { this.setBrushMode(b.id as brush_mode_type) } } />
                </IonFab>
                <IonFab vertical="bottom" horizontal="end" style={ {marginBottom: '4em'} }>
                    <IonFabButton size="small" onClick={() => {
                            this.canvas?.increaseBrushSize();
                        }}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                    <IonFabButton size="small" onClick={() => {
                            this.canvas?.decreaseBrushSize();
                        }}>
                        <IonIcon icon={remove}/>
                    </IonFabButton>
                    </IonFab>

            </div>
        );
    }
};

export default CanvasContainer;
