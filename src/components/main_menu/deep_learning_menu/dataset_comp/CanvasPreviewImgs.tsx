import * as PIXI from 'pixi.js';
import * as pixi_viewport from 'pixi-viewport';
import { NdArray, TypedArray } from 'ndarray';
import { sfetch } from '../../../../utils/simplerequest';
import { dispatch, subscribe, unsubscribe } from '../../../../utils/eventbus';
import { clamp } from '../../../../utils/math';
import { Component, Fragment } from 'react';
import * as debounce from 'lodash.debounce';
import { IonCol, IonItem, IonItemDivider, IonRow } from '@ionic/react';

/**
 * This component creates the canvas for preview canvas
 */

class Canvas {
    app: PIXI.Application;

    viewport: pixi_viewport.Viewport;

    div: HTMLDivElement;

    canvas: HTMLCanvasElement;

    context: CanvasRenderingContext2D;

    slice: PIXI.Sprite;

    x: number;

    y: number;

    imgData?: NdArray<TypedArray>;

    imgMin = 0.0;

    imgMax = 1.0;

    axis: 'XY' | 'XZ' | 'YZ';

    sliceNum: number;

    constructor(div: HTMLDivElement, axis: 'XY' | 'XZ' | 'YZ', sliceNum: number) {
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        this.app = new PIXI.Application({
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

        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d')!;

        this.app.stage.addChild(this.viewport);
        this.viewport.addChild(this.slice);

        this.div = div;
        this.div.appendChild(this.app.view);

        this.x = this.y = 0;

        this.axis = axis;
        this.sliceNum = sliceNum;
    }

    setSliceNum(sliceNum: number) {
        this.sliceNum = sliceNum;
    }

    setAxis(axis: 'XY' | 'XZ' | 'YZ') {
        this.axis = axis;
    }

    recenter(w: number = this.x, h: number = this.y) {
        const test = {
            w,
            x: this.x,
            h,
            y: this.y,
        };
        console.table(test);
        this.viewport.moveCenter(w / 2, h / 2);
        this.viewport.fit(true, w, h);
    }

    private textureFromSlice(slice: Uint8Array, x: number, y: number, pformat = PIXI.FORMATS.LUMINANCE) {
        const texture = PIXI.Texture.fromBuffer(slice, x, y, {
            type: PIXI.TYPES.UNSIGNED_BYTE,
            format: pformat,
        });
        return texture;
    }

    //TODO : This function is very important. Because this display the image
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

    setImage(imgSlice: NdArray<TypedArray>) {
        this.imgData = imgSlice;

        const uint8data = this.toUint8Array(imgSlice);

        const x = imgSlice.shape[1];
        const y = imgSlice.shape[0];

        this.x = x;
        this.y = y;

        this.slice.texture = this.textureFromSlice(uint8data, x, y);
    }

    resize() {
        const center = this.viewport.center;

        this.app.renderer.resize(this.div.offsetWidth, this.div.offsetHeight);
        this.viewport.resize(this.div.offsetWidth, this.div.offsetHeight);

        this.viewport.moveCenter(center);
    }
}

interface IPreviewProps {
    slice: number;
    axis: 'XY' | 'XZ' | 'YZ';
}

class PreviewContainer extends Component<IPreviewProps> {
    pixi_container: HTMLDivElement | null;

    pixi_container_preview: HTMLDivElement | null;

    canvas: Canvas | null;

    canvas_preview: Canvas | null;

    constructor(props: IPreviewProps) {
        super(props);
        this.pixi_container = null;
        this.pixi_container_preview = null;
        this.canvas = null;
        this.canvas_preview = null;
    }

    fetchAll = (recenter = false) => {
        console.log('update ...', this.props.slice);
        return this.getImageSlice().then(() => {
            if (recenter) {
                this.canvas!.recenter();
                this.canvas_preview!.recenter();
            }
        });
    };

    fetchAllDebounced = debounce(this.fetchAll, 250);

    getImageSlice() {
        const params = {
            axis: this.props.axis,
            slice: this.props.slice,
        };

        //TODO : need to edit this part to receive the the preview image
        return sfetch('POST', '/get_image_slice/image', JSON.stringify(params), 'gzip/numpyndarray').then(
            (imgSlice) => {
                this.canvas!.setImage(imgSlice);
                this.canvas_preview!.setImage(imgSlice);
            }
        );
    }

    componentDidMount() {
        // the element is the DOM object that we will use as container to add pixi stage(canvas)
        const elem = this.pixi_container;
        if (this && elem) {
            this.canvas = new Canvas(elem, this.props.axis, this.props.slice);
            this.canvas_preview = new Canvas(elem, this.props.axis, this.props.slice);
            setTimeout(() => {
                this.canvas!.resize();
                this.canvas_preview!.resize();
            }, 200);
            console.log(this.canvas.viewport);
            console.log(this.pixi_container);

            window.addEventListener('resize', (evt) => {
                console.log('resize ', evt);
                this.canvas!.resize();
                this.canvas_preview!.resize();
            });

            //Maybe i'll need to use this commands later
            // this.canvas?.setSliceNum(this.props.slice);
            // this.canvas?.setAxis(this.props.axis);
            void this.fetchAll(true);

            // Place the subscribed events here
        }
    }

    componentWillUnmount() {
        //I'll unsubscribe the events here
    }

    componentDidUpdate() {
        this.setState({ ...this.state, future_sight_on: false });
        this.canvas?.setSliceNum(this.props.slice);
        this.canvas?.setAxis(this.props.axis);
        this.canvas_preview?.setSliceNum(this.props.slice);
        this.canvas_preview?.setAxis(this.props.axis);
        void this.fetchAllDebounced(true);
    }

    render() {
        return (
            <Fragment>
                <IonItem>
                    <IonRow>
                        <IonCol>
                            <div
                                id={'preview-root'}
                                style={{ backgroundColor: 'transparent' }}
                                ref={(elem) => (this.pixi_container = elem)}
                            />
                        </IonCol>
                        <IonItemDivider />
                        <IonCol>
                            <div
                                id={'preview-root-2'}
                                style={{ backgroundColor: 'transparent' }}
                                ref={(elem) => (this.pixi_container_preview = elem)}
                            />
                        </IonCol>
                    </IonRow>
                </IonItem>
            </Fragment>
        );
    }
}

export default PreviewContainer;
