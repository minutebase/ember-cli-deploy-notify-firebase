var Promise          = require('ember-cli/lib/ext/promise');
var Firebase         = require("firebase");
var DeployPluginBase = require('ember-cli-deploy-plugin');

module.exports = {
  name: 'ember-cli-deploy-notify-firebase',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      defaultConfig: {
        path: 'release',
        payload: function(context) {
          return {
            release: this.readConfig('revisionKey'),
            at:     (new Date()).getTime()
          };
        },
        revisionKey: function(context) {
          return context.commandOptions.revision || (context.revisionData && context.revisionData.revisionKey);
        },
        firebaseClient: function(context) {
          var url = ['https://', this.readConfig("app"), '.firebaseio.com'].join('');
          return new (context._Firebase || Firebase)(url);
        }
      },
      requiredConfig: ['app', 'token'],

      configure: function(/* context */) {
        this.log('validating config', { verbose: true });

        ['revisionKey', 'payload', 'path', 'firebaseClient'].forEach(this.applyDefaultConfigProperty.bind(this));

        this.log('config ok', { verbose: true });
      },

      didActivate: function(context) {
        return this._authenticate()
          .then(this._updateVersion.bind(this))
          .then(this.log.bind(this, 'notified Firebase of release', { verbose: true }));
      },

      _updateVersion: function(version) {
        var firebase = this.readConfig("firebaseClient");
        var path     = this.readConfig("path");
        var payload  = this.readConfig("payload");

        return new Promise(function(resolve, reject) {
          firebase.child(path).set(payload, function(e) {
            if (e) {
              reject(e);
            } else {
              resolve();
            }
          });
        });
      },

      _authenticate: function() {
        var firebase = this.readConfig("firebaseClient");
        var token    = this.readConfig("token");

        return new Promise(function(resolve, reject) {
          firebase.authWithCustomToken(token, function(e) {
            if (e) {
              reject(e);
            } else {
              resolve();
            }
          });
        });
      }
    });

    return new DeployPlugin();
  }

};
