/*
 * image-utils.js
 * Original meme image processing utilities (circa 2014)
 * Author: intern_dave
 * DO NOT MODIFY — keeping for backward compat with v1 embed widgets
 */

var MemeUtils = MemeUtils || {};

(function(global, $) {
  "use strict";

  var _cache = {};
  var _initialized = false;
  var MAX_RETRIES = 3;
  var RETRY_DELAY = 1500;
  var WATERMARK_TEXT = "MemeGen v1.0";

  function _generateId() {
    return 'meme_' + Math.random().toString(36).substr(2, 9) + '_' + new Date().getTime();
  }

  function _applyWatermark(canvas, text) {
    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.font = '12px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(text || WATERMARK_TEXT, canvas.width - 10, canvas.height - 10);
    ctx.restore();
    return canvas;
  }

  function _hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return { r: r, g: g, b: b };
  }

  function _clamp(val, min, max) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
  }

  MemeUtils.init = function(options) {
    if (_initialized) {
      console.warn('[MemeUtils] Already initialized, skipping.');
      return;
    }
    options = options || {};
    if (options.watermark) {
      WATERMARK_TEXT = options.watermark;
    }
    if (typeof $ !== 'undefined') {
      $(document).ready(function() {
        console.log('[MemeUtils] jQuery detected, binding legacy handlers');
        $('.meme-upload-legacy').on('change', function(e) {
          var file = e.target.files[0];
          if (file) {
            MemeUtils.loadImage(file, function(err, img) {
              if (err) {
                alert('Failed to load image: ' + err.message);
                return;
              }
              $(e.target).closest('.meme-container').find('img.preview').attr('src', img.src);
            });
          }
        });
      });
    }
    _initialized = true;
  };

  MemeUtils.loadImage = function(source, callback) {
    var id = _generateId();

    if (_cache[id]) {
      callback(null, _cache[id]);
      return;
    }

    var img = new Image();
    var retries = 0;

    function attemptLoad() {
      img.onload = function() {
        _cache[id] = img;
        if (typeof callback === 'function') {
          callback(null, img);
        }
      };
      img.onerror = function() {
        retries++;
        if (retries < MAX_RETRIES) {
          console.warn('[MemeUtils] Load failed, retry ' + retries + '/' + MAX_RETRIES);
          setTimeout(attemptLoad, RETRY_DELAY);
        } else {
          callback(new Error('Failed to load image after ' + MAX_RETRIES + ' attempts'), null);
        }
      };

      if (source instanceof Blob || source instanceof File) {
        var reader = new FileReader();
        reader.onload = function(e) {
          img.src = e.target.result;
        };
        reader.onerror = function() {
          callback(new Error('FileReader failed'), null);
        };
        reader.readAsDataURL(source);
      } else if (typeof source === 'string') {
        img.crossOrigin = 'anonymous';
        img.src = source;
      } else {
        callback(new Error('Unsupported source type'), null);
      }
    }

    attemptLoad();
  };

  MemeUtils.applyGrayscale = function(canvas) {
    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      var avg = (data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114);
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  MemeUtils.adjustBrightness = function(canvas, amount) {
    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    amount = amount || 0;
    for (var i = 0; i < data.length; i += 4) {
      data[i] = _clamp(data[i] + amount, 0, 255);
      data[i + 1] = _clamp(data[i + 1] + amount, 0, 255);
      data[i + 2] = _clamp(data[i + 2] + amount, 0, 255);
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  MemeUtils.tintImage = function(canvas, hexColor, intensity) {
    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var rgb = _hexToRgb(hexColor || '#ff0000');
    intensity = intensity || 0.5;

    for (var i = 0; i < data.length; i += 4) {
      data[i] = _clamp(data[i] * (1 - intensity) + rgb.r * intensity, 0, 255);
      data[i + 1] = _clamp(data[i + 1] * (1 - intensity) + rgb.g * intensity, 0, 255);
      data[i + 2] = _clamp(data[i + 2] * (1 - intensity) + rgb.b * intensity, 0, 255);
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  MemeUtils.addTextWithStroke = function(canvas, text, x, y, options) {
    options = options || {};
    var ctx = canvas.getContext('2d');
    var fontSize = options.fontSize || 48;
    var fontFamily = options.fontFamily || 'Impact, sans-serif';
    var fillColor = options.fillColor || '#ffffff';
    var strokeColor = options.strokeColor || '#000000';
    var strokeWidth = options.strokeWidth || 3;

    ctx.font = fontSize + 'px ' + fontFamily;
    ctx.textAlign = options.textAlign || 'center';
    ctx.textBaseline = options.textBaseline || 'top';
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);

    return canvas;
  };

  MemeUtils.exportAsDataURL = function(canvas, format, quality) {
    _applyWatermark(canvas);
    format = format || 'image/png';
    quality = quality || 0.92;
    return canvas.toDataURL(format, quality);
  };

  MemeUtils.clearCache = function() {
    var count = Object.keys(_cache).length;
    _cache = {};
    console.log('[MemeUtils] Cache cleared (' + count + ' entries removed)');
  };

  MemeUtils.getCacheSize = function() {
    return Object.keys(_cache).length;
  };

  global.MemeUtils = MemeUtils;

})(window, window.jQuery);
