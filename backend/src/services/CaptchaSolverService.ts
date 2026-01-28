import { Page, Frame } from 'playwright-core';
import path from 'path';
import fs from 'fs';
import { env } from '@xenova/transformers';
import * as ort from 'onnxruntime-web';
import sharp from 'sharp';

// Configure local models environment
env.allowLocalModels = true;
env.useBrowserCache = false;

// Interface for Detection result
interface DetectionBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    score: number;
    classId: number;
    label: string;
}

export class CaptchaSolverService {
    private static instance: CaptchaSolverService;
    private visualModelSession: ort.InferenceSession | null = null;
    private detectionModelSession: ort.InferenceSession | null = null;

    private readonly modelsDir: string;

    // Model configuration
    private readonly CLASSIFICATION_MODEL_PATH: string;
    private readonly DETECTION_MODEL_PATH: string;

    // Class names for classification (3x3) - 14 classes
    private readonly CLASSIFICATION_CLASSES: Record<number, string> = {
        0: 'Bicycle', 1: 'Bridge', 2: 'Bus', 3: 'Car', 4: 'Chimney',
        5: 'Crosswalk', 6: 'Hydrant', 7: 'Motorcycle', 8: 'Mountain',
        9: 'Other', 10: 'Palm', 11: 'Stair', 12: 'Tractor', 13: 'Traffic Light'
    };

    // COCO Class names for Detection (4x4) - 80 classes
    private readonly COCO_CLASSES: string[] = [
        "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat", "traffic light",
        "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
        "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
        "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard",
        "tennis racket", "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
        "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
        "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote", "keyboard", "cell phone",
        "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase", "scissors", "teddy bear",
        "hair drier", "toothbrush"
    ];

    private constructor() {
        this.modelsDir = path.join(process.cwd(), 'models');
        this.CLASSIFICATION_MODEL_PATH = path.join(this.modelsDir, 'recaptcha_classification_57k.onnx');
        // yolo26x.onnx is assumed to be the name for the exported YOLO ONNX model
        this.DETECTION_MODEL_PATH = path.join(this.modelsDir, 'yolo26x.onnx');

        // Ensure models exist
        if (!fs.existsSync(this.CLASSIFICATION_MODEL_PATH)) {
            console.error(`❌ Classification model missing: ${this.CLASSIFICATION_MODEL_PATH}`);
        }
        if (!fs.existsSync(this.DETECTION_MODEL_PATH)) {
            console.error(`❌ Detection model missing: ${this.DETECTION_MODEL_PATH}`);
        }
    }

    public static getInstance(): CaptchaSolverService {
        if (!CaptchaSolverService.instance) {
            CaptchaSolverService.instance = new CaptchaSolverService();
        }
        return CaptchaSolverService.instance;
    }

    /**
     * Initialize/Load Visual Models (Lazy)
     */
    private async loadVisualModels() {
        if (!this.visualModelSession && fs.existsSync(this.CLASSIFICATION_MODEL_PATH)) {
            console.log("   🔧 Loading Classification model...");
            try {
                this.visualModelSession = await ort.InferenceSession.create(this.CLASSIFICATION_MODEL_PATH);
                console.log("   ✅ Classification model loaded");
            } catch (error) {
                console.error("   ❌ Failed to load Classification model:", error);
            }
        }
        if (!this.detectionModelSession && fs.existsSync(this.DETECTION_MODEL_PATH)) {
            console.log("   🔧 Loading Detection model (YOLO)...");
            try {
                this.detectionModelSession = await ort.InferenceSession.create(this.DETECTION_MODEL_PATH);
                console.log("   ✅ Detection model loaded");
            } catch (error) {
                console.error("   ❌ Failed to load Detection model:", error);
            }
        }
    }

    /**
     * Main Solve Method (Visual Only)
     */
    public async solve(page: Page): Promise<boolean> {
        console.log("🧩 Starting Captcha Solver (Visual Only)...");
        try {
            // Find frame
            let recaptchaFrame: Frame | null = null;
            for (const frame of page.frames()) {
                if (frame.url().includes('recaptcha') && frame.url().includes('anchor')) {
                    recaptchaFrame = frame;
                    break;
                }
            }

            if (!recaptchaFrame) {
                console.log("   ❌ No reCAPTCHA anchor frame found");
                return false;
            }

            // Click checkbox
            try {
                await recaptchaFrame.click('#recaptcha-anchor');
                await page.waitForTimeout(2000);
            } catch (e) {
                console.log("   ❌ Could not click checkbox");
                return false;
            }

            // Check if solved (stealth check)
            const isChecked = await recaptchaFrame.getAttribute('#recaptcha-anchor', 'aria-checked') === 'true';
            if (isChecked) {
                console.log("   ✅ reCAPTCHA passed without challenge!");
                return true;
            }

            // Find challenge frame
            let challengeFrame: Frame | null = null;
            // Wait a bit for it to appear
            await page.waitForTimeout(2000);
            for (const frame of page.frames()) {
                if (frame.url().includes('recaptcha') && frame.url().includes('bframe')) {
                    challengeFrame = frame;
                    break;
                }
            }

            if (!challengeFrame) return false;

            console.log("   🎯 Using VISUAL solving only...");
            return await this.solveVisual(challengeFrame);

        } catch (error) {
            console.error("Solver error:", error);
            return false;
        }
    }

    /**
     * Visual Solving Logic using YOLO (Detection/Classification)
     */
    private async solveVisual(frame: any): Promise<boolean> {
        await this.loadVisualModels();

        if (!this.visualModelSession) {
            console.log("   ❌ Visual model not loaded");
            return false;
        }

        const maxAttempts = 10;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            console.log(`   👁️ Visual attempt ${attempt + 1}/${maxAttempts}`);

            try {
                // Ensure we are on image challenge
                try {
                    const imageBtn = frame.locator("#recaptcha-image-button");
                    if (await imageBtn.count() > 0) {
                        await imageBtn.click();
                        await frame.waitForTimeout(1000);
                    }
                } catch {
                    // Ignore
                }

                // Check if solved (frame detached or checkbox checked)
                try {
                    if (frame.isDetached()) return true;
                } catch { return true; }

                // Get target keyword
                const targetKeyword = await this.getTargetKeyword(frame);
                if (!targetKeyword) {
                    console.log("   ⚠️ Could not get target keyword, reloading...");
                    if (await this.clickReload(frame)) continue;
                    else return true; // Solved
                }
                console.log(`   🎯 Target: ${targetKeyword}`);

                // Get valid class name
                const targetClass = this.normalizeTarget(targetKeyword);
                if (!targetClass) {
                    console.log(`   ⚠️ Unknown target '${targetKeyword}', reloading...`);
                    if (await this.clickReload(frame)) continue;
                    else return true;
                }

                // Get grid image
                const imageData = await this.getGridImage(frame);
                if (!imageData) {
                    console.log("   ⚠️ Could not get grid image, reloading...");
                    if (await this.clickReload(frame)) continue;
                    else return true;
                }

                // Determine grid size
                const gridSize = await this.determineGridSize(frame);
                console.log(`   📊 Grid size: ${gridSize}x${gridSize}`);

                let cellsToClick: number[] = [];

                // Strategy Routing
                if (gridSize === 4) {
                    // 4x4: Check if it's a COCO class for detection
                    const targetLower = targetKeyword.toLowerCase();
                    // Basic singularization for check
                    const targetSingular = targetLower.endsWith('s') ? targetLower.slice(0, -1) : targetLower;

                    const isCoco = this.COCO_CLASSES.includes(targetLower) || this.COCO_CLASSES.includes(targetSingular);

                    if (isCoco && this.detectionModelSession) {
                        console.log(`      Using YOLO Detection for 4x4 (target: ${targetKeyword})`);
                        cellsToClick = await this.analyze4x4Detection(imageData, targetKeyword);
                    } else {
                        console.log(`      Using Classification for 4x4 (target: ${targetKeyword})`);
                        cellsToClick = await this.analyze4x4Classification(imageData, targetClass);
                    }
                } else {
                    // 3x3: Use Ranking-based Classification
                    console.log(`      Using Ranking Classification for 3x3 (target: ${targetKeyword})`);
                    cellsToClick = await this.analyzeGridRanked(imageData, targetClass, 3);
                }

                if (cellsToClick.length === 0) {
                    console.log("   ⚠️ No cells to click, reloading...");
                    if (await this.clickReload(frame)) continue;
                    else return true;
                }

                console.log(`   🖱️ Clicking cells: ${cellsToClick.join(', ')}`);

                // Click the selected cells
                await this.clickCells(frame, cellsToClick);
                await frame.waitForTimeout(1000);

                // Click verify
                await this.clickVerify(frame);
                await frame.waitForTimeout(2000);

                // Check errors
                try {
                    const errorEl = frame.locator(".rc-imageselect-error-select-more, .rc-imageselect-incorrect-response");
                    if (await errorEl.count() > 0) {
                        console.log("   ⚠️ Wrong selection, trying again...");
                        await frame.waitForTimeout(1000);
                        continue;
                    }
                } catch {
                    // Likely detached/solved
                }

            } catch (e: any) {
                if (e.message?.includes('detached') || e.message?.includes('Target closed')) {
                    console.log("   ✅ reCAPTCHA solved! (frame detached)");
                    return true;
                }
                console.log(`   ⚠️ Visual attempt error: ${e.message}`);
            }
        }

        console.log("   ❌ Visual solver max attempts reached");
        return false;
    }

    /**
     * YOLO Detection Analysis for 4x4 grids
     */
    private async analyze4x4Detection(imageData: Buffer, targetKeyword: string): Promise<number[]> {
        try {
            if (!this.detectionModelSession) return [];

            // Map target to COCO class
            const mappings: Record<string, string> = {
                "bicycle": "bicycle", "bicycles": "bicycle",
                "car": "car", "cars": "car",
                "motorcycle": "motorcycle", "motorcycles": "motorcycle",
                "bus": "bus", "buses": "bus",
                "traffic light": "traffic light", "traffic lights": "traffic light",
                "fire hydrant": "fire hydrant", "fire hydrants": "fire hydrant",
                "hydrant": "fire hydrant", "hydrants": "fire hydrant",
                "boat": "boat", "boats": "boat"
            };
            const targetCoco = mappings[targetKeyword.toLowerCase()] || targetKeyword.toLowerCase();

            // Preprocess image
            const { tensor, width: imgWidth, height: imgHeight } = await this.preprocessImageForYOLO(imageData);

            // Run Inference
            const results = await this.detectionModelSession.run({ images: tensor });
            const output = results[Object.keys(results)[0]]; // Shape: [1, 84, 8400]

            // Post-process (NMS)
            const predictions = this.processYOLOOutput(output.data as Float32Array, imgWidth, imgHeight, 0.4); // 0.4 conf threshold

            // Filter for target class
            const targetPredictions = predictions.filter(p => p.label === targetCoco);

            if (targetPredictions.length === 0) {
                console.log(`      No detections for '${targetCoco}'`);
                return [];
            }

            console.log(`      Found ${targetPredictions.length} detections for ${targetCoco}`);

            // Map boxes to grid cells
            const cells = new Set<number>();
            const tileW = imgWidth / 4;
            const tileH = imgHeight / 4;

            for (const pred of targetPredictions) {
                const cx = (pred.x1 + pred.x2) / 2;
                const cy = (pred.y1 + pred.y2) / 2;

                const col = Math.min(3, Math.floor(cx / tileW));
                const row = Math.min(3, Math.floor(cy / tileH));
                const cellNum = row * 4 + col + 1;

                cells.add(cellNum);
                console.log(`         ${pred.label} (${(pred.score * 100).toFixed(0)}%) at ${cx.toFixed(0)},${cy.toFixed(0)} -> Cell ${cellNum}`);
            }

            return Array.from(cells).sort((a, b) => a - b);
        } catch (e) {
            console.error("Detection error:", e);
            return [];
        }
    }

    /**
     * Classification Analysis for 4x4 grids (Non-COCO)
     */
    private async analyze4x4Classification(imageData: Buffer, targetClass: string): Promise<number[]> {
        // Implementation similar to 3x3 but with 16 tiles and simpler threshold logic
        try {
            const metadata = await sharp(imageData).metadata();
            const width = metadata.width || 400; // 4x4 usually larger
            const height = metadata.height || 400;
            const tileW = Math.floor(width / 4);
            const tileH = Math.floor(height / 4);

            const selectedCells: number[] = [];
            const cellsInfo: any[] = [];

            // Find target index
            let targetIndex = -1;
            for (const [idx, name] of Object.entries(this.CLASSIFICATION_CLASSES)) {
                if (name.toLowerCase() === targetClass.toLowerCase()) {
                    targetIndex = parseInt(idx);
                    break;
                }
            }
            if (targetIndex === -1) return [];

            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    const cellNum = row * 4 + col + 1;
                    const tileBuffer = await sharp(imageData)
                        .extract({ left: col * tileW, top: row * tileH, width: tileW, height: tileH })
                        .resize(224, 224).removeAlpha().raw().toBuffer();

                    const probs = await this.runClassification(tileBuffer);
                    const targetConf = probs[targetIndex] || 0;

                    // Get top prediction for logging
                    const maxIdx = probs.indexOf(Math.max(...probs));
                    const predClass = this.CLASSIFICATION_CLASSES[maxIdx];

                    cellsInfo.push({ cell: cellNum, conf: targetConf, pred: predClass });
                }
            }

            // Sort by confidence
            cellsInfo.sort((a, b) => b.conf - a.conf);

            // Select logic: Threshold based for 4x4
            for (const info of cellsInfo) {
                if (info.conf >= 0.4) {
                    selectedCells.push(info.cell);
                    console.log(`         Cell ${info.cell}: ${info.pred} -> Target Conf: ${info.conf.toFixed(2)} ✓`);
                } else if (selectedCells.length < 2 && info.conf > 0.1) {
                    // Fallback to show top if few selected
                    console.log(`         Cell ${info.cell}: ${info.pred} -> Target Conf: ${info.conf.toFixed(2)}`);
                }
            }

            return selectedCells.sort((a, b) => a - b);

        } catch (e) {
            console.error("4x4 Classification error:", e);
            return [];
        }
    }

    /**
     * 3x3 Ranking Analysis
     */
    private async analyzeGridRanked(imageData: Buffer, targetClass: string, gridSize: number): Promise<number[]> {
        try {
            const metadata = await sharp(imageData).metadata();
            const width = metadata.width || 300;
            const height = metadata.height || 300;
            const tileW = Math.floor(width / gridSize);
            const tileH = Math.floor(height / gridSize);

            const cellConfidences: Array<{ cell: number; confidence: number; predicted: string }> = [];

            let targetIndex = -1;
            for (const [idx, name] of Object.entries(this.CLASSIFICATION_CLASSES)) {
                if (name.toLowerCase() === targetClass.toLowerCase()) {
                    targetIndex = parseInt(idx);
                    break;
                }
            }
            if (targetIndex === -1) return [];

            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    const cellNum = row * gridSize + col + 1;
                    const tileBuffer = await sharp(imageData)
                        .extract({ left: col * tileW, top: row * tileH, width: tileW, height: tileH })
                        .resize(224, 224).removeAlpha().raw().toBuffer();

                    const probs = await this.runClassification(tileBuffer);
                    const targetConf = probs[targetIndex] || 0;

                    const maxIdx = probs.indexOf(Math.max(...probs));
                    const predicted = this.CLASSIFICATION_CLASSES[maxIdx];

                    cellConfidences.push({ cell: cellNum, confidence: targetConf, predicted });
                }
            }

            // Ranking Logic
            const ranked = cellConfidences.sort((a, b) => b.confidence - a.confidence);

            console.log(`      Ranking by ${targetClass} confidence:`);
            ranked.slice(0, 5).forEach((r, i) => {
                console.log(`         ${i + 1}. Cell ${r.cell}: ${(r.confidence * 100).toFixed(1)}% (predicted: ${r.predicted})`);
            });

            // Top 3
            const answers = ranked.slice(0, 3).map(r => r.cell);

            // 4th if conf >= 0.7
            if (ranked.length >= 4 && ranked[3].confidence >= 0.7) {
                answers.push(ranked[3].cell);
                console.log(`      Including 4th cell ${ranked[3].cell} with conf ${(ranked[3].confidence * 100).toFixed(1)}%`);
            }

            if (ranked[0].confidence < 0.1) {
                console.log(`      ⚠️ Top confidence too low`);
                return [];
            }

            return answers;

        } catch (e) {
            console.error("Grid analysis error:", e);
            return [];
        }
    }

    // --- Helper Methods ---

    private async runClassification(buffer: Buffer): Promise<number[]> {
        if (!this.visualModelSession) return [];

        const floatData = new Float32Array(3 * 224 * 224);
        for (let i = 0; i < 224 * 224; i++) {
            floatData[i] = buffer[i * 3] / 255.0;
            floatData[224 * 224 + i] = buffer[i * 3 + 1] / 255.0;
            floatData[2 * 224 * 224 + i] = buffer[i * 3 + 2] / 255.0;
        }

        const inputTensor = new ort.Tensor('float32', floatData, [1, 3, 224, 224]);
        const results = await this.visualModelSession.run({ images: inputTensor });
        const output = results[Object.keys(results)[0]];
        return this.softmax(Array.from(output.data as Float32Array));
    }

    private async preprocessImageForYOLO(buffer: Buffer): Promise<{ tensor: ort.Tensor; width: number; height: number }> {
        const metadata = await sharp(buffer).metadata();
        const width = metadata.width || 640;
        const height = metadata.height || 640;

        // YOLO typically expects 640x640
        const resized = await sharp(buffer)
            .resize(640, 640, { fit: 'fill' })
            .removeAlpha()
            .raw()
            .toBuffer();

        const floatData = new Float32Array(3 * 640 * 640);
        for (let i = 0; i < 640 * 640; i++) {
            floatData[i] = resized[i * 3] / 255.0;
            floatData[640 * 640 + i] = resized[i * 3 + 1] / 255.0;
            floatData[2 * 640 * 640 + i] = resized[i * 3 + 2] / 255.0;
        }

        const tensor = new ort.Tensor('float32', floatData, [1, 3, 640, 640]);
        return { tensor, width, height };
    }

    private processYOLOOutput(data: Float32Array, imgWidth: number, imgHeight: number, confThreshold: number): DetectionBox[] {
        // Output shape [1, 84, 8400] -> flattened
        // 84 rows: 0=cx, 1=cy, 2=w, 3=h, 4..83=classes
        // 8400 columns: anchors

        const boxes: DetectionBox[] = [];
        const numAnchors = 8400;
        const numRows = 84;

        // We need to iterate over anchors (columns)
        for (let i = 0; i < numAnchors; i++) {
            // Find max class score
            let maxScore = -Infinity;
            let classId = -1;

            // Classes start at row 4
            for (let c = 0; c < 80; c++) {
                const score = data[(4 + c) * numAnchors + i]; // access row (4+c), col i
                if (score > maxScore) {
                    maxScore = score;
                    classId = c;
                }
            }

            if (maxScore >= confThreshold) {
                // Extract coordinates (normalized 0-640 range from model, need to scale to imgWidth/Height)
                // Note: model input was 640x640. 
                const cx = data[0 * numAnchors + i];
                const cy = data[1 * numAnchors + i];
                const w = data[2 * numAnchors + i];
                const h = data[3 * numAnchors + i];

                // Scale from 640x640 to original image size
                const scaleX = imgWidth / 640;
                const scaleY = imgHeight / 640;

                const x = (cx - w / 2) * scaleX;
                const y = (cy - h / 2) * scaleY;
                const width = w * scaleX;
                const height = h * scaleY;

                boxes.push({
                    x1: x,
                    y1: y,
                    x2: x + width,
                    y2: y + height,
                    score: maxScore,
                    classId: classId,
                    label: this.COCO_CLASSES[classId]
                });
            }
        }

        return this.nms(boxes, 0.45); // 0.45 IoU threshold
    }

    private nms(boxes: DetectionBox[], iouThreshold: number): DetectionBox[] {
        if (boxes.length === 0) return [];

        // Sort by score desc
        boxes.sort((a, b) => b.score - a.score);

        const selected: DetectionBox[] = [];
        const active = new Array(boxes.length).fill(true);

        for (let i = 0; i < boxes.length; i++) {
            if (!active[i]) continue;

            selected.push(boxes[i]);

            for (let j = i + 1; j < boxes.length; j++) {
                if (active[j]) {
                    const iou = this.calculateIoU(boxes[i], boxes[j]);
                    if (iou >= iouThreshold) {
                        active[j] = false;
                    }
                }
            }
        }
        return selected;
    }

    private calculateIoU(a: DetectionBox, b: DetectionBox): number {
        const x1 = Math.max(a.x1, b.x1);
        const y1 = Math.max(a.y1, b.y1);
        const x2 = Math.min(a.x2, b.x2);
        const y2 = Math.min(a.y2, b.y2);

        const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
        const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
        const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);

        return intersection / (areaA + areaB - intersection);
    }

    private softmax(arr: number[]): number[] {
        const max = Math.max(...arr);
        const exps = arr.map(x => Math.exp(x - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(e => e / sum);
    }

    private async getTargetKeyword(frame: any): Promise<string | null> {
        const selectors = [
            ".rc-imageselect-desc-no-canonical strong",
            ".rc-imageselect-desc strong",
            ".rc-imageselect-desc-wrapper strong",
        ];
        for (const sel of selectors) {
            try {
                const text = await frame.locator(sel).first().innerText({ timeout: 1000 });
                if (text) return text.trim().toLowerCase();
            } catch { }
        }
        // Fallback
        try {
            const text = await frame.locator(".rc-imageselect-instructions").first().innerText({ timeout: 1000 });
            const keywords = ["crosswalk", "bicycle", "bus", "car", "traffic light", "fire hydrant", "motorcycle", "stairs", "bridge", "chimney"];
            for (const kw of keywords) {
                if (text.toLowerCase().includes(kw)) return kw;
            }
        } catch { }
        return null;
    }

    private normalizeTarget(keyword: string): string | null {
        // Direct mapping + simple search in classes
        const map: any = { "fire hydrant": "Hydrant", "hydrant": "Hydrant", "traffic light": "Traffic Light", "taxi": "Car" };
        if (map[keyword]) {
            console.log(`      Found direct map: '${keyword}' -> '${map[keyword]}'`);
            return map[keyword];
        }

        for (const cls of Object.values(this.CLASSIFICATION_CLASSES)) {
            if (keyword.includes(cls.toLowerCase()) || cls.toLowerCase().includes(keyword)) {
                console.log(`      Found inferred match: '${keyword}' -> '${cls}'`);
                return cls;
            }
        }
        console.log(`      ⚠️ No class mapping found for '${keyword}'`);
        return null;
    }

    private async getGridImage(frame: any): Promise<Buffer | null> {
        try {
            const img = frame.locator(".rc-image-tile-wrapper img").first();
            const src = await img.getAttribute("src");
            if (!src) return null;
            if (src.startsWith('data:')) return Buffer.from(src.split(',')[1], 'base64');
            const res = await fetch(src);
            return Buffer.from(await res.arrayBuffer());
        } catch { return null; }
    }

    private async determineGridSize(frame: any): Promise<number> {
        return (await frame.locator(".rc-imageselect-tile").count()) === 16 ? 4 : 3;
    }

    private async clickCells(frame: any, cells: number[]) {
        for (const c of cells) {
            await frame.locator(".rc-imageselect-tile").nth(c - 1).click();
            await frame.waitForTimeout(200);
        }
    }

    private async clickVerify(frame: any) {
        await frame.locator("#recaptcha-verify-button").click();
    }

    private async clickReload(frame: any): Promise<boolean> {
        try {
            await frame.locator("#recaptcha-reload-button").click();
            return true;
        } catch { return false; } // Detached
    }
}

export const captchaSolverService = CaptchaSolverService.getInstance();
