import npyjs from "npyjs";
import pako from "pako"; 

function sxhr(method, url, callback, data = '', responseType = '') {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200)
            callback(xhr.response);
    }
    xhr.open(method, url, true);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.responseType = responseType;
    xhr.send(data);
}

async function responseToArrayBuffer(response) {
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return arrayBuffer;
}

async function responseToUint8Array(response) {
    const gzippedArrayBuffer = await responseToArrayBuffer(response);
    const bytes = pako.ungzip(gzippedArrayBuffer);
    return new Uint8Array(bytes.buffer);
}

async function responseToFloat64Array(response) {
    const gzippedArrayBuffer = await responseToArrayBuffer(response);
    const bytes = pako.ungzip(gzippedArrayBuffer);
    return new Float64Array(bytes.buffer);
}

async function decompressGzip(response) {
    const gzippedArrayBuffer = await responseToArrayBuffer(response);
    const bytes = pako.ungzip(gzippedArrayBuffer);
    return bytes.buffer;
}

async function bufferToNdArray(buffer) {
    const n = new npyjs();
    const data = await n.parse(buffer);
    //console.log(data);
    return data;
}

async function responseToNdArray(response) {
    const buffer = await decompressGzip(response);
    return bufferToNdArray(buffer);
}

/**
 * Utility function to make simpler promise based HTTP requests.
 *
 * @param {string} method: HTTP method to perform (GET, POST, PUT, DELETE)
 * @param {string} url: The endpoint to perform the request
 * @param {string} data: Stringfied version of the data to be sent in the body of the method
 * @param {string} responseType: The response Type to be processed
 *
 * @return {Promise(responseType)}: The processed response
 */
function sfetch(method, url, data = '', responseType = '') {

    return fetch(url, {
        method: method,
        headers: {
            //'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: data
    }).then(function(response) {
        console.log('process this sheeeit');
        console.log("ResponseType is ", responseType);
        switch (responseType) {
            case 'lz4/ndarray':
                return responseToNdArray(response);
            case 'gzip/numpyndarray':
                return responseToNdArray(response);
            case 'gzip/uint8array':
                return responseToUint8Array(response);
            case 'gzip/float64array':
                return responseToFloat64Array(response);
            case 'arraybuffer':
                return responseToArrayBuffer(response);
            case 'json':
                return response.json();
            case 'text':
                return response.text();
            default:
                return response;
        }
    });
}

export {sxhr, sfetch};
