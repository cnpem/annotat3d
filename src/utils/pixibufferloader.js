import * as PIXI from 'pixi.js';

PIXI.BufferResource.prototype.upload = function (renderer, baseTexture, glTexture) {
  var gl = renderer.gl;

  //gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, baseTexture.alphaMode === exports.ALPHA_MODES.UNPACK);
  // https://stackoverflow.com/questions/42789896/webgl-error-arraybuffer-not-big-enough-for-request-in-case-of-gl-luminance
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  var width = baseTexture.realWidth;
  var height = baseTexture.realHeight;
  if (glTexture.width === width && glTexture.height === height) {
      gl.texSubImage2D(baseTexture.target, 0, 0, 0, width, height, baseTexture.format, glTexture.type, this.data);
  }
  else {
      glTexture.width = width;
      glTexture.height = height;
      gl.texImage2D(baseTexture.target, 0, glTexture.internalFormat, width, height, 0, baseTexture.format, glTexture.type, this.data);
  }
  return true;
};
