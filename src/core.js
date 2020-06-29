import Box from './box';
import Handle from './handle';
import enableTouch from './touch';

/**
 * Define a list of handles to create.
 *
 * @property {Array} position - The x and y ratio position of the handle within
 *      the crop region. Accepts a value between 0 to 1 in the order of [X, Y].
 * @property {Array} constraints - Define the side of the crop region that is to
 *      be affected by this handle. Accepts a value of 0 or 1 in the order of
 *      [TOP, RIGHT, BOTTOM, LEFT].
 * @property {String} direction - The direction of this handle.
 */
const HANDLES = [
  { position: [0.0, 0.0], constraints: [1, 0, 0, 1], direction: 'nw' },
  { position: [0.5, 0.0], constraints: [1, 0, 0, 0], direction: 'n' },
  { position: [1.0, 0.0], constraints: [1, 1, 0, 0], direction: 'ne' },
  { position: [1.0, 0.5], constraints: [0, 1, 0, 0], direction: 'e' },
  { position: [1.0, 1.0], constraints: [0, 1, 1, 0], direction: 'se' },
  { position: [0.5, 1.0], constraints: [0, 0, 1, 0], direction: 's' },
  { position: [0.0, 1.0], constraints: [0, 0, 1, 1], direction: 'sw' },
  { position: [0.0, 0.5], constraints: [0, 0, 0, 1], direction: 'w' }
];

/**
 * Core class for AreaSelection containing most of its functional logic.
 */
export default class Core {
  constructor(element, options, deferred = false) {

    // Parse options
    this.options = Core.parseOptions(options || {});

    // Get target img element
    if (!element.nodeName) {
      element = document.querySelector(element);
      if (element == null) { throw 'Unable to find element.' }
    }

    // Define internal props
    this._initialized = false;
    this._restore = {
      parent: element.parentNode,
      element: element
    }

    // Wait until image is loaded before proceeding
    if (!deferred) {
      if (element.width === 0 || element.height === 0) {
        element.onload = () => { this.initialize(element); }
      } else {
        this.initialize(element);
      }
    }
  }

  /**
   * Initialize the AreaSelection instance
   */
  initialize(element) {
    // Create DOM elements
    this.createDOM(element);

    // Process option values
    this.options.convertToPixels(this.selectionEl);

    // Listen for events from children
    this.attachHandlerEvents();
    this.attachRegionEvents();
    this.attachOverlayEvents();

    // Bootstrap this area selection instance
    this.box = this.initializeBox(this.options);
    this.redraw();

    // Set the initalized flag to true and call the callback
    this._initialized = true;
    if (this.options.onInitialize !== null) {
      this.options.onInitialize(this);
    }
  }

  /**
   * Create AreaSelection's DOM elements
   */
  createDOM(targetEl) {
    // Create main container and use it as the main event listeners
    this.containerEl = document.createElement('div');
    this.containerEl.className = 'area-selection-container';
    this.eventBus = this.containerEl;
    enableTouch(this.containerEl);

    // Create selection element
    this.selectionEl = document.createElement('div');
    this.selectionEl.className = 'area-selection';

    // Create region box element
    this.regionEl = document.createElement('div');
    this.regionEl.className = 'area-selection-region';

    // Create overlay element
    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'area-selection-overlay';

    // Create dashed lines
    ['h', 'v'].forEach((item) => {
      const dashedLine = document.createElement('div');
      dashedLine.className = `area-selection-dashed area-selection-dashed-${item}`;
      this.regionEl.appendChild(dashedLine);
    });

    // Create center crosshair
    const center = document.createElement('div');
    center.className = 'area-selection-center';
    this.regionEl.appendChild(center);

    // Create handles element
    this.handles = [];
    for (let i = 0; i < HANDLES.length; i++) {
      const handle = new Handle(HANDLES[i].position,
        HANDLES[i].constraints,
        HANDLES[i].direction,
        this.eventBus);
      this.handles.push(handle);
      this.regionEl.appendChild(handle.el);
    }

    // And then we piece it all together!
    this.targetEl = targetEl;
    this.selectionEl.appendChild(targetEl);
    this.selectionEl.appendChild(this.regionEl);
    this.selectionEl.appendChild(this.overlayEl);
    this.containerEl.appendChild(this.selectionEl);

    // And then finally insert it into the document
    this._restore.parent.appendChild(this.containerEl);
  }

  /**
   * Destroy the AreaSelection instance and replace with the original element.
   */
  destroy() {
    this._restore.parent.replaceChild(this._restore.element, this.containerEl);
  }

  /**
   * Create a new box region with a set of options.
   * @param {Object} opts The options.
   * @returns {Box}
   */
  initializeBox(opts) {
    // Create initial box
    const width = opts.startSize.width;
    const height = opts.startSize.height;
    let box = new Box(0, 0, width, height)

    // Maintain ratio
    box.constrainToRatio(opts.aspectRatio, [0.5, 0.5]);

    // Maintain minimum/maximum size
    const min = opts.minSize;
    const max = opts.maxSize;
    box.constrainToSize(max.width, max.height, min.width, min.height,
      [0.5, 0.5], opts.aspectRatio);

    // Constrain to boundary
    const parentWidth = this.selectionEl.offsetWidth;
    const parentHeight = this.selectionEl.offsetHeight;
    box.constrainToBoundary(parentWidth, parentHeight, [0.5, 0.5]);

    // Move to center
    const x = (this.selectionEl.offsetWidth / 2) - (box.width() / 2);
    const y = (this.selectionEl.offsetHeight / 2) - (box.height() / 2);
    box.move(x, y);

    return box;
  }

  /**
   * Draw visuals (border, handles, etc) for the current box.
   */
  redraw() {
    // Round positional values to prevent subpixel coordinates, which can
    // result in element that is rendered blurly
    const width = Math.round(this.box.width()),
      height = Math.round(this.box.height()),
      x1 = Math.round(this.box.x1),
      y1 = Math.round(this.box.y1),
      x2 = Math.round(this.box.x2),
      y2 = Math.round(this.box.y2);

    window.requestAnimationFrame(() => {
      // Update region element
      this.regionEl.style.transform = `translate(${x1}px, ${y1}px)`
      this.regionEl.style.width = width + 'px';
      this.regionEl.style.height = height + 'px';
    });
  }

  /**
   * Attach listeners for events emitted by the handles.
   * Enables resizing of the region element.
   */
  attachHandlerEvents() {
    const eventBus = this.eventBus;
    eventBus.addEventListener('handlestart', this.onHandleMoveStart.bind(this));
    eventBus.addEventListener('handlemove', this.onHandleMoveMoving.bind(this));
    eventBus.addEventListener('handleend', this.onHandleMoveEnd.bind(this));
  }

  /**
   * Attach event listeners for the crop region element.
   * Enables dragging/moving of the region element.
   */
  attachRegionEvents() {
    const eventBus = this.eventBus;
    const self = this;

    this.regionEl.addEventListener('mousedown', onMouseDown);
    eventBus.addEventListener('regionstart', this.onRegionMoveStart.bind(this));
    eventBus.addEventListener('regionmove', this.onRegionMoveMoving.bind(this));
    eventBus.addEventListener('regionend', this.onRegionMoveEnd.bind(this));

    function onMouseDown(e) {
      e.stopPropagation();
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('mousemove', onMouseMove);

      // Notify parent
      eventBus.dispatchEvent(new CustomEvent('regionstart', {
        detail: { mouseX: e.clientX, mouseY: e.clientY }
      }));
    }

    function onMouseMove(e) {
      e.stopPropagation();

      // Notify parent
      eventBus.dispatchEvent(new CustomEvent('regionmove', {
        detail: { mouseX: e.clientX, mouseY: e.clientY }
      }));
    }

    function onMouseUp(e) {
      e.stopPropagation();
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);

      // Notify parent
      eventBus.dispatchEvent(new CustomEvent('regionend', {
        detail: { mouseX: e.clientX, mouseY: e.clientY }
      }));
    }
  }

  /**
   * Attach event listeners for the overlay element.
   * Enables the creation of a new selection by dragging an empty area.
   */
  attachOverlayEvents() {
    const SOUTHEAST_HANDLE_IDX = 4;
    const self = this;
    let tmpBox = null;
    this.overlayEl.addEventListener('mousedown', onMouseDown);

    function onMouseDown(e) {
      e.stopPropagation();
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('mousemove', onMouseMove);

      // Calculate mouse's position in relative to the container
      const container = self.selectionEl.getBoundingClientRect();
      const mouseX = e.clientX - container.left;
      const mouseY = e.clientY - container.top;

      // Create new box at mouse position
      tmpBox = self.box;
      self.box = new Box(mouseX, mouseY, mouseX + 1, mouseY + 1);

      // Activate the bottom right handle
      self.eventBus.dispatchEvent(new CustomEvent('handlestart', {
        detail: { handle: self.handles[SOUTHEAST_HANDLE_IDX] }
      }));
    }

    function onMouseMove(e) {
      e.stopPropagation();
      self.eventBus.dispatchEvent(new CustomEvent('handlemove', {
        detail: { mouseX: e.clientX, mouseY: e.clientY }
      }));
    }

    function onMouseUp(e) {
      e.stopPropagation();
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);

      // If the new box has no width and height, it suggests that
      // the user had just clicked on an empty area and did not drag
      // a new box (ie. an accidental click). In this scenario, we
      // simply replace it with the previous box.
      if (self.box.width() === 1 && self.box.height() === 1) {
        self.box = tmpBox;
        return;
      }

      self.eventBus.dispatchEvent(new CustomEvent('handleend', {
        detail: { mouseX: e.clientX, mouseY: e.clientY }
      }));
    }

  }

  /**
   * EVENT HANDLER
   * Executes when user begins dragging a handle.
   */
  onHandleMoveStart(e) {
    let handle = e.detail.handle;

    // The origin point is the point where the box is scaled from.
    // This is usually the opposite side/corner of the active handle.
    const originPoint = [1 - handle.position[0], 1 - handle.position[1]];
    let [originX, originY] = this.box.getAbsolutePoint(originPoint);

    this.activeHandle = { handle, originPoint, originX, originY }

    // Trigger callback
    if (this.options.onSelectStart !== null) {
      this.options.onSelectStart(this.getValue());
    }
  }

  /**
   * EVENT HANDLER
   * Executes on handle move. Main logic to manage the movement of handles.
   */
  onHandleMoveMoving(e) {
    let { mouseX, mouseY } = e.detail;

    // Calculate mouse's position in relative to the container
    let container = this.selectionEl.getBoundingClientRect();
    mouseX = mouseX - container.left;
    mouseY = mouseY - container.top;

    // Ensure mouse is within the boundaries
    if (mouseX < 0) { mouseX = 0; }
    else if (mouseX > container.width) { mouseX = container.width; }

    if (mouseY < 0) { mouseY = 0; }
    else if (mouseY > container.height) { mouseY = container.height; }

    // Bootstrap helper variables
    let origin = this.activeHandle.originPoint.slice();
    const originX = this.activeHandle.originX;
    const originY = this.activeHandle.originY;
    const handle = this.activeHandle.handle;
    const TOP_MOVABLE = handle.constraints[0] === 1;
    const RIGHT_MOVABLE = handle.constraints[1] === 1;
    const BOTTOM_MOVABLE = handle.constraints[2] === 1;
    const LEFT_MOVABLE = handle.constraints[3] === 1;
    const MULTI_AXIS = (LEFT_MOVABLE || RIGHT_MOVABLE) &&
      (TOP_MOVABLE || BOTTOM_MOVABLE);

    // Apply movement to respective sides according to the handle's
    // constraint values.
    let x1 = LEFT_MOVABLE || RIGHT_MOVABLE ? originX : this.box.x1;
    let x2 = LEFT_MOVABLE || RIGHT_MOVABLE ? originX : this.box.x2;
    let y1 = TOP_MOVABLE || BOTTOM_MOVABLE ? originY : this.box.y1;
    let y2 = TOP_MOVABLE || BOTTOM_MOVABLE ? originY : this.box.y2;
    x1 = LEFT_MOVABLE ? mouseX : x1;
    x2 = RIGHT_MOVABLE ? mouseX : x2;
    y1 = TOP_MOVABLE ? mouseY : y1;
    y2 = BOTTOM_MOVABLE ? mouseY : y2;

    // Check if the user dragged past the origin point. If it did,
    // we set the flipped flag to true.
    let [isFlippedX, isFlippedY] = [false, false];
    if (LEFT_MOVABLE || RIGHT_MOVABLE) {
      isFlippedX = LEFT_MOVABLE ? mouseX > originX : mouseX < originX;
    }
    if (TOP_MOVABLE || BOTTOM_MOVABLE) {
      isFlippedY = TOP_MOVABLE ? mouseY > originY : mouseY < originY;
    }

    // If it is flipped, we swap the coordinates and flip the origin point.
    if (isFlippedX) {
      const tmp = x1; x1 = x2; x2 = tmp; // Swap x1 and x2
      origin[0] = 1 - origin[0]; // Flip origin x point
    }
    if (isFlippedY) {
      const tmp = y1; y1 = y2; y2 = tmp; // Swap y1 and y2
      origin[1] = 1 - origin[1]; // Flip origin y point
    }

    // Create new box object
    let box = new Box(x1, y1, x2, y2);

    // Maintain aspect ratio
    if (this.options.aspectRatio) {
      const ratio = this.options.aspectRatio;
      let isVerticalMovement = false;
      if (MULTI_AXIS) {
        isVerticalMovement = (mouseY > box.y1 + ratio * box.width()) ||
          (mouseY < box.y2 - ratio * box.width());
      } else if (TOP_MOVABLE || BOTTOM_MOVABLE) {
        isVerticalMovement = true;
      }
      const ratioMode = isVerticalMovement ? 'width' : 'height';
      box.constrainToRatio(ratio, origin, ratioMode);
    }

    // Maintain minimum/maximum size
    const min = this.options.minSize;
    const max = this.options.maxSize;
    box.constrainToSize(max.width, max.height, min.width,
      min.height, origin, this.options.aspectRatio);

    // Constrain to boundary
    const parentWidth = this.selectionEl.offsetWidth;
    const parentHeight = this.selectionEl.offsetHeight;
    box.constrainToBoundary(parentWidth, parentHeight, origin);

    // Finally, update the visuals (border, handles, clipped image, etc)
    this.box = box;
    this.redraw();

    // Trigger callback
    if (this.options.onSelectMove !== null) {
      this.options.onSelectMove(this.getValue());
    }
  }

  /**
   * EVENT HANDLER
   * Executes on handle move end.
   */
  onHandleMoveEnd(e) {
    // Trigger callback
    if (this.options.onSelectEnd !== null) {
      this.options.onSelectEnd(this.getValue());
    }
  }

  /**
   * EVENT HANDLER
   * Executes when user starts moving the crop region.
   */
  onRegionMoveStart(e) {
    let { mouseX, mouseY } = e.detail;

    // Calculate mouse's position in relative to the container
    let container = this.selectionEl.getBoundingClientRect();
    mouseX = mouseX - container.left;
    mouseY = mouseY - container.top;

    this.currentMove = {
      offsetX: mouseX - this.box.x1,
      offsetY: mouseY - this.box.y1
    }

    // Trigger callback
    if (this.options.onSelectStart !== null) {
      this.options.onSelectStart(this.getValue());
    }
  }

  /**
   * EVENT HANDLER
   * Executes when user moves the crop region.
   */
  onRegionMoveMoving(e) {
    let { mouseX, mouseY } = e.detail;
    let { offsetX, offsetY } = this.currentMove;

    // Calculate mouse's position in relative to the container
    let container = this.selectionEl.getBoundingClientRect();
    mouseX = mouseX - container.left;
    mouseY = mouseY - container.top;

    this.box.move(mouseX - offsetX, mouseY - offsetY);

    // Ensure box is within the boundaries
    if (this.box.x1 < 0) {
      this.box.move(0, null);
    }
    if (this.box.x2 > container.width) {
      this.box.move(container.width - this.box.width(), null);
    }
    if (this.box.y1 < 0) {
      this.box.move(null, 0);
    }
    if (this.box.y2 > container.height) {
      this.box.move(null, container.height - this.box.height());
    }

    // Update visuals
    this.redraw();

    // Trigger callback
    if (this.options.onSelectMove !== null) {
      this.options.onSelectMove(this.getValue());
    }
  }

  /**
   * EVENT HANDLER
   * Executes when user stops moving the crop region (mouse up).
   */
  onRegionMoveEnd(e) {
    // Trigger callback
    if (this.options.onSelectEnd !== null) {
      this.options.onSelectEnd(this.getValue());
    }
  }


  /**
   * Calculate the value of the crop region.
   */
  getValue(mode = null) {
    if (mode === null) { mode = this.options.returnMode; }
    if (mode == 'real') {
      const actualWidth = this.targetEl.naturalWidth || this.targetEl.width
      const actualHeight = this.targetEl.naturalHeight || this.targetEl.height
      const { width: elementWidth, height: elementHeight } = this.targetEl.getBoundingClientRect();
      const factorX = (actualWidth || elementWidth) / elementWidth;
      const factorY = (actualHeight || elementHeight) / elementHeight;
      return {
        x: Math.round(this.box.x1 * factorX),
        y: Math.round(this.box.y1 * factorY),
        width: Math.round(this.box.width() * factorX),
        height: Math.round(this.box.height() * factorY)
      }
    } else if (mode == 'ratio') {
      const { width: elementWidth, height: elementHeight } = this.targetEl.getBoundingClientRect();
      return {
        x: round(this.box.x1 / elementWidth, 3),
        y: round(this.box.y1 / elementHeight, 3),
        width: round(this.box.width() / elementWidth, 3),
        height: round(this.box.height() / elementHeight, 3)
      }
    } else if (mode == 'raw') {
      return {
        x: Math.round(this.box.x1),
        y: Math.round(this.box.y1),
        width: Math.round(this.box.width()),
        height: Math.round(this.box.height())
      }
    }
  }

  /**
   * Parse user options and set default values.
   */
  static parseOptions(opts) {
    const defaults = {
      aspectRatio: null,
      maxSize: { width: null, height: null },
      minSize: { width: null, height: null },
      startSize: { width: 100, height: 100, unit: '%' },
      returnMode: 'real',
      onInitialize: null,
      onSelectStart: null,
      onSelectMove: null,
      onSelectEnd: null,
    }

    // Parse aspect ratio
    let aspectRatio = null;
    if (opts.aspectRatio !== undefined) {
      if (typeof (opts.aspectRatio) === 'number') {
        aspectRatio = opts.aspectRatio
      } else if (opts.aspectRatio instanceof Array) {
        aspectRatio = opts.aspectRatio[1] / opts.aspectRatio[0];
      }
    }

    // Parse max width/height
    let maxSize = null;
    if (opts.maxSize !== undefined && opts.maxSize !== null) {
      maxSize = {
        width: opts.maxSize[0] || null,
        height: opts.maxSize[1] || null,
        unit: opts.maxSize[2] || 'px'
      }
    }

    // Parse min width/height
    let minSize = null;
    if (opts.minSize !== undefined && opts.minSize !== null) {
      minSize = {
        width: opts.minSize[0] || null,
        height: opts.minSize[1] || null,
        unit: opts.minSize[2] || 'px'
      }
    }

    // Parse start size
    let startSize = null;
    if (opts.startSize !== undefined && opts.startSize !== null) {
      startSize = {
        width: opts.startSize[0] || null,
        height: opts.startSize[1] || null,
        unit: opts.startSize[2] || '%'
      }
    }

    // Parse callbacks
    let onInitialize = null;
    if (typeof opts.onInitialize === 'function') {
      onInitialize = opts.onInitialize;
    }

    let onSelectStart = null;
    if (typeof opts.onSelectStart === 'function') {
      onSelectStart = opts.onSelectStart;
    }

    let onSelectEnd = null;
    if (typeof opts.onSelectEnd === 'function') {
      onSelectEnd = opts.onSelectEnd;
    }

    let onSelectMove = null;
    if (typeof opts.onSelectMove === 'function') {
      onSelectMove = opts.onSelectMove;
    }

    // Parse returnMode value
    let returnMode = null;
    if (opts.returnMode !== undefined) {
      const s = opts.returnMode.toLowerCase();
      if (['real', 'ratio', 'raw'].indexOf(s) === -1) {
        throw "Invalid return mode.";
      }
      returnMode = s;
    }

    // Create function to convert % values to pixels
    const convertToPixels = function (container) {
      const width = container.offsetWidth;
      const height = container.offsetHeight;

      // Convert sizes
      const sizeKeys = ['maxSize', 'minSize', 'startSize'];
      for (let i = 0; i < sizeKeys.length; i++) {
        const key = sizeKeys[i];
        if (this[key] !== null) {
          if (this[key].unit == '%') {
            if (this[key].width !== null) {
              this[key].width = (this[key].width / 100) * width;
            }
            if (this[key].height !== null) {
              this[key].height = (this[key].height / 100) * height;
            }
          }
          delete this[key].unit;
        }
      }
    }

    const defaultValue = (v, d) => (v !== null ? v : d);
    return {
      aspectRatio: defaultValue(aspectRatio, defaults.aspectRatio),
      maxSize: defaultValue(maxSize, defaults.maxSize),
      minSize: defaultValue(minSize, defaults.minSize),
      startSize: defaultValue(startSize, defaults.startSize),
      returnMode: defaultValue(returnMode, defaults.returnMode),
      onInitialize: defaultValue(onInitialize, defaults.onInitialize),
      onSelectStart: defaultValue(onSelectStart, defaults.onSelectStart),
      onSelectMove: defaultValue(onSelectMove, defaults.onSelectMove),
      onSelectEnd: defaultValue(onSelectEnd, defaults.onSelectEnd),
      convertToPixels: convertToPixels
    }
  }

  /**
   * Set user options and redraw
  */
 setOptions(opts) {
   this.options = Core.parseOptions(Object.assign(this.options, opts || {}));
   this.box = this.initializeBox(this.options);
   this.redraw();
 }
}

/**
 * HELPER FUNCTIONS
 */

function round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}
