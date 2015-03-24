'use strict';

(function (exports) {
  function SystemXHRService() {

  }

  SystemXHRService.prototype = {
    get: function ss_get(url, params) {
      if (!url) {
        return Promise.reject(new Error('The url is not defined'));
      }

      var request = {
        type: 'get',
        url: url,
        params: params || {}
      };

      return this._sendRequest(request);
    },

    _sendRequest: function ss_sendRequest(request) {
      return new Promise((resolve, reject) => {
        navigator.mozApps.getSelf().onsuccess = function(evt) {
          var app = evt.target.result;
          app.connect('systemxhrrequired').then(function onConnAccepted(ports) {
            var port = ports[0];
            if (!port) {
              return;
            }

            port.onmessage = e => {
              resolve(e.data);
            };
            port.start();
            port.postMessage(request);
          }, function onConnRejected(reason) {
            console.warn('systemxhrrequired IAC is rejected');
            reject(reason);
          });
        };
      });
    }
  };

  exports.SystemXHRService = new SystemXHRService();
}(window));
