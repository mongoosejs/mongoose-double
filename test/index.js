var assert = require('assert')
var DoubleModule = require('../')
var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var Double;

describe('Double', function(){
  before(function(){
    Double = DoubleModule(mongoose);
  })

  it('is a function', function(){
    assert.equal('function', typeof Double);
  })

  it('extends mongoose.Schema.Types', function(){
    assert.ok(Schema.Types.Double);
    assert.equal(Double, Schema.Types.Double);
  })

  it('extends mongoose.Types', function(){
    assert.ok(mongoose.Types.Double);
    assert.equal(mongoose.mongo.Double, mongoose.Types.Double);
  })

  it('can be used in schemas', function(){
    var s = new Schema({ double: Double });
    var double = s.path('double')
    assert.ok(double instanceof mongoose.SchemaType);
    assert.equal('function', typeof double.get);

    var s = new Schema({ double: 'double' });
    var double = s.path('double')
    assert.ok(double instanceof mongoose.SchemaType);
    assert.equal('function', typeof double.get);
  })

  describe('integration', function(){
    var db, S, schema, id;

    before(function(done){
      db = mongoose.createConnection('localhost', 'mongoose_double')
      db.once('open', function () {
        schema = new Schema({ double: Double, name: 'string' });
        S = db.model('Double', schema);
        done();
      });
    })

    describe('casts', function(){
      it('numbers', function(){
        var v = 20000000.1;
        var s = new S({ double: v });
        assert.ok(s.double instanceof mongoose.Types.Double);
        assert.equal(v, s.double.valueOf());
        assert.equal(v, s.double);

        v = new Number(20000000.0);
        s = new S({ double: v });
        assert.ok(s.double instanceof mongoose.Types.Double);
        assert.equal(+v, +s.double.value);
      })

      it('strings', function(){
        var v = '2000000.00';
        var s = new S({ double: v});
        assert.ok(s.double instanceof mongoose.Types.Double);
        assert.equal(v, s.double.valueOf().toString());
      })

      it('null', function(){
        var s = new S({ double: null });
        assert.equal(null, s.double);
      })

      it('mongo.Double', function(){
        var s = new S({ double: new mongoose.Types.Double("90") });
        assert.ok(s.double instanceof mongoose.Types.Double);
        assert.equal(90, s.double);
      })

      it('non-castables produce _saveErrors', function(done){
        var schema = new Schema({ double: Double }, { strict: 'throw' });
        var M = db.model('throws', schema);
        var m = new M({ double: [] });
        m.save(function (err) {
          assert.ok(err);
          assert.equal('Double', err.type);
          assert.equal('CastError', err.name);
          done();
        });
      })

      it('casts within subdocs', function(done){
        var v = '2000000.00';
        var nested = new Schema({ double: Double });
        var schema = new Schema({ docs: [nested] });
        var M = db.model('subdocs', schema);
        var m = new M({ docs: [{ double: v }] });
        assert.ok(m.docs[0].double instanceof mongoose.Types.Double);
        m.save(function (err) {
          assert.ifError(err);
          done();
        });
      })
    })

    it('can be saved', function(done){
      var s = new S({ double: 20 });
      id = s.id;
      s.save(function (err) {
        assert.ifError(err);
        done();
      })
    })

    it('is queryable', function(done){
      S.findById(id, function (err, doc) {
        assert.ifError(err);
        assert.ok(doc.double instanceof mongoose.Types.Double);
        assert.equal(20, +doc.double);
        done();
      });
    })

    it('can be updated', function(done){
      S.findById(id, function (err, doc) {
        assert.ifError(err);
        doc.double += 10;
        //doc.double.value += 10;
        doc.save(function (err) {
          assert.ifError(err);
          S.findById(id, function (err, doc) {
            assert.ifError(err);
            assert.equal(30, doc.double.valueOf());
            done();
          });
        })
      })
    })

    it('can be default', function(done){
      var a = new Number(2.22);
      var b = new Number(1.11);
      var c = a + b;
      var s = new Schema({ double: { type: Double, default: b }});
      var M = db.model('default', s);
      var m = new M;
      m.save(function (err) {
        assert.equal(c.valueOf(), m.double.valueOf() + a);
        done();
      })
    })

    it('can be required', function(done){
      var s = new Schema({ double: { type: Double, required: true }});
      var M = db.model('required', s);
      var m = new M;
      m.save(function (err) {
        assert.ok(err);
        m.double = 10;
        m.validate(function (err) {
          assert.ifError(err);
          done();
        })
      })
    })

    it('works with update', function(done){
      S.create({ double: 99999 }, function (err, s) {
        assert.ifError(err);
        S.update({ double: s.double, _id: s._id }, { name: 'changed' }, { upsert: true }, function (err) {
          assert.ifError(err);

          S.findById(s._id, function (err, doc) {
            assert.ifError(err);
            assert.equal(99999, doc.double.value);
            assert.equal('changed', doc.name);
            done();
          })
        });
      });

    })
  })
})
