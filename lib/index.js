'use strict';

const mongoose = require('mongoose');

class DoubleType extends Number {
  constructor(v) {
    super(v);
    this.value = v;
    this._bsontype = 'Double';
  }

  // Hack to prevent mongoose from converting this into a primitive when cloning
  valueOf() {
    return this;
  }
}

class Double extends mongoose.SchemaType {
  constructor(key, options) {
    super(key, options, 'Double');
  }

  cast(val) {
    if (val == null) {
      return val;
    }
    if (val._bsontype === 'Double') {
      return new DoubleType(val.value);
    }

    // MongoDB allows storing NaNs in Number type attributes
    // So testing for type number is truer to MongoDB behavior than testing for NaNs
    const _val = Number(val);
    if (isNaN(_val) && typeof val !== 'number') {
      throw new mongoose.SchemaType.CastError('Double',
        val + ' is not a valid double');
    }
    return new DoubleType(_val);
  }
}

mongoose.Schema.Types.Double = Double;
mongoose.Types.Double = DoubleType;

module.exports = Double;
