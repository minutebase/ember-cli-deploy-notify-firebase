/* jshint node: true */

'use strict';

var Promise = require('ember-cli/lib/ext/promise');
var assert  = require('ember-cli/tests/helpers/assert');

var stubProject = {
  name: function(){
    return 'my-project';
  }
};

var mockFirebase;

describe('redis plugin', function() {
  var subject, mockUi;

  beforeEach(function() {
    subject = require('../../index');
    mockUi = {
      messages: [],
      write: function() { },
      writeLine: function(message) {
        this.messages.push(message);
      }
    };

    mockFirebase = function() {};
    mockFirebase.prototype.authWithCustomToken = function(_, cb) {
      cb();
    };
    mockFirebase.prototype.child = function(path) {
      return this;
    };
    mockFirebase.prototype.set = function(value, cb) {
      cb();
    };
  });

  it('has a name', function() {
    var result = subject.createDeployPlugin({
      name: 'test-plugin'
    });

    assert.equal(result.name, 'test-plugin');
  });

  it('implements the correct hooks', function() {
    var plugin = subject.createDeployPlugin({
      name: 'test-plugin'
    });
    assert.ok(plugin.didActivate);
  });

  describe('configure hook', function() {
    it('runs without error if config is ok', function() {
      var plugin = subject.createDeployPlugin({
        name: 'notify-firebase'
      });

      var context = {
        ui: mockUi,
        project: stubProject,
        config: {
          "notify-firebase": {
            app: 'some-app',
            token: 'super-secret-token'
          }
        }
      };
      plugin.beforeHook(context);
      plugin.configure(context);
      assert.ok(true); // didn't throw an error
    });


    describe('resolving revisionKey from the pipeline', function() {
      it('uses the config data if it already exists', function() {
        var plugin = subject.createDeployPlugin({
          name: 'notify-firebase'
        });

        var config = {
          app: 'some-app',
          token: 'super-secret-token',
          revisionKey: '12345'
        };
        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "notify-firebase": config
          },
          commandOptions: {},
          revisionData: {
            revisionKey: 'something-else'
          }
        };

        plugin.beforeHook(context);
        plugin.configure(context);
        assert.equal(plugin.readConfig('revisionKey'), '12345');
      });

      it('uses the commandOptions value if it exists', function() {
        var plugin = subject.createDeployPlugin({
          name: 'notify-firebase'
        });

        var config = {
          app: 'some-app',
          token: 'super-secret-token'
        };
        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "notify-firebase": config
          },
          commandOptions: {
            revision: 'abcd'
          },
          revisionData: {
            revisionKey: 'something-else'
          }
        };

        plugin.beforeHook(context);
        plugin.configure(context);
        assert.typeOf(config.revisionKey, 'function');
        assert.equal(config.revisionKey(context), 'abcd');
      });

      it('uses the context value if it exists and commandOptions doesn\'t', function() {
        var plugin = subject.createDeployPlugin({
          name: 'notify-firebase'
        });

        var config = {
          app: 'some-app',
          token: 'super-secret-token'
        };
        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "notify-firebase": config
          },
          commandOptions: { },
          revisionData: {
            revisionKey: 'something-else'
          }
        };

        plugin.beforeHook(context);
        plugin.configure(context);
        assert.typeOf(config.revisionKey, 'function');
        assert.equal(config.revisionKey(context), 'something-else');
      });
    });
    describe('without providing config', function () {
      var config, plugin, context;
      beforeEach(function() {
        config = { };
        plugin = subject.createDeployPlugin({
          name: 'notify-firebase'
        });
        context = {
          ui: mockUi,
          project: stubProject,
          config: config
        };
        plugin.beforeHook(context);
      });
      it('warns about missing optional config', function() {
        plugin.configure(context);
        var messages = mockUi.messages.reduce(function(previous, current) {
          if (/- Missing config:\s.*, using default:\s/.test(current)) {
            previous.push(current);
          }

          return previous;
        }, []);
        assert.equal(messages.length, 4);
      });
      it('adds default config to the config object', function() {
        plugin.configure(context);
        assert.isDefined(config["notify-firebase"].path);
        assert.isDefined(config["notify-firebase"].payload);
        assert.isDefined(config["notify-firebase"].revisionKey);
      });
    });

    describe('didActivate hook', function() {
      it('fails with incorrect Firebase token', function() {
        var plugin = subject.createDeployPlugin({
          name: 'notify-firebase'
        });

        mockFirebase.prototype.authWithCustomToken = function(_, cb) {
          cb(new Error("Failed to authenticate"))
        };

        var config = {
          app: 'some-app',
          token: 'super-secret-token',
          revisionKey: '123abc'
        };
        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "notify-firebase": config,
          },
          _Firebase: mockFirebase,
          commandOptions: { }
        };

        plugin.beforeHook(context);
        plugin.configure(context);

        return assert.isRejected(plugin.didActivate(context));
      });


      it('fails with failing set', function() {
        var plugin = subject.createDeployPlugin({
          name: 'notify-firebase'
        });

        mockFirebase.prototype.set = function(_, cb) {
          cb(new Error("Can't write here"))
        };

        var config = {
          app: 'some-app',
          token: 'super-secret-token',
          revisionKey: '123abc'
        };
        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "notify-firebase": config,
          },
          _Firebase: mockFirebase,
          commandOptions: { }
        };

        plugin.beforeHook(context);
        plugin.configure(context);

        return assert.isRejected(plugin.didActivate(context));
      });

      it('sets the payload in Firebase', function() {
        var plugin = subject.createDeployPlugin({
          name: 'notify-firebase'
        });

        var payloadSet;
        mockFirebase.prototype.set = function(value, cb) {
          payloadSet = value;
          cb()
        };

        var pathSet;
        mockFirebase.prototype.child = function(path) {
          pathSet = path;
          return this;
        };

        var config = {
          app: 'some-app',
          token: 'super-secret-token',
          revisionKey: '123abc',
          path: "some/path",
          payload: {
            foo: "bar"
          }
        };
        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "notify-firebase": config,
          },
          _Firebase: mockFirebase,
          commandOptions: { }
        };

        plugin.beforeHook(context);
        plugin.configure(context);

        return assert.isFulfilled(plugin.didActivate(context))
          .then(function() {
            assert.deepEqual(payloadSet, { foo: "bar"})
            assert.equal(pathSet, "some/path")
          });
      });

    });
  });
});