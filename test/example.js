'use strict';

const Double = require('../');
const assert = require('assert');
const mongoose = require('mongoose');

if (process.env.D) {
  mongoose.set('debug', true);
}

describe('Examples', function() {
  before(function() {
    mongoose.connect('mongodb://localhost:27017/doubletest', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  after(function() {
    return mongoose.disconnect();
  });

  beforeEach(() => mongoose.connection.dropDatabase());

  it('ensures your numbers are always stored as doubles in MongoDB', function() {
    const schema = new mongoose.Schema({ val: Double });
    const Model = mongoose.model('Double', schema);

    const doc = new Model({ val: 41 });

    // `doc.val` will be an object, not a number, but you can still use it as
    // a number
    assert.ok(doc.val instanceof mongoose.Types.Double);
    assert.ok(doc.val instanceof Number);
    assert.equal(typeof doc.val, 'object');

    ++doc.val;

    return doc.save().
      then(function() {
        return Model.findOne({ val: { $type: 'double' } });
      }).
      then(function(doc) {
        assert.ok(doc);
        assert.equal(doc.val, 42);
      }).
      then(function() {
        return Model.findOne({ val: { $type: 'int' } });
      }).
      then(function(doc) {
        assert.ok(!doc);
      });
  });

  /**
   * This plugin is useful because the [MongoDB Node.js driver](https://www.npmjs.com/package/mongodb)
   * will store the JavaScript number `5.01` as a double, but it will store `5`
   * as an integer. There is currently no option to opt out of this behavior
   * in the MongoDB driver.
   */
  it('bypasses the MongoDB driver\'s integer coercion', function() {
    const schema = new mongoose.Schema({ val: Number });
    const Model = mongoose.model('Number', schema);

    return Model.create([{ val: 5.01 }, { val: 5 }]).
      then(function() {
        return Model.findOne({ val: { $type: 'double' } });
      }).
      then(function(doc) {
        assert.ok(doc);
        assert.equal(doc.val, 5.01);
      }).
      then(function() {
        return Model.findOne({ val: { $type: 'int' } });
      }).
      then(function(doc) {
        assert.ok(doc);
        assert.equal(doc.val, 5);
      });
  });
});
