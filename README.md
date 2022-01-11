# Area Selection

Simple and easy area selection library for image/video cropping.

## Installation

```bash
$ npm install area-selection-js --save # or yarn add area-selection-js
```

## Usage

1. In your HTML document:

```html
<img src="path/to/image.jpg" id="selection" />
```

2. Create the instance in your JavaScript file:

```javascript
import AreaSelection from 'area-selection-js';
import 'area-selection-js/dist/area-selection.css';

const selection = new AreaSelection('#selection', {
 // options
});
```
> Proptip: you can also pass an HTMLElement instead of a selector

3. To retrieve the selected value

```javascript
const value = selection.getValue();
// {x: 20, y:20, width: 120, height: 120}
```

## Options

#### **aspectRatio**

Constrain the selection region to an aspect ratio.

* Type: `Number`
* Default: `null`
* Example: `aspectRatio: 1` (Square)

#### **maxSize**

Constrain the selection region to a maximum size.

* Type: `[width, height, unit?]`
* Default: `null`
* Example: `maxSize: [50, 50, '%']` (A maximum size of 50% of the image size)

_Note: `unit` accepts a value of **'px'** or **'%'**. Defaults to **'px'**._


#### **minSize**

Constrain the selection region to a minimum size.

- Type: `[width, height, unit?]`
- Default: `null`
- Example: `minSize: [20, 20, 'px']` (A minimum width and height of 20px)

_Note: `unit` accepts a value of **'px'** or **'%'**. Defaults to **'px'**._


#### **startSize**

The starting size of the selection region when it is initialized.

- Type: `[width, height, unit?]`
- Default: `[100, 100, '%']` (A starting selection region as large as possible)
- Example: `startSize: [50, 50]` (A starting selection region of 50% of the image size)

_Note: `unit` accepts a value of **'px'** or **'%'**. Defaults to **'%'**._


#### **onSelectStart**

A callback function that is called when the user starts selecting.

* Type: `Function`
* Arguments: `data = {x, y, width, height}`
* Example:
```javascript
onSelectStart: function(data) {
  console.log(data.x, data.y, data.width, data.height);
}
```

#### **onSelectMove**

A callback function that is called when the selected region changes.

* Type: `Function`
* Arguments: `data = {x, y, width, height}`
* Example:
```javascript
onSelectMove: function(data) {
  console.log(data.x, data.y, data.width, data.height);
}
```

#### **onSelectEnd**

A callback function that is called when the user stops selecting.

* Type: `Function`
* Arguments: `data = {x, y, width, height}`
* Example:
```javascript
onSelectEnd: function(data) {
  console.log(data.x, data.y, data.width, data.height);
}
```

#### onInitialize

A callback function that is called when the AreaSelection instance is fully initialized.

* Type: `Function`
* Arguments: The AreaSelection instance
* Example:
```javascript
onInitialize: function(instance) {
  // do things here
}
```


#### **returnMode**

Define how the selected region should be calculated.

* Type: `String`
* Default: `"real"`
* Possible values: `"real"`, `"ratio"` or `"raw"`
  * `real` returns the selected region values based on the size of the image's actual sizes. This ensures that the selected region values are the same regardless if the AreaSelection element is scaled or not.
  * `ratio` returns the selected region values as a ratio between 0 to 1. e.g. For example, an `x, y` position at the center will be `{x: 0.5, y: 0.5}`.
  * `raw` returns the selected region values as is based on the size of the AreaSelection element.



## Methods

#### getValue(_returnMode?: string_)

Returns the value of the selected region. `returnMode` inherits from options by default. Refer to [returnMode](#returnmode) for possible values.

```javascript
var value = instance.getValue();
// value = {x: 21, y: 63: width: 120, height: 120}

var ratio = instance.getValue('ratio');
// value = {x: 0.1, y: 0.3: width: 0.57, height: 0.57}
```

#### destroy()

Destroys the AreaSelection instance and restores the original `img` element or `video` element.

#### moveTo(x: number, y: number)

Moves the selected region to the specified coordinates. Returns the AreaSelection instance.

#### resizeTo(width: number, height: number, _origin?: Array_)

Resizes the selected region to the specified size. `origin` is an optional argument that specifies the origin point (in ratio) to resize from in the format of `[x, y]`. Defaults to `[0.5, 0.5]` (center). Returns the AreaSelection instance.

#### scaleBy(factor: number, _origin?: Array_)

Scales the selected region by a factor. `origin` is an optional argument that specifies the origin point (in ratio) to resize from in the format of `[x, y]`. Defaults to `[0.5, 0.5]` (center). Returns the AreaSelection instance.

#### reset()

Resets the selected region to its original position and size. Returns the AreaSelection instance.



## Credits

- [Babel Starter Kit](https://github.com/kriasoft/babel-starter-kit) - A project template for authoring and publishing JavaScript libraries using ES2015+ via [Babel](https://babeljs.io/).
- [Croppr.js](https://github.com/jamesssooi/Croppr.js) — A vanilla JavaScript image cropper that's lightweight, awesome, and has absolutely zero dependencies.
- [Cropperjs](https://github.com/fengyuanchen/cropperjs) — JavaScript image cropper.
