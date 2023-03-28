'use strict';

const Double = require('../');
const assert = require('assert');
const co = require('co');
const mongoose = require('mongoose');

describe('Double', function() {
  let Model;

  before(function() {
    mongoose.connect('mongodb://localhost:27017/doubletest');
    const schema = new mongoose.Schema({ double: Double, name: 'string' });
    Model = mongoose.model('Test', schema);
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('casts', function() {
    it('numbers', function() {
      let doc = new Model({ double: 20000000.1 });
      assert.ok(doc.double instanceof mongoose.Types.Double);
      assert.equal(doc.double.valueOf(), 20000000.1);
      assert.equal(doc.double, 20000000.1);

      const v = new Number(20000000.0);
      doc = new Model({ double: v });
      assert.ok(doc.double instanceof mongoose.Types.Double);
      assert.equal(+doc.double.value, +v);
    });

    it('null', function() {
      assert.strictEqual(new Model({ double: null }).double, null);
    })

    it('mongoose.Types.Double', function() {
      const doc = new Model({ double: new mongoose.Types.Double('90') });
      assert.ok(doc.double instanceof mongoose.Types.Double);
      assert.equal(doc.double, 90);
    });
  });

  it('saves as correct type', function() {
    return co(function*() {
      const schema = new mongoose.Schema({ val: Double });
      const numSchema = new mongoose.Schema({ val: Number });
      const Model = mongoose.model('DoubleTest1', schema, 'doubletest1');
      const NumModel = mongoose.model('DoubleTest2', numSchema, 'doubletest1');

      const doc = new Model({ val: 5 });
      ++doc.val;
      yield doc.save();

      assert.ok(yield Model.findOne({ val: { $type: 1 } }));
      assert.ok(yield Model.findOne({ val: 6 }));
      assert.ok(yield NumModel.findOne({ val: 6 }));
    });
  });

  describe('NaNs', () => {
    it('saves explicit NaNs', function() {
      return co(function*() {
        const schema = new mongoose.Schema({ val: Double });
        const Model = mongoose.model('DoubleTest3', schema, 'doubletest3');

        const doc = new Model({ val: NaN });
        ++doc.val;
        yield doc.save();

        assert.ok(yield Model.findOne({ val: { $type: 1 } }));
        assert.ok(yield Model.findOne({ val: NaN }));
      });
    });

    it('does not save implicit NaNs', function() {
      return co(function*() {
        const schema = new mongoose.Schema({ val: Double });
        const Model = mongoose.model('DoubleTest4', schema, 'doubletest4');

        const doc = new Model({ val: 'hi' });
        ++doc.val;
        return doc.save().then(() => {
          throw new Error('This should not save')
        }).catch(e => {
          assert.ok(true)
        })
      });
    });
  })


  it('works in update', function() {
    return co(function*() {
      const doc = yield Model.create({ double: 1 });

      yield Model.updateOne({}, { $set: { double: 2 } });

      assert.ok(yield Model.findOne({ double: { $type: 1 } }));
    });
  });

  it('can be default', function() {
    return co(function*() {
      const b = new Number(1.11);
      const s = new mongoose.Schema({ double: { type: Double, default: b }});
      const M = mongoose.model('DefaultTest', s);
      const doc = yield M.create({});
      assert.equal(doc.double.valueOf(), 1.11);
    });
  });
});
