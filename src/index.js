import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import barcodes from 'jsbarcode/src/barcodes';
import { linearizeEncodings, merge } from './shared';

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
  //  text: 'sample-text',
  //  data: '110100100001....',
  //  options: {...}
  // }
  const encoded = encoder.encode();

  // Encodings can be nestled like [[1-1, 1-2], 2, [3-1, 3-2]
  // Convert to [1-1, 1-2, 2, 3-1, 3-2]
  const linearEncodings = linearizeEncodings(encoded);

  // Merge
  for (let i = 0; i < linearEncodings.length; i++) {
    // linearEncodings[i].key = `bar-group-encoding-${i}`;
    linearEncodings[i].options = merge(options, linearEncodings[i].options);
  }

  return linearEncodings;
};

const getTotalWidthOfEncodings = (encodings) => Array.from(encodings)
  .map((encoding) => encoding.data.length)
  .reduce((sum, x) => sum + x); // sum(item.length)

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

  Array.from(encodings).forEach((encoding) => {
    const bar = drawSvgBar(encoding, barPaddingLeft, options);
    results.push(bar);
    barPaddingLeft += encoding.data.length * 2;
  });
  return results.flat();
};

export default function Barcode(props) {
  const {
    value, format, singleBarWidth, maxWidth, height, lineColor, backgroundColor, onError,
  } = props;
  const [bars, setBars] = useState([]);
  const [barcodeWidth, setBarCodeWidth] = useState(0);
  const [barcodeContainerWidth, setBarcodeContainerWidth] = useState(0);
  const [barcodeError, setBarcodeError] = useState('');

  // const jsBarcodeEncoderOptions = {
  //   width: singleBarWidth,
  //   height,
  //   format,
  //   text: undefined,
  //   background: backgroundColor,
  //   lineColor,
  // };

  useEffect(() => {
    try {
      const encoder = barcodes[format];
      const linearEncodings = encode(value, encoder, props);

      const barcodeTotalWidth = getTotalWidthOfEncodings(linearEncodings) * singleBarWidth;
      const theBars = drawSvgBars(linearEncodings, props);

      if (linearEncodings.length > 0) {
        setBars(theBars);
        setBarCodeWidth(barcodeTotalWidth);
        setBarcodeContainerWidth((maxWidth && barcodeTotalWidth > maxWidth) ? maxWidth : barcodeTotalWidth);
      }
      setBarcodeError('');
    } catch (e) {
      setBarcodeError(e.message);
      setBarcodeContainerWidth(200);
      onError && onError(e);
    }
  }, [value, format, singleBarWidth, maxWidth, height, lineColor]);

  const containerStyle = { width: barcodeContainerWidth, height, backgroundColor };
  return (
    <View style={containerStyle}>
      {barcodeError
        ? <View style={styles.errorMessage}><Text>{`${barcodeError}`}</Text></View>
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
  format: PropTypes.oneOf(Object.keys(barcodes)),
  singleBarWidth: PropTypes.number, // width
  maxWidth: PropTypes.number,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lineColor: PropTypes.string,
  backgroundColor: PropTypes.string, // background
  onError: PropTypes.func,
};

Barcode.defaultProps = {
  value: '',
  format: 'CODE128',
  singleBarWidth: 2, // width
  maxWidth: undefined,
  height: 100,
  lineColor: '#000000',
  backgroundColor: '#FFFFFF',
  onError: undefined,
};

const styles = StyleSheet.create({
  errorMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
});
