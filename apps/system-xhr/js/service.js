'use strict';
/* global LazyLoader */

/*
 * This library allows anonymous (no cookies) cross-origin XHR without the
 * target site having CORS enabled.
 *
 * The implementation is based on IAC and alloed origins are defined at build
 * time.
 */

(function(exports) {

  var service, manifestURLs;

  function isAllowed(manifestURL) {
    return manifestURLs.indexOf(manifestURL) !== -1;
  }

  function SystemXHRServiceIAC() {
    navigator.mozSetMessageHandler('connection', this.onConnection.bind(this));
  }

  SystemXHRServiceIAC.prototype = {
    onConnection: function ss_onConnection(request) {
      if (request.keyword !== 'systemxhrrequired') {
        window.console.warn('Expected "systemxhrrequired", got "' +
                             request.keyword + '"');
        return;
      }

      this.getApp().then(app => {
        var manifestURL = app.manifestURL;
        app.getConnections().then(conns => {
          conns.forEach(conn => {
            if (conn.keyword === 'systemxhrrequired' &&
                conn.subscriber === manifestURL) {
              if (!isAllowed(conn.publisher)) {
                window.console.warn('App not allowed', conn.publisher);
                conn.cancel();
              }
            }
          });

          var port = request.port;
          port.onmessage = evt => this.handleRequest(evt, port);
          port.start();
        });
      });
    },

    handleRequest: function ss_handleRequest(evt, port) {
      var type = evt.data.type;
      if (!type) {
        window.warn('Message received bad formed');
        return;
      }

      if (this[type]) {
        this[type](evt.data, port);
      }
    },

    getApp: function ss_getMyself() {
      if (this.app) {
        return Promise.resolve(this.app);
      }
      return new Promise(function(resolve, reject) {
        navigator.mozApps.getSelf().onsuccess = function() {
          this.app = this.result;
          resolve(this.app);
        };
      });
    },

    onConnected: function ss_onConnected() {
      if (navigator.onLine) {
        return Promise.resolve();
      }

      return new Promise(function(resolve, reject) {
         window.addEventListener('online', function onConnect() {
          window.removeEventListener('online', onConnect);
          resolve();
        });
      });
    },

    postMessage: function ss_postMessage(port, message) {
      port.postMessage(message);
      port.close();
    },

    get: function ss_get(data, port) {
      this.onConnected().then(() => {
        var xhr = new XMLHttpRequest({
          mozSystem: true
        });

        if (typeof data.params === 'object') {
          Object.keys(data.params).forEach(key => {
            xhr[key] = data.params[key];
          });
        }

        xhr.open('get', data.url, true);

        xhr.onload = () => {
          var status = xhr.status;
          if (status == 200) {
            this.postMessage(port, xhr.response);
          } else {
            console.error('Error while loading resource, status:', status);
            this.postMessage(port);
          }
        };

        xhr.onerror = e => {
          console.error('Error getting content', e.name);
          this.postMessage(port);
        };

        xhr.send();
      });
    }
  };

  function init() {
    LazyLoader.getJSON('js/init.json').then(data => {
      manifestURLs = data['security.systemXHR.allow.manifestURLs'];
      manifestURLs = Array.isArray(manifestURLs) ? manifestURLs : [];
      service = new SystemXHRServiceIAC();
    });
  }

  init();

}(window));
