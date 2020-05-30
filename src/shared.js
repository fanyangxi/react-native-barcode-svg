function merge(old, replaceObj) {
  return ({ ...old, ...replaceObj });
}

// Encodings can be nestled like [[1-1, 1-2], 2, [3-1, 3-2]
// Convert to [1-1, 1-2, 2, 3-1, 3-2]
function linearizeEncodings(encodings) {
  const linearEncodings = [];
  function nextLevel(encoded) {
    if (Array.isArray(encoded)) {
      for (let i = 0; i < encoded.length; i++) {
        nextLevel(encoded[i]);
      }
    } else {
      // eslint-disable-next-line no-param-reassign
      encoded.text = encoded.text || '';
      // eslint-disable-next-line no-param-reassign
      encoded.data = encoded.data || '';
      linearEncodings.push(encoded);
    }
  }
  nextLevel(encodings);

  return linearEncodings;
}


function getEncodingHeight(encoding, options) {
  return options.height
    + ((options.displayValue && encoding.text.length > 0) ? options.fontSize + options.textMargin : 0)
    + options.marginTop
    + options.marginBottom;
}

function getBarcodePadding(textWidth, barcodeWidth, options) {
  if (options.displayValue && barcodeWidth < textWidth) {
    if (options.textAlign === 'center') {
      return Math.floor((textWidth - barcodeWidth) / 2);
    }
    if (options.textAlign === 'left') {
      return 0;
    }
    if (options.textAlign === 'right') {
      return Math.floor(textWidth - barcodeWidth);
    }
  }
  return 0;
}

function messureText(string, options, context) {
  let ctx;

  if (context) {
    ctx = context;
  } else if (typeof document !== 'undefined') {
    ctx = document.createElement('canvas').getContext('2d');
  } else {
    // If the text cannot be messured we will return 0.
    // This will make some barcode with big text render incorrectly
    return 0;
  }
  ctx.font = `${options.fontOptions} ${options.fontSize}px ${options.font}`;

  // Calculate the width of the encoding
  const size = ctx.measureText(string).width;
  return size;
}

function calculateEncodingAttributes(encodings, barcodeOptions, context) {
  for (let i = 0; i < encodings.length; i++) {
    const encoding = encodings[i];
    const options = merge(barcodeOptions, encoding.options);

    // Calculate the width of the encoding
    let textWidth;
    if (options.displayValue) {
      textWidth = messureText(encoding.text, options, context);
    } else {
      textWidth = 0;
    }

    const barcodeWidth = encoding.data.length * options.width;
    encoding.width = Math.ceil(Math.max(textWidth, barcodeWidth));

    encoding.height = getEncodingHeight(encoding, options);

    encoding.barcodePadding = getBarcodePadding(textWidth, barcodeWidth, options);
  }
}

function getTotalWidthOfEncodings(encodings) {
  let totalWidth = 0;
  for (let i = 0; i < encodings.length; i++) {
    totalWidth += encodings[i].width;
  }
  return totalWidth;
}

function getMaximumHeightOfEncodings(encodings) {
  let maxHeight = 0;
  for (let i = 0; i < encodings.length; i++) {
    if (encodings[i].height > maxHeight) {
      maxHeight = encodings[i].height;
    }
  }
  return maxHeight;
}

export {
  merge,
  linearizeEncodings,
  getMaximumHeightOfEncodings,
  getEncodingHeight,
  getBarcodePadding,
  calculateEncodingAttributes,
  getTotalWidthOfEncodings,
};
