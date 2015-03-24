'use strict';

(function() {

  var url = 'https://music.hostedweb.tid.es/manifest.webapp';

  SystemXHRService.get(url, {responseType: 'json'}).then(response => {
    if (!response) {
      document.querySelector('#result').innerHTML = 'This failed!';
    }

    document.querySelector('#result').innerHTML = JSON.stringify(response);
  }, error => {
    document.querySelector('#result').innerHTML = JSON.stringify(error);
    console.error(error);
  });

}());
