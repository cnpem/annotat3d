// PixiJS Customize tool
// https://github.com/kozo002/non-antialias-painting/blob/master/src/StampMaker.js
// https://medium.com/@kozo002/how-to-draw-without-antialiasing-on-html5-canvas-cf13294a8e58
// https://stackoverflow.com/questions/30165475/how-to-compress-minimize-size-of-json-jsonify-with-flask-in-python

// TODO
// update only on interaction
// whell increase inputs number
// job via slurm
// remove cursor on mobile
// disable things

import * as PIXI from 'pixi.js';
import Canvas from './canvas';
import { sfetch, sxhr } from './simplerequest';

const imagePathElm = document.getElementById('image_path');
const dtypeElm = document.getElementById('dtype');
const openXElm = document.getElementById('open_x');
const openYElm = document.getElementById('open_y');
const openZElm = document.getElementById('open_z');
const openImageElm = document.getElementById('open_image');
const closeImageElm = document.getElementById('close_image');

const annotPathElm = document.getElementById('annot_path');
const newAnnotElm = document.getElementById('new_annot');
const openAnnotElm = document.getElementById('open_annot');
const closeAnnotElm = document.getElementById('close_annot');

const brushModeElm = document.getElementsByName('brush_mode');

const zElm = document.getElementById('z');

const debugElm = document.getElementById('debug');

const canvasElm = document.getElementById('canvas');

function example(n) {
    switch (n) {
        case 0:
            imagePathElm.value = '/ibira/lnls/labs/tepui/home/matheus.sarmento/h5-parallel/mario-800M-uint8-800.raw';
            dtypeElm.value = 'uint8';
            openXElm.value = 800;
            openYElm.value = 800;
            openZElm.value = 800;
            break;
        case 1:
            imagePathElm.value =
                '/ibira/lnls/scratch/mogno/staff/murilo.carvalho/Dados_confocal_coracao/Dados_confocal_wga_16bit_40x_12-08-21/Annot_Img1/data_deconv_1024x1024x75_16bit.raw';
            dtypeElm.value = 'uint16';
            openXElm.value = 1024;
            openYElm.value = 1024;
            openZElm.value = 75;
            break;
        case 2:
            imagePathElm.value = '/home/peixinho/preprocess_cells/crua_A.tif';
            dtypeElm.value = 'uint16';
            openXElm.value = 190;
            openYElm.value = 207;
            openZElm.value = 100;
            break;
        case 3:
            imagePathElm.value =
                '/ibira/lnls/scratch/mogno/staff/murilo.carvalho/14-12-20_Experiment/WT3_par_livre_post_isop_6mmSi-pano_Z600/tomos/WT3_par_livre_post_isop_6mmSi-pano_Z600_20/segmentation/FBP_parede-livre_post_linha20_3330x2226x2048_16bit.raw';
            dtypeElm.value = 'uint16';
            openXElm.value = 3330;
            openYElm.value = 2226;
            openZElm.value = 2048;
            break;
    }

    switch (n) {
        case 0:
            annotPathElm.value = '';
            break;
        case 1:
            annotPathElm.value =
                '/ibira/lnls/scratch/mogno/staff/murilo.carvalho/Dados_confocal_coracao/Dados_confocal_wga_16bit_40x_12-08-21/Annot_Img1/anotacao1.pkl';
            break;
        case 2:
            annotPathElm.value = '/ibira/lnls/labs/tepui/home/alan.peixinho/preprocess_cells/annotations_label_A.pkl';
            break;
        case 3:
            annotPathElm.value = '';
            break;
    }
}

const canvas = new Canvas(canvasElm);
canvas.resize();

window.addEventListener('resize', function () {
    canvas.resize();
});

document.getElementById('brush_size').value = canvas.brush.size;
document.getElementById('brush_size').addEventListener('change', function () {
    const brushSize = parseInt(document.getElementById('brush_size').value);
    canvas.brush.setSize(brushSize);
});

document.getElementById('brush_label').value = canvas.brush.label;
document.getElementById('brush_label').addEventListener('change', function () {
    const brushLabel = parseInt(document.getElementById('brush_label').value);
    canvas.brush.setLabel(brushLabel);
});

zElm.addEventListener('change', function () {
    getImageSlice();
    getAnnotSlice();
    getSuperpixelSlice();
    getLabelSlice();
});

canvas.viewport.on('pointerdown', onPointerDown);
canvas.viewport.on('pointerup', onPointerUp);
canvas.viewport.on('pointerout', onPointerUp);
canvas.viewport.on('pointermove', onPointerMove);
canvas.viewport.on('wheel', (e) => {
    onPointerMove(e.event);
});

sxhr('GET', '/reconnect_session', function (response) {
    const r = JSON.parse(response);

    if ('image_path' in r) {
        imagePathElm.value = r.image_path;
        dtypeElm.value = r.dtype;
        openXElm.value = r.x;
        openYElm.value = r.y;
        openZElm.value = r.z;

        zElm.value = Math.round(parseInt(openZElm.value) / 2);

        getImageSlice();
        recenterCanvas();
    }

    if ('annot_path' in r) {
        annotPathElm.value = r.annot_path;
        getAnnotSlice();
    }

    getSuperpixelSlice();
    getLabelSlice();
});

function openImage() {
    const data = {
        image_path: imagePathElm.value,
        dtype: dtypeElm.value,
        x: parseInt(openXElm.value),
        y: parseInt(openYElm.value),
        z: parseInt(openZElm.value),
    };

    sxhr(
        'POST',
        '/open_image',
        function () {
            zElm.value = Math.round(parseInt(openZElm.value) / 2);

            getImageSlice();
            recenterCanvas();
        },
        JSON.stringify(data)
    );
}

function closeImage() {
    sxhr('POST', '/close_image', function () {
        imagePathElm.value = '';
        dtypeElm.value = 'dtype';
        openXElm.value = null;
        openYElm.value = null;
        openZElm.value = null;

        zElm.value = 0;

        canvas.destroyImage();
    });
}

function getLabelSlice() {
    const z = zElm.value;

    document.getElementById('brush_z').value = z;

    const params = {
        z: parseInt(z),
    };

    void sfetch('POST', '/get_image_slice/label', JSON.stringify(params), 'gzip/numpyndarray').then((labelSlice) => {
        canvas.setLabelImage(labelSlice);
    });
}

function getImageSlice() {
    const z = zElm.value;

    document.getElementById('brush_z').value = z;

    const params = {
        z: parseInt(z),
    };

    void sfetch('POST', '/get_image_slice/image', JSON.stringify(params), 'gzip/numpyndarray').then((imgSlice) => {
        canvas.setImage(imgSlice);
    });
}

function newAnnot() {
    sxhr('POST', '/new_annot', () => {});
}

function openAnnot() {
    const data = {
        annot_path: annotPathElm.value,
    };
    sxhr(
        'POST',
        '/open_annot',
        function () {
            getAnnotSlice();
        },
        JSON.stringify(data)
    );
}

function closeAnnot() {
    sxhr('POST', '/close_annot', function () {
        annotPathElm.value = '';
        canvas.annotation.sprite.texture.destroy();
        canvas.annotation.sprite.texture = PIXI.Texture.EMPTY;
    });
}

function saveAnnot() {
    const data = {
        annot_path: annotPathElm.value,
    };
    sxhr('POST', '/save_annot', () => {}, JSON.stringify(data));
}

function getSuperpixelSlice() {
    canvas.superpixelSlice.width = openXElm.value;
    canvas.superpixelSlice.height = openYElm.value;

    const dtype = dtypeElm.value;
    const x = openXElm.value * 2 - 1;
    const y = openYElm.value * 2 - 1;

    const params = {
        z: parseInt(zElm.value),
    };

    void sfetch('POST', '/get_superpixel_slice', JSON.stringify(params), 'gzip/numpyndarray').then(
        (superpixelSlice) => {
            canvas.setSuperpixelImage(superpixelSlice);
        }
    );
}

function getAnnotSlice() {
    canvas.annotation.canvas.width = openXElm.value;
    canvas.annotation.canvas.height = openYElm.value;

    const data = {
        z: parseInt(zElm.value),
    };

    void sfetch('POST', '/get_annot_slice', JSON.stringify(data), 'gzip/float64array').then((slice) => {
        canvas.annotation.draw(slice);
    });
}

function recenterCanvas() {
    canvas.recenter(openXElm.value, openYElm.value);
}

function createSegmentationModule() {
    void sfetch('POST', '/superpixel_segmentation_module/create');
}

function preview() {
    const params = {
        z: parseInt(zElm.value),
    };

    void sfetch('POST', '/superpixel_segmentation_module/preview', JSON.stringify(params)).then(() => {
        canvas.setLabelVisibility(true);
        canvas.setSuperpixelVisibility(false);
        getLabelSlice();
    });
}

async function computeSuperpixels() {
    const superpixelParams = {
        superpixel_type: 'waterpixels',
        seed_spacing: 4,
        compactness: 10,
    };
    await sfetch('POST', '/superpixel', JSON.stringify(superpixelParams)).then(() => {
        console.log('gonna get superpixel slices yay');
        canvas.setLabelVisibility(false);
        canvas.setSuperpixelVisibility(true);
        getSuperpixelSlice();
    });
}

function onPointerDown(event) {
    if (event.data.pointerType == 'mouse') {
        if (event.data.button != 0) return;
    } else if (event.data.pointerType == 'touch') {
        canvas.viewport.plugins.pause('drag');
        // canvas.brush.cursor.visible = false
    }

    canvas.isPainting = true;

    canvas.prevPosition = canvas.viewport.toWorld(event.data.global);
}

function onPointerMove(event) {
    let currPosition = null;

    if (event.type == 'wheel') {
        canvas.viewport.plugins.resume('drag');
        currPosition = canvas.viewport.toWorld(event.offsetX, event.offsetY);
    } else {
        currPosition = canvas.viewport.toWorld(event.data.global);
        if (event.data.pointerType == 'touch' && event.data.originalEvent.touches.length > 1) {
            canvas.isPainting = false;
            return;
        }
    }

    document.getElementById('brush_x').value = currPosition.x;
    document.getElementById('brush_y').value = currPosition.y;

    canvas.brush.cursor.position.x = currPosition.x - canvas.brush.size / 2;
    canvas.brush.cursor.position.y = currPosition.y - canvas.brush.size / 2;

    if (!canvas.isPainting) return;

    const checked = Array.from(brushModeElm).find((radio) => radio.checked).value;

    const data = {
        coords: canvas.draw(currPosition, checked),
        z: parseInt(zElm.value),
        size: canvas.brush.size,
        label: canvas.brush.label,
        mode: checked,
    };
    sxhr('POST', '/draw', () => {}, JSON.stringify(data));

    canvas.prevPosition = currPosition;
}

function onPointerUp(event) {
    canvas.viewport.plugins.resume('drag');

    const currPosition = canvas.viewport.toWorld(event.data.global);
    canvas.prevPosition = currPosition;

    const checked = Array.from(brushModeElm).find((radio) => radio.checked).value;

    if (canvas.isPainting) {
        const data = {
            coords: canvas.draw(currPosition, checked),
            z: parseInt(zElm.value),
            size: canvas.brush.size,
            label: canvas.brush.label,
            mode: checked,
        };
        sxhr('POST', '/draw', () => {}, JSON.stringify(data));
    }

    canvas.isPainting = false;
}

// mario slices bug
// 187-239
// 240-292
// 347-399

// 2) example0  3.9kB 18.9+ 21ms
// 2) example1  657kB 67.1+164ms
// 2) example2 19.2kB  8.5+ 19ms
// 1) example0  5.7MB 41.6+559ms
// 1) example1  9.1MB 41.8+866ms
// 1) example2  393kB  1.8+ 60ms
// 0) example0  640kB 72.3+ 39ms
