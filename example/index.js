import AreaSelection from '../src/area-selection.js';
import '../src/area-selection.css';

window.selection = new AreaSelection('#selection', {
  aspectRatio: 16 / 9,
  onInitialize: (instance) => { console.log(instance); },
  onSelectStart: (data) => { console.log('start', data); },
  onSelectEnd: (data) => { console.log('end', data); },
  onSelectMove: (data) => { console.log('move', data); }
});
