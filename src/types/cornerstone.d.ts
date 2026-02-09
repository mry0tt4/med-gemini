// Type declarations for cornerstone libraries
declare module "cornerstone-core" {
    interface Viewport {
        scale: number;
        translation: { x: number; y: number };
        voi: { windowWidth: number; windowCenter: number };
        invert: boolean;
        pixelReplication: boolean;
        rotation: number;
        hflip: boolean;
        vflip: boolean;
    }

    interface Image {
        imageId: string;
        minPixelValue: number;
        maxPixelValue: number;
        slope: number;
        intercept: number;
        windowCenter: number;
        windowWidth: number;
        getPixelData: () => Int16Array | Uint16Array | Uint8Array;
        rows: number;
        columns: number;
        height: number;
        width: number;
        color: boolean;
        columnPixelSpacing: number;
        rowPixelSpacing: number;
        invert: boolean;
        sizeInBytes: number;
    }

    export function enable(element: HTMLElement): void;
    export function disable(element: HTMLElement): void;
    export function loadImage(imageId: string): Promise<Image>;
    export function displayImage(element: HTMLElement, image: Image): void;
    export function getViewport(element: HTMLElement): Viewport | undefined;
    export function setViewport(element: HTMLElement, viewport: Viewport): void;
    export function reset(element: HTMLElement): void;
    export function updateImage(element: HTMLElement): void;
    export function resize(element: HTMLElement, fitToWindow?: boolean): void;
}

declare module "cornerstone-wado-image-loader" {
    interface WebWorkerConfig {
        maxWebWorkers: number;
        startWebWorkersOnDemand: boolean;
        taskConfiguration: {
            decodeTask: {
                initializeCodecsOnStartup: boolean;
                usePDFJS: boolean;
                strict: boolean;
            };
        };
    }

    export const external: {
        cornerstone: typeof import("cornerstone-core");
        dicomParser: typeof import("dicom-parser");
    };

    export const webWorkerManager: {
        initialize: (config: WebWorkerConfig) => void;
    };
}

declare module "cornerstone-web-image-loader" {
    export const external: {
        cornerstone: typeof import("cornerstone-core");
    };
}
