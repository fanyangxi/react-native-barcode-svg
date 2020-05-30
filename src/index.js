import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved
import React, { useState, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { View, Text } from 'react-native';
// eslint-disable-next-line import/no-unresolved
import Svg, { Path } from 'react-native-svg';
import barcodes from 'jsbarcode/src/barcodes';
import {
  getBarcodePadding, getEncodingHeight, linearizeEncodings, merge,
} from './shared';

// This encode() handles the Encoder call and builds the binary string to be rendered
const encode = (text, Encoder, options) => {
  // If text is not a non-empty string, throw error.
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('Barcode value must be a non-empty string');
  }

  let encoder;
  try {
    encoder = new Encoder(text, options);
  } catch (error) {
    // If the encoder could not be instantiated, throw error.
    throw new Error('Invalid barcode format.');
  }

  // If the input is not valid for the encoder, throw error.
  if (!encoder.valid()) {
    throw new Error('Invalid barcode for selected format.');
  }

  // Make a request for the binary data (and other information) that should be rendered
  // encoded structure is {
  //  text: 'xxxxx',
  //  data: '110100100001....'
  // }
  const encoded = encoder.encode();

  // Encodings can be nestled like [[1-1, 1-2], 2, [3-1, 3-2]
  // Convert to [1-1, 1-2, 2, 3-1, 3-2]
  const linearEncodings = linearizeEncodings(encoded);

  // Merge
  for (let i = 0; i < linearEncodings.length; i++) {
    linearEncodings[i].options = merge(options, linearEncodings[i].options);
  }

  // eslint-disable-next-line no-console
  console.log(linearEncodings);
  return linearEncodings;
};

const getBarEncodings = (encodings) => {
  for (let i = 0; i < linearEncodings.length; i++) {
    const barEncoding = linearEncodings[i];

    // // Calculate the width of the encoding
    // let textWidth;
    // if (options.displayValue) {
    //   textWidth = messureText(encoding.text, options, context);
    // } else {
    //   textWidth = 0;
    // }
    const barcodeWidth = barEncoding.data.length * barEncoding.options.singleBarWidth;
    // barEncoding.width = Math.ceil(barcodeWidth);// Math.ceil(Math.max(textWidth, barcodeWidth));
    // barEncoding.height = getEncodingHeight(barEncoding, options);
    barEncoding.offsetX = getBarcodePadding(barcodeWidth, options);
    // barEncoding.barcodePadding = getBarcodePadding(barcodeWidth, options);
  }
};

const getTotalWidthOfEncodings = (encodings) => Array.from(encodings)
  .map((encoding, index) => encoding.data.length)
  .reduce((sum, x) => sum + x) // sum(item.length)
;

// ===========
const drawRect = (x, y, rectWidth, height) => `M${x},${y}h${rectWidth}v${height}h-${rectWidth}z`;

const drawSvgBar = (encoding, paddingLeft = 0, options = {}) => {
  const rects = [];
  // binary data of barcode
  const binary = encoding.data;

  let barWidth = 0;
  let x = 0;
  const yFrom = 0;

  for (let b = 0; b < binary.length; b++) {
    x = b * options.singleBarWidth + paddingLeft;
    if (binary[b] === '1') {
      // eslint-disable-next-line no-plusplus
      barWidth++;
    } else if (barWidth > 0) {
      rects[rects.length] = drawRect(
        x - options.singleBarWidth * barWidth,
        yFrom,
        options.singleBarWidth * barWidth,
        options.height,
      );
      barWidth = 0;
    }
  }

  // Last draw is needed since the barcode ends with 1
  if (barWidth > 0) {
    rects[rects.length] = drawRect(
      x - options.singleBarWidth * (barWidth - 1),
      yFrom,
      options.singleBarWidth * barWidth,
      options.height,
    );
  }

  return rects;
};

const drawSvgBars = (encodings, options = {}) => {
  const results = [];
  let barPaddingLeft = 0;

  Array.from(encodings).forEach((encoding, index) => {
    const bar = drawSvgBar(encoding, barPaddingLeft, options);
    results.push(bar);
    barPaddingLeft += encoding.data.length * 2;

    console.log(`>> each:${index} -> ${encoding.data.length}`);
  });
  return results.flat();
};

export default function Barcode(props) {
  const {
    value,
    format,
    singleBarWidth,
    maxWidth,
    height,
    lineColor,
    backgroundColor,
    onError,
    displayValue,
    textAlign,
    textPosition,
    textMargin,
    fontSize,
  } = props;
  const [bars, setBars] = useState([]);
  const [barcodeWidth, setBarCodeWidth] = useState(0);
  const [barcodeContainerWidth, setBarcodeContainerWidth] = useState(0);
  const [barcodeError, setBarcodeError] = useState('');

  const jsBarcodeEncoderOptions = {
    width: singleBarWidth,
    height,
    format,
    displayValue,
    fontOptions: undefined,
    font: undefined,
    text: undefined,
    textAlign,
    textPosition,
    textMargin,
    fontSize,
    background: backgroundColor,
    lineColor,
    margin: undefined,
    marginTop: undefined,
    marginBottom: undefined,
    marginLeft: undefined,
    marginRight: undefined,
    valid: () => {},
  };

  useEffect(() => {
    try {
      const encoder = barcodes[format];
      const linearEncodings = encode(value, encoder, props);

      const barcodeTotalWidth = getTotalWidthOfEncodings(linearEncodings) * singleBarWidth;
      const theBars = drawSvgBars(linearEncodings, props);
      console.log(theBars);
      console.log(`>> barcodeTotalWidth:${barcodeTotalWidth}`);

      if (linearEncodings.length > 0) {
        setBars(theBars);
        setBarCodeWidth(barcodeTotalWidth);
        setBarcodeContainerWidth((maxWidth && barcodeTotalWidth > maxWidth) ? maxWidth : barcodeTotalWidth);
      }
    } catch (e) {
      setBarcodeError(e.message);
      setBarcodeContainerWidth(300);
    }
  }, [value, format, singleBarWidth, maxWidth, height, lineColor]);

  const containerStyle = { width: barcodeContainerWidth, height, backgroundColor: 'lightgreen' };
  return (
    // eslint-disable-next-line react/jsx-filename-extension
    <View style={containerStyle}>
      {barcodeError
        ? <Text>{`${barcodeError}`}</Text>
        : (
          <Svg
            width="100%"
            height="100%"
            fill={lineColor}
            viewBox={`0 0 ${barcodeWidth} ${height}`}
            preserveAspectRatio="none"
          >
            <Path d={bars.join(' ')} />
          </Svg>
        )}
    </View>
  );
}

Barcode.propTypes = {
  value: PropTypes.string,
  // Options:
  format: PropTypes.oneOf(Object.keys(barcodes)),
  singleBarWidth: PropTypes.number, // width
  maxWidth: PropTypes.number,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  displayValue: PropTypes.bool,
  // text	undefined	String
  // fontOptions
  // font
  textAlign: PropTypes.string,
  textPosition: PropTypes.string,
  textMargin: PropTypes.number,
  fontSize: PropTypes.number,
  backgroundColor: PropTypes.string, // background
  lineColor: PropTypes.string,
  onError: PropTypes.func,
};

Barcode.defaultProps = {
  value: '',
  // Options:
  format: 'CODE128',
  singleBarWidth: 2, // width
  maxWidth: undefined,
  height: 100,
  displayValue: true,
  textAlign: 'center',
  textPosition: 'bottom',
  textMargin: 2,
  fontSize: 20,
  backgroundColor: '#FFFFFF',
  lineColor: '#000000',
  onError: undefined,
};
