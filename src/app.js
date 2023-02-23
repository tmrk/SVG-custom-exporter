'use strict';
import { el } from 'redom';
import './app.scss';
import githublogo from './assets/github-mark.svg';
import icon_fullscreen from './assets/fullscreen_black_48dp.svg';
import icon_fullscreen_exit from './assets/fullscreen_exit_black_48dp.svg';

/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
*/

let url = new URL(window.location);
let svgElementList = 'rect,path,circle,line,polygon,polyline,text,textPath,ellipse';
let display = el('#display');
let controlsList = el('fieldset');
let imageTitle = 'image';
let fullscreen = JSON.parse(localStorage.getItem('fullscreen'));

// Removes duplicates from array
const unique = function (arr) {
  if (arr) {
    var result = [];
    if (arr.constructor === Array) {
      for (var i = 0; i < arr.length; i++) {
        if (result.indexOf(arr[i]) == -1) result.push(arr[i]);
      }
    } else result.push(a);
    return result;
  }
}

// Converts RGB value to hexadecimal
const rgbToHex = function (rgb) {
  if (rgb && rgb !== 'none') {
    let colours = rgb.split(')')[0].split('rgb(')[1].split(', ');
    let res = '#'
    for (var i = 0; i < colours.length; i++) {
      let hex = Number(colours[i]).toString(16);
      if (hex.length < 2) {
        hex = '0' + hex;
      }
      res += hex;
    }
    return res;
  } else return '#000000';
}

// Capitalse first letter of a string
const capitalise = function(s) {
  if (s) return s[0].toUpperCase() + s.slice(1);
}

// Returns SVG as a DOM element
const SVGParser = function (str) {
  const parser = new DOMParser();
  return parser.parseFromString(str, 'text/html').body.childNodes[0];
}

const getOpt = function (key) {
  if (key) return url.searchParams.get(key) || original[key];
  else {
    let hashes = url.search.slice(url.search.indexOf('?') + 1).split('&')
    let params = {}
    hashes.map(hash => {
      let [key, val] = hash.split('=')
      params[key] = decodeURIComponent(val)
    })
    return params;
  }
}

const setOpt = function (objectOrKey, value) {
  if (objectOrKey) {
    let setUrl = (key, val) => {
      if (key && !val) url.searchParams.delete(key);
      else url.searchParams.set(encodeURIComponent(key), encodeURIComponent(val))
    }
    if (typeof objectOrKey === 'object' && objectOrKey.constructor === Object) for (var key in objectOrKey) {
        if (objectOrKey.hasOwnProperty(key)) setUrl(key, objectOrKey[key]);
    } else setUrl(objectOrKey, value);
    window.history.replaceState('', '', url);
  }
}

let opt = {
  src: '',
  exportWidth: 1,
  exportHeight: 1,
  lockColour: [],
  lockSize: [],
  localFile: 0,
  exportUnit: ''
}

let original = {
  width: 1,
  height: 1,
  ratio: 1,
  exportUnit: 'px'
}

for (let key in opt) {
  if (opt.hasOwnProperty(key)) {
    Object.defineProperty(opt, key, {
      set: val => setOpt(key, val),
      get: () => { return getOpt(key) }
    });
  }
}

const cleanOpt = function () {
  let search = (new URL(window.location)).search.slice(url.search.indexOf('?') + 1).split('&');
  for (var i = 0; i < search.length; i++) {
    let key = search[i].split('=')[0];
    if (!opt.hasOwnProperty(key)) setOpt(key, '');
  }
}

const downloadSVG = function() {
  // (c) https://jsfiddle.net/Wijmo5/h2L3gw88/
  let svg = display.getElementsByTagName('svg')[0];
  let data = (new XMLSerializer()).serializeToString(svg);
  let exportWidth = Math.round(convertUnit(opt.exportWidth, opt.exportUnit, 'px'));
  let exportHeight = Math.round(convertUnit(opt.exportHeight, opt.exportUnit, 'px'));
  let canvas = el('canvas', { width: exportWidth, height: exportHeight });
  let ctx = canvas.getContext('2d');
  let image = new Image();
  let filetype = document.querySelector('input[name="filetype"]:checked').value;
  let extension = document.querySelector('input[name="filetype"]:checked').dataset.extension;
  let filename = imageTitle + '_' + exportWidth + 'x' + exportHeight + '.' + extension;
  image.addEventListener('load', function() {
    if (filetype === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image, 0, 0, exportWidth, exportHeight);
    canvas.toBlob(function (blob) {
      let newImg = document.createElement('img'),
      url = URL.createObjectURL(blob);
      newImg.onload = function () {
        URL.revokeObjectURL(url);
      };
      newImg.src = url;
      let event = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true
      });
      let a = el('a', { download: filename, href: url, target: '_blank' });
      a.dispatchEvent(event);
    }, filetype, 1.0);
  });
  image.src = 'data:image/svg+xml,' + encodeURIComponent(data);
}

const convertUnit = function(v, from, to) {
  if      (from === 'in' && to === 'px') return v * 96;
  else if (from === 'px' && to === 'in') return v / 96;
  else if (from === 'in' && to === 'mm') return v * 25.4;
  else if (from === 'mm' && to === 'in') return v / 25.4;
  else if (from === 'mm' && to === 'px') return v * 3.77952755905511;
  else if (from === 'px' && to === 'mm') return v / 3.77952755905511;
  else if (from === to) return v;
}

const resetPage = function () {
  wrapper.classList.remove('loaded', 'dragging');
  display.innerHTML = '';
  controlsList.innerHTML = '';
  document.getElementById('image_title').innerHTML = '';
  imageTitle = 'image';
  let opts = getOpt();
  for (var key in opts) if (opts.hasOwnProperty(key)) setOpt(key, '');
}

const selectThis = function (e) {
  e.target.select();
}

const changeExportSize = function (e) {
  let round = function(v) {
      if (opt.exportUnit === 'px') return Math.round(v);
      else return v;
  }
  e.target.value = round(e.target.value);
  if (e.target.id === 'export_width') {
    let newWidth = round(e.target.value / original.ratio);
    document.getElementById('export_height').value = newWidth;
    opt.exportWidth = e.target.value;
    opt.exportHeight = newWidth;
  } else if (e.target.id === 'export_height') {
    let newHeight = round(e.target.value * original.ratio);
    document.getElementById('export_width').value = newHeight;
    opt.exportHeight = e.target.value;
    opt.exportWidth = newHeight;
  }
}

const changeExportUnit = function (e) {
  if (!e.target.classList.contains('on')) {
    e.target.classList.add('on');
    let siblings = [];
    let n = e.target.parentNode.firstChild;
    for (; n; n = n.nextSibling) if (n.nodeType == 1 && n != e.target) siblings.push(n);
    for (let i = 0; i < siblings.length; i++) siblings[i].classList.remove('on');
    let newExportUnit = e.target.dataset.unit;
    let width = document.getElementById('export_width');
    let height = document.getElementById('export_height');
    width.value = convertUnit(width.value, opt.exportUnit, newExportUnit);
    height.value = convertUnit(height.value, opt.exportUnit, newExportUnit);
    let inputEvent = new Event('input', {'bubbles': true, 'cancelable': true});
    opt.exportUnit = newExportUnit;
    width.dispatchEvent(inputEvent);
    height.dispatchEvent(inputEvent);
    let units = document.getElementById('export_size').getElementsByClassName('unit');
    for (let i = 0; i < units.length; i++) units[i].innerHTML = newExportUnit;
  }
}

const renderPage = function (classes) {
  cleanOpt();
  const resizeButton = () => fullscreen ? SVGParser(icon_fullscreen_exit) : SVGParser(icon_fullscreen);
  let wrapper = el('#wrapper', [
    el('header', [
      el('.title', [
        el('h1', 'SVG Custom Exporter'),
        el('span#image_title', imageTitle.replace(/_/g, ' ')),
        el('span#reset', el('span', 'Reset'), { title: 'Click here to reset everything', onclick: resetPage }),
      ]),
      el('a.github', SVGParser(githublogo), {href: 'https://github.com/tmrk/SVG-custom-exporter', title: 'Code on GitHub'}),
      el('div.resize', resizeButton(), {
        title: fullscreen ? 'Exit fullscreen' : 'Go fullscreen', 
        onclick: function(e) {
          e.stopPropagation();
          fullscreen = !fullscreen;
          if (fullscreen) {
            wrapper.classList.add('fullscreen');
            this.title = 'Exit fullscreen';
          }
          else {
            wrapper.classList.remove('fullscreen');
            this.title = 'Go fullscreen';
          }
          this.innerHTML = null;
          this.appendChild(resizeButton());
          localStorage.setItem('fullscreen', fullscreen);
        }
      })
    ]),
    el('main', [
      el('div#start', [
        el('#dropzone', [
          el('label', el('span', 'Drop an SVG file here or click here to select'), { for: 'file' }),
          el('input#file', { type: 'file', onchange: function() {
            if (this.files[0].type == 'image/svg+xml') {
              wrapper.classList.add('on');
              let file = this.files[0];
              var reader = new FileReader();
              reader.addEventListener('load', function(e) {
                processSVG(reader.result);
                wrapper.classList.add('loaded');
                opt.localFile = 1;
              });
              reader.readAsText(file);
            } else {
              this.value = null;
              console.log('Not SVG!')
            }
          }, ondrop: function() {
            wrapper.classList.remove('dragging');
            resetPage();
          }, ondragleave: function() {
            wrapper.classList.remove('dragging');
          }})
        ]),
        el('#url', [
          el('label', 'Or paste a URL path to an SVG file:', { for: 'urlsrc' }),
          el('input#urlsrc', { type: 'text', spellcheck: false, onfocus: selectThis, value: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' }),
          el('button', 'Open', { onclick: function() {
            fetchSVG(document.getElementById('urlsrc').value);
            wrapper.classList.add('loaded');
          }})
        ])
      ]),
      el('div.left', [
        display,
        el('fieldset', [
          el('legend', [
            'Specify size and file type to export: ',
            el('span#size_px', 'pixel', { title: 'Size in pixels', 'data-unit': 'px', onclick: changeExportUnit }),
            el('span#size_in', 'inch', { title: 'Size in inches', 'data-unit': 'in', onclick: changeExportUnit }),
            el('span#size_mm', 'mm', { title: 'Size in millimetres', 'data-unit': 'mm', onclick: changeExportUnit })
          ]),
          el('div#export_size', [
            el('label', 'Width:', { for: 'export_width' }),
            el('input#export_width', { type: 'number', oninput: changeExportSize, onfocus: selectThis }),
            el('span.unit', opt.exportUnit),
            el('label', 'Height:', { for: 'export_height' }),
            el('input#export_height', { type: 'number', oninput: changeExportSize, onfocus: selectThis }),
            el('span.unit', opt.exportUnit)
          ]),
          el('div', [
            el('input#filetype_png', { name: 'filetype', type: 'radio', value: 'image/png', 'data-extension': 'png', checked: true }),
            el('label', 'PNG', { for: 'filetype_png' }),
            el('input#filetype_jpg', { name: 'filetype', type: 'radio', value: 'image/jpeg', 'data-extension': 'jpg' }),
            el('label', 'JPG', { for: 'filetype_jpg' }),
          ]),
          el('button#download', 'Download', { onclick: downloadSVG })
        ])
      ]),
      el('div#controls', [
        el('h2', 'Control layers'),
        controlsList
      ])
    ]),
    el('footer', [

    ])
  ], { classList: classes ? classes : '', ondragenter: function() {
      this.classList.add('dragging');
    }})
  document.body.appendChild(wrapper);
  document.getElementById('size_' + opt.exportUnit).classList.add('on')
}

const processSVG = function(svg) {
  let node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  let parser = new DOMParser();
  let doc = parser.parseFromString(svg, 'image/svg+xml');
  node.appendChild(doc.documentElement);
  let svgNode = node.childNodes[0];
  let svgParts = Array.from(svgNode.querySelectorAll(svgElementList));
  svgNode.style.width = '100%';
  svgNode.style.height = '100%';
  svgNode.style.padding = '10px';
  display.append(svgNode);

  original.width = Math.round(svgNode.width.baseVal.value);
  original.height = Math.round(svgNode.height.baseVal.value);
  original.ratio = original.width / original.height;
  if (opt.exportWidth) opt.exportWidth = Math.round(parseFloat(opt.exportWidth));
  if (opt.exportWidth) {
    opt.exportHeight = Math.round(parseFloat(opt.exportWidth) / original.ratio);
  } else if (!opt.exportWidth && opt.exportHeight) {
    opt.exportWidth = Math.round(parseFloat(opt.exportHeight) * original.ratio)
  } else {
    opt.exportWidth = Math.round(original.width);
    opt.exportHeight = Math.round(original.height);
  };
  document.getElementById('export_width').value = opt.exportWidth;
  document.getElementById('export_height').value = opt.exportHeight;

  let tags = {};
  for (var i = 0; i < svgParts.length; i++) {
    let inputID = 'svgPart-' + i;
    if (!tags[svgParts[i].tagName]) tags[svgParts[i].tagName] = 1;
    else tags[svgParts[i].tagName]++;
    let inputName = svgParts[i].attributes['aria-label']
      ? svgParts[i].attributes['aria-label'].value
      : Array.from(svgParts[i].childNodes).filter(tag => tag.tagName === 'title')[0]
      ? Array.from(svgParts[i].childNodes).filter(tag => tag.tagName === 'title')[0].innerHTML
      : capitalise(svgParts[i].tagName) + ' ' + tags[svgParts[i].tagName];
    let fill = rgbToHex(getComputedStyle(svgParts[i]).fill);
    controlsList.appendChild(el('div', [
      el('input', { id: inputID, type: 'checkbox', 'data-id': i, checked: true, onchange: function() {
        svgParts[this.dataset.id].setAttribute('visibility', this.checked ? 'visible' : 'hidden');
      }}),
      el('label', inputName, { for: inputID }),
      el('input', { type: 'color', title: 'Change color', value: fill, 'data-id': i, onchange: function() {
        svgParts[this.dataset.id].setAttribute('fill', this.value);
        svgParts[this.dataset.id].style.fill = this.value;
      }})
    ]))
  }
  localStorage.setItem('svg', svg);
}

const fetchSVG = function (src) {
  fetch(src)
    .then(response => {
      if (!response.ok) {
        console.log('Error');
        throw response;
      }
      opt.src = src;
      return response.text();
    })
    .then(svg => {
      processSVG(svg);
      localStorage.setItem('imageTitle', src.split('/')[src.split('/').length - 1].split('.')[0]);
    });
}

const wrapperClasses = new Set();
if (fullscreen) wrapperClasses.add('fullscreen');
if (window.innerWidth <= 400) wrapperClasses.add('mobile');
if (opt.localFile && localStorage.getItem('svg')) { // Load from localStorage
  wrapperClasses.add('loaded');
  processSVG(localStorage.getItem('svg'));
} else if (opt.src) { // load from external url
  imageTitle = opt.src.split('/')[opt.src.split('/').length - 1].split('.')[0];
  wrapperClasses.add('loaded');
  renderPage([...wrapperClasses].join('  '));
  fetchSVG(opt.src);
} else { // load from user input
  renderPage([...wrapperClasses].join('  '));
}

