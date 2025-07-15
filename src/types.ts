export interface IIIFManifest {
    "@context": string;
    id: string;
    type: "Manifest";
    label: {
        [language: string]: string[];
    };
    items: Canvas[];
}

export interface Canvas {
    id: string;
    type: "Canvas";
    label: {
        [language: string]: string[];
    };
    height: number;
    width: number;
    items: AnnotationPage[];
}

export interface AnnotationPage {
    id: string;
    type: "AnnotationPage";
    items: Annotation[];
}

export interface Annotation {
    id: string;
    type: "Annotation";
    motivation: string;
    body: AnnotationBody;
    target: string;
}

export interface AnnotationBody {
    id: string;
    type: "Image";
    format: string;
    label: {
        [language: string]: string[];
    };
    width?: number;
    height?: number;
    service: ImageService[];
    selector: SvgSelector;
    transform: Transform;
}

export interface ImageService {
    id: string;
    type: "ImageService3";
    profile: string;
}

export interface SvgSelector {
    type: "SvgSelector";
    region: string;
}

export interface Transform {
    x: number;
    y: number;
    rotation: number;
    scale?: number;
    hide_bg?: boolean; // Optional, only present on some items
}
