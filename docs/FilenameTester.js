"use client";

import React, { useState } from 'react';

function getRAFTVolumeInfoFromFilename(filename) {
  const pattern = /([a-zA-Z0-9_\.\/\-]+)[a-zA-Z_\.\/\-0-9]*[_|\-]([0-9]+)x([0-9]+)x([0-9]+)[a-zA-Z_\.\/\-0-9]*[_|\-]([0-9]+)[b|bits|bit]|\.(b|raw)/;
  const numpyPattern = /([a-zA-Z0-9_\.\/\-]+)[a-zA-Z_\.\/\-0-9]*[_|\-]([0-9]+)x([0-9]+)x([0-9]+)[a-zA-Z_\.\/\-0-9]*[_|\-](int8|uint8|int16|uint16|int32|uint32|float32|complex64)|\.(b|raw)/;

  let xsize = null, ysize = null, zsize = null, dtype = null;

  // First match the pattern with bit size, such as 32bits
  let match = filename.match(pattern);
  if (match !== null) {
    try {
      zsize = parseInt(match[4]);
      ysize = parseInt(match[3]);
      xsize = parseInt(match[2]);

      // Convert bits to dtype
      const bits = parseInt(match[5]);
      if (bits === 8) dtype = 'uint8';
      else if (bits === 16) dtype = 'uint16';
      else if (bits === 32) dtype = 'float32';
      else if (bits === 64) dtype = 'complex64';
    } catch (e) {}
  }

  // If xsize, ysize, zsize, or dtype is still null, use numpy-like pattern
  if (xsize === null || ysize === null || zsize === null || dtype === null) {
    match = filename.match(numpyPattern);
    if (match !== null) {
      try {
        zsize = parseInt(match[4]);
        ysize = parseInt(match[3]);
        xsize = parseInt(match[2]);
        dtype = match[5]; // directly matches int8, float32, etc.
      } catch (e) {}
    }
  }

  return { xsize, ysize, zsize, dtype };
}

export default function FilenameTester() {
  const [filename, setFilename] = useState('');
  const [result, setResult] = useState({ xsize: null, ysize: null, zsize: null, dtype: null });

  const handleTest = () => {
    const info = getRAFTVolumeInfoFromFilename(filename);
    setResult(info);
  };

  return (
    <div>
      <h3>Test Raw Parsing</h3>
      <input
        type="text"
        value={filename}
        onChange={(e) => setFilename(e.target.value)}
        placeholder="Enter filename"
        style={{ padding: '8px', fontSize: '16px', width: '300px', marginBottom: '10px', backgroundColor: '#cedaed' }}
      />
      <br />
      <button
        onClick={handleTest}
        style={{
          padding: '10px 10px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#45a049')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#4CAF50')}
      >
        Test
      </button>
      <p>
        X size: {result.xsize}, Y size: {result.ysize}, Z size: {result.zsize}, data type: {result.dtype}
      </p>
    </div>
  );
}
