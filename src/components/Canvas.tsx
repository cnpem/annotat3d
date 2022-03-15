import {useState, Component, Ref, createRef} from 'react';
import {IonButton, IonFab, IonFabButton, IonIcon} from '@ionic/react';
import { expand, brush, browsers } from 'ionicons/icons';
import { debounce } from "lodash";
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

import './Canvas.css';
import {InteractionEvent} from 'pixi.js';

class Brush {

    label: number;
    size: number;
    color: number;
    radius: number;

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    cursor: PIXI.Graphics;

    colors: Array<[number, number, number]>;

    constructor() {
        this.label = 0;
        this.size = 20;
        this.color = 0xffffff;
        this.radius = 5;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;

        this.context = this.canvas.getContext('2d')!;

        // this.colors = ["red", "blue", "yellow", "magenta", "green", "indigo", "darkorange", "cyan", "pink", "yellowgreen"]
        this.colors = [
            [255, 0, 0],
            [0, 0, 255],
            [255, 255, 0],
            [255, 0, 255],
            [0, 128, 0],
            [75, 0, 130],
            [255, 140, 0],
            [0, 255, 255],
            [255, 192, 203],
            [154, 205, 50],
        ];

        this.cursor = this.createBrush();

        //const blackMatrix = new PIXI.filters.ColorMatrixFilter();
        //blackMatrix.brightness(0);
        //const inverseMatrix = new PIXI.filters.ColorMatrixFilter();
        //inverseMatrix.negative();
        //this.cursor.filters = [blackMatrix, inverseMatrix];
        //this.cursor.blendMode = PIXI.BLEND_MODES.ADD;
        //this.cursor.pivot = 5; //pivot

        this.update();
    }

    private updateBrush() {
        const gr = this.cursor;
        gr.clear();
        gr.beginFill(this.color);
        gr.drawCircle(this.size / 2, this.size / 2, this.radius);
        gr.endFill();
    }

    private createBrush() {
        const cursor = new PIXI.Graphics();
        cursor.alpha = 0.5;
        return cursor;
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
        const color = this.colors[(this.label) % this.colors.length];
        this.context.fillStyle = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';

        this.context.rect(0, 0, this.size, this.size);
        this.context.fill();

        this.color = this.rgbToHex(...color);
        this.updateBrush();

    }
}


class Annotation {

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    sprite: PIXI.Sprite;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 0;
        this.canvas.height = 0;

        this.context = this.canvas.getContext('2d')!;

        this.sprite = new PIXI.Sprite();

        this.sprite.texture = PIXI.Texture.from(this.canvas);
    }

    draw(slice: NdArray<TypedArray>) {
        // colors = ["red", "blue", "yellow", "magenta", "green", "indigo", "darkorange", "cyan", "pink", "yellowgreen"]
        const colors = [
            [255, 0, 0],
            [0, 0, 255],
            [255, 255, 0],
            [255, 0, 255],
            [0, 128, 0],
            [75, 0, 130],
            [255, 140, 0],
            [0, 255, 255],
            [255, 192, 203],
            [154, 205, 50],
        ];

        this.canvas.width = slice.shape[1];
        this.canvas.height = slice.shape[0];

        //console.log("draw slice: ", mean(slice), std(slice));

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

    slice: PIXI.Sprite;
    labelSlice: PIXI.Sprite;
    superpixelSlice: PIXI.Sprite;

    x: number;
    y: number;

    constructor(div: HTMLDivElement) {
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


        this.annotation = new Annotation();
        this.brush = new Brush();

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

        //this.setSuperpixelVisibility(false);
        this.setLabelVisibility(true);
    }


    onPointerDown(event: any) {
        if (event.data.pointerType == 'mouse') {
            if (event.data.button != 0) return;
        } else if (event.data.pointerType == 'touch') {
            this.viewport.plugins.pause('drag');
            // canvas.brush.cursor.visible = false
        }

        console.log("down");

        this.isPainting = true;

        this.prevPosition = this.viewport.toWorld(event.data.global);
    }


    onPointerMove(event: any) {

        let currPosition;

        if (event.type == 'wheel') {
            this.viewport.plugins.resume('drag');
            currPosition = this.viewport.toWorld(event.offsetX, event.offsetY);
        } else {
            currPosition = this.viewport.toWorld(event.data.global);
            if (event.data.pointerType == 'touch' && event.data.originalEvent.touches.length > 1) {
                this.isPainting = false;
                return;
            }
        }

        //document.getElementById('brush_x').value = currPosition.x;
        //document.getElementById('brush_y').value = currPosition.y;

        this.brush.cursor.position.x = currPosition.x - this.brush.size / 2;
        this.brush.cursor.position.y = currPosition.y - this.brush.size / 2;

        if (!this.isPainting) return;

        //const checked = Array.from(brushModeElm).find((radio) => radio.checked)?.value ? true : false;

        const checked = 'draw_brush';

        const data = {
            'coords': this.draw(currPosition, checked),
            'z': 0,
            'size': this.brush.size,
            'label': this.brush.label,
            'mode': checked,
        };
        //sxhr('POST', '/draw', () => {}, JSON.stringify(data));

        this.prevPosition = currPosition;
    }


    onPointerUp(event: any) {

        this.viewport.plugins.resume('drag');

        const currPosition = this.viewport.toWorld(event.data.global);
        this.prevPosition = currPosition;

        //const checked = Array.from(brushModeElm).find((radio) => radio.checked).value;

        const checked = 'draw_brush';

        if (this.isPainting) {
            const data = {
                'coords': this.draw(currPosition, checked),
                'z': 0,
                'size': this.brush.size,
                'label': this.brush.label,
                'mode': checked,
            };
            //sxhr('POST', '/draw', () => {}, JSON.stringify(data));
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

    draw(currPosition: PIXI.Point, mode: string) {

        if (mode == 'erase_brush') {
            this.annotation.context.globalCompositeOperation = 'destination-out';
        } else {
            this.annotation.context.globalCompositeOperation = 'source-over';
        }

        if (currPosition == this.prevPosition) {
            const x = Math.round(this.prevPosition.x - this.brush.size / 2);
            const y = Math.round(this.prevPosition.y - this.brush.size / 2);
            this.annotation.context.drawImage(this.brush.canvas, x, y, this.brush.size, this.brush.size);
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
            this.annotation.context.drawImage(this.brush.canvas, x, y, this.brush.size, this.brush.size);
            coords.push([x, y]);
        }
        this.annotation.sprite.texture.update();
        return coords;
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

        //console.log("set label image: ", labelSlice);
        //console.log(mean(labelSlice.data), std(labelSlice.data));

        const len = labelSlice.data.length;
        let rgbaData = new Uint8Array(len * 4);

        //change to use the annotat3d npy colormaps
        const colors = [
            [255, 0, 0],
            [0, 0, 255],
            [255, 255, 0],
            [255, 0, 255],
            [0, 128, 0],
            [75, 0, 130],
            [255, 140, 0],
            [0, 255, 255],
            [255, 192, 203],
            [154, 205, 50],
        ];

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
        if (img_slice.dtype == 'uint8') {
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

        const texture = this.textureFromSlice(uint8data, x, y);
        this.slice.texture = texture;
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

interface ICanvasProps {
    z: number
}

interface ICanvasState {
    brush_mode: string
}

class CanvasContainer extends Component<ICanvasProps, ICanvasState> {


    pixi_container: HTMLDivElement | null;
    canvas: Canvas | null;

    constructor(props: any) {
        super(props);
        this.pixi_container = null;
        this.canvas = null;
        this.state = { 'brush_mode': 'draw_brush' };

    }

    fetchAllDebounced = debounce( () => {
        console.log("update ...", this.props.z);
        this.getImageSlice()
            .then(() => {
                //this.canvas!.recenter()
                this.getSuperpixelSlice();
                this.getAnnotSlice();
                this.get_label_slice();
            });
        }, 250);

    getSuperpixelSlice() {

        const params = {
            'z': this.props.z,
        };

        sfetch('POST', '/get_superpixel_slice', JSON.stringify(params), 'gzip/numpyndarray')
        .then((superpixelSlice) => {
            //console.log("superpixel response");
            //console.log(superpixelSlice.shape);
            this.canvas!!.setSuperpixelImage(superpixelSlice);
        });
    }

    getImageSlice() {
        //console.log('get image slice hue');
        const z = this.props.z;
        const params = {
            'z': z,
        };

        return sfetch('POST', '/get_image_slice/image', JSON.stringify(params), 'gzip/numpyndarray')
        .then(imgSlice => {
            //console.log(imgSlice);
            this.canvas!!.setImage(imgSlice);
            //this.canvas!!.recenter();
        });
    }

    getAnnotSlice() {

        const data = {
            'z': this.props.z,
        };

        sfetch('POST', '/get_annot_slice', JSON.stringify(data), 'gzip/numpyndarray')
        .then((slice) => {
            this.canvas!!.annotation.draw(slice);
        });
    }

    get_label_slice() {

        const params = {
            'z': this.props.z,
        };

        sfetch('POST', '/get_image_slice/label', JSON.stringify(params), 'gzip/numpyndarray')
            .then(labelSlice => {
                this.canvas!!.setLabelImage(labelSlice);
            });

    }

    componentDidMount() {
        // the element is the DOM object that we will use as container to add pixi stage(canvas)
        //console.log("create pixi");
        //console.log(this);
        const elem = this.pixi_container;
        if (this && elem) {
            this.canvas = new Canvas(elem);
            setTimeout(() => this.canvas!.resize(), 200);
            console.log(this.canvas.viewport);
            console.log(this.pixi_container);

            window.addEventListener('resize', (evt) => {
                console.log('resize ', evt);
                this.canvas!.resize();
            });

            this.fetchAllDebounced();
        }

    }

    componentDidUpdate() {
        this.fetchAllDebounced();
    }

    render() {
        return (
            <div id="root" className="canvas" style={ {"backgroundColor": "transparent"}  } ref={elem => this.pixi_container = elem} >
                <IonFab vertical="bottom" horizontal="start">
                    <IonFabButton color="medium" onClick={() => this.canvas?.recenter()}><IonIcon icon={expand}/></IonFabButton>
                </IonFab>

                <IonFab vertical="bottom" horizontal="end">
                    <IonFabButton size={this.state.brush_mode === 'erase_brush' ? undefined : "small"} color={this.state.brush_mode === 'erase_brush' ? "primary" : "outline"}  onClick={() => this.setState({'brush_mode': 'erase_brush'})}><IonIcon icon={browsers}/></IonFabButton>

                    <IonFabButton size={this.state.brush_mode === 'draw_brush' ? undefined : "small"} color={this.state.brush_mode === 'draw_brush' ? "primary" : "outline"}  onClick={() => this.setState({'brush_mode': 'draw_brush'})}><IonIcon icon={brush}/></IonFabButton>
                </IonFab>
            </div>
        );
    }
};

//const CanvasContainer: React.FC = () => {

//const [canvas, setCanvas] = useState<Canvas>(new Canvas());

//return (
//<div id="Canvas">
//</div>
//);
//};

export default CanvasContainer;
