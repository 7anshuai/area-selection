// Type definitions for area-selection.js
// Based on the template: https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-class-d-ts.html


/*~ Expose this module as a UMD */
export as namespace AreaSelection;

/*~ Specify the class constructor function */
export = AreaSelection;


declare class AreaSelection {

  /** @constructor */
  constructor(element: string | HTMLElement, options?: AreaSelection.Options, deferred?: boolean)

  /** Gets the value of the crop region */
  getValue(mode?: 'real' | 'ratio' | 'raw'): AreaSelection.CropValue

  /** Changes the image src. */
  setOptions(options: AreaSelection.Options): AreaSelection

  /** Destroys the AreaSelection instance */
  destroy(): void

  /** Moves the crop region to a specified coordinate */
  moveTo(x: number, y: number): AreaSelection

  /** Resizes the crop region to a specified width and height */
  resizeTo(width: number, height: number, origin?: Array<number>): AreaSelection

  /** Scale the crop region by a factor */
  scaleBy(factor: number, origin?: Array<number>): AreaSelection

  /** Resets the crop region to the initial settings */
  reset(): AreaSelection

}

/*~ Declare type modules */
declare namespace AreaSelection {

  export interface Options {
    aspectRatio?: number;
    maxSize?: SizeValue;
    minSize?: SizeValue;
    startSize?: SizeValue;
    onSelectStart?(data: SelectValue): void;
    onSelectMove?(data: SelectValue): void;
    onSelectEnd?(data: SelectValue): void;
    onInitialize?(instance: AreaSelection): void;
    returnMode?: 'real' | 'ratio' | 'raw';
  }

  export interface SelectValue {
    x: number;
    y: number;
    width: number;
    height: number
  }

  export interface SizeValue extends Array<string | number> {
    0: number,
    1: number,
    2?: 'px' | '%'
  }

}
