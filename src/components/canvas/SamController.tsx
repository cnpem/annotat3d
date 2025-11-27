import * as PIXI from 'pixi.js';
import { sfetch } from '../../utils/simplerequest';
import { dispatch } from '../../utils/eventbus';

export class SamController {
    canvas: any;

    start: PIXI.Point | null = null;

    end: PIXI.Point | null = null;

    isBoxing = false;

    boxGraphic: PIXI.Graphics;

    posPoints: PIXI.Graphics[] = [];

    negPoints: PIXI.Graphics[] = [];

    currentBox: number[] | null = null;

    // 250ms cooldown for point spam
    cooldown = false;

    cooldownDelay = 250;

    // tell backend this is a NEW annotation click
    pendingNewClick = false;

    constructor(canvas: any) {
        this.canvas = canvas;

        this.boxGraphic = new PIXI.Graphics();
        this.canvas.viewport.addChild(this.boxGraphic);

        // SPACE = new annotation
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.clearLocal();

                console.log('SAM New Annotation: waiting for first click...');
            }
        });
    }

    // ----------------------------------------------------------
    // Loading Toast Helpers
    // ----------------------------------------------------------
    showLoading(message: string) {
        dispatch('showLoading', { message });
    }

    hideLoading() {
        dispatch('hideLoading', null);
    }

    // ----------------------------------------------------------
    // Cooldown helper
    // ----------------------------------------------------------
    beginCooldown() {
        this.cooldown = true;
        setTimeout(() => (this.cooldown = false), this.cooldownDelay);
    }

    // ----------------------------------------------------------
    // Marker helpers
    // ----------------------------------------------------------
    drawMarker(x: number, y: number, color: number) {
        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawCircle(0, 0, 3);
        g.endFill();
        g.x = x;
        g.y = y;
        this.canvas.viewport.addChild(g);
        return g;
    }

    getPosCoords() {
        return this.posPoints.map((p) => [p.x, p.y]);
    }

    getNegCoords() {
        return this.negPoints.map((p) => [p.x, p.y]);
    }

    // ----------------------------------------------------------
    // CLEAR / NEW OBJECT
    // ----------------------------------------------------------
    clearAll() {
        // Clear rendered box (STATE WILL RESET)
        this.boxGraphic.clear();
        this.start = null;
        this.end = null;
        this.isBoxing = false;

        // Clear local markers
        for (const g of this.posPoints) g.destroy();
        for (const g of this.negPoints) g.destroy();
        this.posPoints = [];
        this.negPoints = [];

        // Clear box reference
        this.currentBox = null;

        // Next click = new annotation on backend
        this.pendingNewClick = true;

        const payload = {
            type: 'clearall',
            box: null,
            points_pos: [],
            points_neg: [],
            slice: null,
            axis: null,
            label: null,
            new_click: true,
        };

        this.showLoading('Resetting SAM...');
        sfetch('POST', '/sam', JSON.stringify(payload), 'json').finally(() => this.hideLoading());
    }

    // Local clear (does NOT call backend)
    clearLocal() {
        this.boxGraphic.clear();
        this.start = null;
        this.end = null;
        this.isBoxing = false;

        for (const g of this.posPoints) g.destroy();
        for (const g of this.negPoints) g.destroy();
        this.posPoints = [];
        this.negPoints = [];

        this.currentBox = null;

        // First next SAM click = new annotation
        this.pendingNewClick = true;
    }

    // ----------------------------------------------------------
    // BOX LOGIC (Box stays visible)
    // ----------------------------------------------------------
    startBox(event: any) {
        const pos = this.canvas.viewport.toWorld(event.data.global);
        this.start = pos;
        this.end = pos;
        this.isBoxing = true;

        // Start drawing box now
        this.boxGraphic.clear();
        this.boxGraphic.lineStyle(2, 0x00ff00, 1);
        this.boxGraphic.drawRect(pos.x, pos.y, 1, 1);
    }

    updateBox(event: any) {
        if (!this.isBoxing || !this.start) return;

        const newEnd = this.canvas.viewport.toWorld(event.data.global);
        this.end = newEnd;

        const x1 = this.start.x;
        const y1 = this.start.y;
        const x2 = newEnd.x;
        const y2 = newEnd.y;

        // Keep drawing live box
        this.boxGraphic.clear();
        this.boxGraphic.lineStyle(2, 0x00ff00, 1);
        this.boxGraphic.drawRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    }

    finishBox(event: any) {
        if (!this.isBoxing || !this.start || !this.end) return;

        this.isBoxing = false;

        const x1 = Math.round(this.start.x);
        const y1 = Math.round(this.start.y);
        const x2 = Math.round(this.end.x);
        const y2 = Math.round(this.end.y);

        const box = [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];

        this.currentBox = box;

        const payload = {
            type: 'box',
            box,
            points_pos: this.getPosCoords(),
            points_neg: this.getNegCoords(),
            slice: this.canvas.sliceNum,
            axis: this.canvas.axis,
            label: this.canvas.brush.label,
            new_click: this.pendingNewClick,
        };

        this.pendingNewClick = false;

        this.showLoading('Running SAM...');
        return sfetch('POST', '/sam', JSON.stringify(payload), 'json')
            .then(() => dispatch('annotationChanged', null))
            .finally(() => this.hideLoading());
    }

    // ----------------------------------------------------------
    // NEW ANNOTATION
    // ----------------------------------------------------------
    newAnnotation() {
        this.showLoading('Finalizing annotation...');

        sfetch('POST', '/sam', JSON.stringify({ type: 'new_annotation', new_click: true }), 'json')
            .then(() => dispatch('annotationChanged', null))
            .finally(() => this.hideLoading());

        this.clearAll();
    }

    // ----------------------------------------------------------
    // POSITIVE POINT
    // ----------------------------------------------------------
    positivePoint(event: any) {
        if (this.cooldown) return;
        this.beginCooldown();

        const pos = this.canvas.viewport.toWorld(event.data.global);
        const px = Math.round(pos.x);
        const py = Math.round(pos.y);

        this.posPoints.push(this.drawMarker(px, py, 0x3399ff));

        const payload = {
            type: 'pos',
            box: this.currentBox,
            points_pos: this.getPosCoords(),
            points_neg: this.getNegCoords(),
            slice: this.canvas.sliceNum,
            axis: this.canvas.axis,
            label: this.canvas.brush.label,
            new_click: this.pendingNewClick,
        };

        this.pendingNewClick = false;

        this.showLoading('Running SAM...');
        return sfetch('POST', '/sam', JSON.stringify(payload), 'json')
            .then(() => dispatch('annotationChanged', null))
            .finally(() => this.hideLoading());
    }

    // ----------------------------------------------------------
    // NEGATIVE POINT
    // ----------------------------------------------------------
    negativePoint(event: any) {
        if (this.cooldown) return;
        this.beginCooldown();

        const pos = this.canvas.viewport.toWorld(event.data.global);
        const px = Math.round(pos.x);
        const py = Math.round(pos.y);

        this.negPoints.push(this.drawMarker(px, py, 0xff3333));

        const payload = {
            type: 'neg',
            box: this.currentBox,
            points_pos: this.getPosCoords(),
            points_neg: this.getNegCoords(),
            slice: this.canvas.sliceNum,
            axis: this.canvas.axis,
            label: this.canvas.brush.label,
            new_click: this.pendingNewClick,
        };

        this.pendingNewClick = false;

        this.showLoading('Running SAM...');
        return sfetch('POST', '/sam', JSON.stringify(payload), 'json')
            .then(() => dispatch('annotationChanged', null))
            .finally(() => this.hideLoading());
    }
}
