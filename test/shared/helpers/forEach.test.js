var Handlebars = require('handlebars').create(),
    Collection = require('backbone').Collection,
    Model = require('backbone').Model,
    memo = require('memo-is'),
    sinon = require('sinon'),
    chai = require('chai'),
    expect = chai.expect,
    subject = require('../../../shared/helpers/forEach');

describe('forEach', function () {
  var data, spy, scope;
  var opts = memo().is(function () {
    return {
      fn: function () {},
      inverse: function () {},
      hash: {}
    }
  });

  var isCollection = memo().is(function() {
    return function () {
      return false;
    }
  });

  var app = memo().is(function() {
    return { modelUtils: { isCollection: isCollection() } };
  });

  beforeEach(function () {
    spy = sinon.spy(opts(), 'fn');
    scope = { app: app() };
  })

  context('is an object', function () {
    beforeEach(function () {
      data = { 'a': 'b', 'c': 'd' };
    });

    it('calls opts.fn with a key / value item', function () {
      scope = { app: app() };

      subject.call(scope, data, opts());
      expect(spy).to.have.been.calledTwice;

      var thisCall = spy.getCall(0),
          args = thisCall.args[0];

      expect(args.key).to.equal('a');
      expect(args.value).to.equal('b');
    })

    it('will have the private properties attached', function () {
      scope = {
        app: app(),
        view: { 'test': 'view' },
        model: { 'test': 'model' },
        collection: { 'test': 'collection' }
      };

      subject.call(scope, data, opts());
      expect(spy).to.have.been.calledTwice;

      var thisCall = spy.getCall(0),
          args = thisCall.args[0];

      expect(args._app).to.deep.equal(scope.app);
      expect(args._view).to.deep.equal(scope.view);
      expect(args._model).to.deep.equal(scope.model);
      expect(args._collection).to.deep.equal(scope.collection);
    })

    it('will have the private properties attached if it is nested in another helper', function () {
      scope = {
        _app: app(),
        _view: { 'test': 'view' },
        _model: { 'test': 'model' },
        _collection: { 'test': 'collection' }
      };

      subject.call(scope, data, opts());
      expect(spy).to.have.been.calledTwice;

      var thisCall = spy.getCall(0),
          args = thisCall.args[0];

      expect(args._app).to.deep.equal(scope._app);
      expect(args._view).to.deep.equal(scope._view);
      expect(args._model).to.deep.equal(scope._model);
      expect(args._collection).to.deep.equal(scope._collection);
    });
  });

  context('is an array', function () {
    beforeEach(function () {
      data = ['a', 'b', 'c'];
    });

    it('calls opts.fn correctly for the first element', function () {
      subject.call(scope, data, opts());
      expect(spy).to.have.been.calledThrice;

      var thisCall = spy.getCall(0),
          args = thisCall.args[0];

      expect(args).to.deep.property('key', 0);
      expect(args).to.deep.property('value', 'a');
      expect(args).to.deep.property('_isFirst', true);
      expect(args).to.deep.property('_isLast', false);
      expect(args).to.deep.property('_total', 3);
    });

    it('calls opts.fn correctly for the middle element', function () {
      subject.call(scope, data, opts());
      expect(spy).to.have.been.calledThrice;

      var thisCall = spy.getCall(1),
          args = thisCall.args[0];

      expect(args).to.deep.property('key', 1);
      expect(args).to.deep.property('_isFirst', false);
      expect(args).to.deep.property('_isLast', false);
    });

    it('calls opts.fn correctly for the last element', function () {
      subject.call(scope, data, opts());
      expect(spy).to.have.been.calledThrice;

      var thisCall = spy.getCall(2),
          args = thisCall.args[0];

      expect(args).to.deep.property('key', 2);
      expect(args).to.deep.property('_isLast', true);
    });
  });

  context('empty array', function () {
    it('should call teh inverse function', function () {
      var inverseSpy = sinon.spy(opts(), 'inverse');
      subject.call(scope, [], opts());

      expect(inverseSpy).to.have.been.called;
    })
  })

  context('is a collection', function () {
    data = { 'a': 'b', 'c': 'd' };
    var currentCollection;

    var collection = memo().is(function () {
      var retVal = new Collection();
      for (var i = 0; i < 3; i++) {
        data.id = i;
        retVal.add(new Model(data));
      }

      return retVal;
    });
    isCollection.is(function () {
      return function () {
        return true;
      };
    });

    context('default', function () {
      beforeEach(function () {
        currentCollection = collection();
      })

      it('will set the _ array properties', function () {
        subject.call(scope, currentCollection, opts());
        expect(spy).to.have.been.calledThrice;

        var thisCall = spy.getCall(0),
            args = thisCall.args[0];

        expect(args._isFirst).to.equal(true);
        expect(args._isLast).to.equal(false);
        expect(args._total).to.equal(3);
      })

      it('should pass a model as the value', function () {
        subject.call(scope, currentCollection, opts());
        expect(spy).to.have.been.calledThrice;

        var thisCall = spy.getCall(0);
        expect(thisCall.args[0].value).to.deep.equal(currentCollection.first());
      })
    })

    context('is toJSON', function () {
      var jsonOpts;

      beforeEach(function () {
        currentCollection = collection();
        jsonOpts = opts();
        jsonOpts.hash.toJSON = true;
      })

      it('should pass a jsonified version of the model', function () {
        subject.call(scope, currentCollection, jsonOpts);
        expect(spy).to.have.been.calledThrice;

        var thisCall = spy.getCall(0);
        expect(thisCall.args[0].value).to.deep.equal(currentCollection.first().toJSON());
      })
    })
  })
});
