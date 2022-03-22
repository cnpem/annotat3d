class Brush {
    constructor() {
        this.label = 0;
        this.size = 20;
        this.color = 0xffffff;
        this.radius = 5;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;

        this.context = this.canvas.getContext('2d');

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

        this.#createBrush();

        //const blackMatrix = new PIXI.filters.ColorMatrixFilter();
        //blackMatrix.brightness(0);
        //const inverseMatrix = new PIXI.filters.ColorMatrixFilter();
        //inverseMatrix.negative();
        //this.cursor.filters = [blackMatrix, inverseMatrix];
        //this.cursor.blendMode = PIXI.BLEND_MODES.ADD;
        //this.cursor.pivot = 5; //pivot

        this.update();
    }

    #updateBrush() {
        const gr = this.cursor;
        gr.clear();
        gr.beginFill(this.color);
        gr.drawCircle(this.size / 2, this.size / 2, this.radius);
        gr.endFill();
    }

    #createBrush() {
        this.cursor = new PIXI.Graphics();
        this.cursor.alpha = 0.5;
        return this.cursor;
    }

    setLabel(l) {
        this.label = l;
        this.update();
    }

    setSize(s) {
        this.size = s;

        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.radius = s / 2;

        this.update();
    }

    #rgbToHex(r, g, b) {
        const bin = r << 16 | g << 8 | b;
        return bin;
    }

    update() {
        const color = this.colors[(this.label) % this.colors.length];
        this.context.fillStyle = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';

        this.context.rect(0, 0, this.size, this.size);
        this.context.fill();

        this.color = this.#rgbToHex(...color);
        this.#updateBrush();

    }
}


class Annotation {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 0;
        this.canvas.height = 0;

        this.context = this.canvas.getContext('2d');

        this.sprite = new PIXI.Sprite();

        this.sprite.texture = PIXI.Texture.from(this.canvas);
    }

    draw(slice) {
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

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

        const data = imageData.data;
        for (let i = 0; i < slice.length; i++) {
            if (slice[i] >= 0) {
                const color = colors[(slice[i]) % colors.length];
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
    constructor(div) {
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

        this.labelSlice = new PIXI.Sprite();

        this.superpixelSlice = new PIXI.Sprite();
        this.superpixelSlice.tint = 0xff00ff
        this.superpixelSlice.alpha = 0.3;
        this.superpixelSlice.blendMode = PIXI.BLEND_MODES.ADD;
        //this.superpixelSlice.scale = 0.5;

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

        this.div = div;
        this.div.appendChild(this.app.view);
    }

    distanceBetween(point1, point2) {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    angleBetween(point1, point2) {
        return Math.atan2(point2.x - point1.x, point2.y - point1.y);
    }

    draw(currPosition, mode) {
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

    setSuperpixelVisibility(visible = true) {
        this.superpixelSlice.visible = visible;
    }

    setLabelVisibility(visible = true) {
        this.labelSlice.visible = visible;
    }

    #textureFromSlice(slice, x, y, pformat = PIXI.FORMATS.LUMINANCE) {
        const texture = PIXI.Texture.fromBuffer(slice, x, y, {
            type: PIXI.TYPES.UNSIGNED_BYTES,
            format: pformat,
        });
        return texture;
    }

    setLabelImage(labelSlice) {
        const x = labelSlice.shape[1];
        const y = labelSlice.shape[0];
        const len = labelSlice.data.length;
        let rgbaData = new Uint8Array(len * 4);
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
            rgbaData[idx + 3] = 32;
        }
        const texture = this.#textureFromSlice(rgbaData, x, y, PIXI.FORMATS.RGBA);
        this.labelSlice.texture = texture;

    }

    setImage(img_slice) {

        let uint8data;

        if (img_slice.dtype == 'uint8') {
            uint8data = img_slice.data;
        } else {
            uint8data = new Uint8Array(img_slice.data.length);
            for (let i = 0; i < img_slice.data.length; ++i) {
                const x = 255 * (1 - (65535.0 - img_slice.data[i]) / 65535);
                //console.log(x);
                uint8data[i] = x;
            }
        }

        const x = img_slice.shape[1];
        const y = img_slice.shape[0];
        console.log(x, y);
        const texture = this.#textureFromSlice(uint8data, x, y);
        this.slice.texture = texture;
    }

    setSuperpixelImage(superpixel_slice) {
        const uint8data = superpixel_slice.data.map(x => x * 255);
        const x = superpixel_slice.shape[1];
        const y = superpixel_slice.shape[0];
        console.log("I am setting superpixel hue hue huei: ", x, y);
        console.log(mean(uint8data), std(uint8data));
        const texture = this.#textureFromSlice(uint8data, x, y);
        this.superpixelSlice.texture = texture;    
    }

    destroyImage() {
        this.slice.texture.destroy();
        this.slice.texture = PIXI.Texture.EMPTY;
    }

    destroySuperpixelImage() {
        this.superpixelSlice.texture.destroy();
        this.superpixelSlice.texture = PIXI.texture.EMPTY;
    }

    resize() {
        const center = this.viewport.center;

        this.app.renderer.resize(this.div.offsetWidth, this.div.offsetHeight);
        this.viewport.resize(this.div.offsetWidth, this.div.offsetHeight);

        this.viewport.moveCenter(center);
    }

    recenter(w, h) {
        this.viewport.moveCenter(w / 2, h / 2);
        this.viewport.fit(true, w, h);
    }
}
