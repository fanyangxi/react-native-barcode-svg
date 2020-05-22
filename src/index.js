import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import barcodes from 'jsbarcode/src/barcodes';

// encode() handles the Encoder call and builds the binary string to be rendered
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
  return encoded;
};

const drawRect = (x, y, width, height) => {
  return `M${x},${y}h${width}v${height}h-${width}z`;
};

const drawSvgBarCode = encoding => {
  const rects = [];
  // binary data of barcode
  const binary = encoding.data;

  let barWidth = 0;
  let x = 0;
  let yFrom = 0;

  for (let b = 0; b < binary.length; b++) {
    x = b;
    if (binary[b] === '1') {
      barWidth++;
    } else if (barWidth > 0) {
      rects[rects.length] = drawRect(x - barWidth, yFrom, barWidth, 100);
      barWidth = 0;
    }
  }

  // Last draw is needed since the barcode ends with 1
  if (barWidth > 0) {
    rects[rects.length] = drawRect(x - barWidth + 1, yFrom, barWidth, 100);
  }

  return rects;
};

export default function Barcode(props) {
  const { value, format, width, height, lineColor, backgroundColor, onError } = props;
  const [ bars, setBars ] = useState([]);
  const [ barCodeWidth, setBarCodeWidth ] = useState(0);

  useEffect(() => {
    try {
      const encoder = barcodes[format];
      const encoded = encode(value, encoder, props);
  
      if (encoded) {
        setBars(drawSvgBarCode(encoded));
        setBarCodeWidth(encoded.data.length * width);
      }
    } catch (error) {
      if (onError && typeof onError === 'function') {
        onError(error);
      } else {
        throw error;
      }
    }
  }, [ value, format, lineColor ]);

  const containerStyle = { width: barCodeWidth, height: height, backgroundColor: backgroundColor };
  return (
    <View style={containerStyle}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${barCodeWidth} 100`}
        preserveAspectRatio="xMinYMin slice"
        fill={lineColor}
      >
        <Path d={bars.join(' ')} />
      </Svg>
    </View>
  );
}

Barcode.propTypes = {
  value: PropTypes.string,
  format: PropTypes.oneOf(Object.keys(barcodes)),
  width: PropTypes.number,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lineColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  onError: PropTypes.func,
};

Barcode.defaultProps = {
  value: '',
  format: 'CODE128',
  width: 2,
  height: 100,
  lineColor: '#000000',
  backgroundColor: '#FFFFFF',
  onError: undefined,
};
