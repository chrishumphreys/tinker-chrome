/**
 * This code is original Tinker-chrome code
 * https://github.com/chrishumphreys/tinker-chrome
 * Chris Humphreys and others
 * License: GNU GENERAL PUBLIC LICENSE v3
 */

'use strict';

angular.module('tinkerApp', []);

angular.module('tinkerApp')
.run(function ($rootScope) {})

.controller('MainCtrl', [ '$scope', function($scope) {

  $scope.otherWindows = chrome.extension.getBackgroundPage();
  $scope.enabled = $scope.otherWindows.getEnabled();
  $scope.screenshotsEnabled = $scope.otherWindows.getScreenshotsEnabled();
  $scope.saves = [];
  $scope.currentPage = '';
  $scope.diffMessage = '';
  $scope.showFinishPanel = false;
  $scope.finishName = '';
  $scope.isEditing = false;
  $scope.notificationsEnabled = $scope.otherWindows.getNotificationsEnabled();
  $scope.htmlFilename = null;
  $scope.haveScreenshots = false;


  $scope.updateScreenshotData = function() {
      $scope.afterImageUri = $scope.otherWindows.getScreenshotAfterDataUri();
      $scope.beforeImageUri = $scope.otherWindows.getScreenshotBeforeDataUri();
  };

  $scope.toggleNotifications = function(enabled) {
      $scope.notificationsEnabled = enabled;
      console.log('notifications enabled: ' + enabled);
      $scope.otherWindows.setNotificationsEnabled($scope.notificationsEnabled);
  };

  $scope.startEditing = function() {
    $scope.isEditing = true;
    $scope.otherWindows.startEdit();
    window.close();
  };

  $scope.showFinishEditing = function() {
    $scope.finishUrl = $scope.currentPage;
    $scope.showFinishPanel = true;
  };

  $scope.finishEditing = function(newUrl, newName) {
    $scope.isEditing = false;
    $scope.showFinishPanel = false;
    console.log(newName + " : " + newUrl);
    $scope.otherWindows.finishEdit(newUrl, newName);
  };

  $scope.clear = function() {
    $scope.otherWindows.clearSaves();

  };

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    getIndex();
  });

  $scope.enable = function() {
    $scope.otherWindows.enableHooks($scope.backendCallbackFunction, false);
  };

  $scope.enableWithScreenshots = function() {
    $scope.otherWindows.enableHooks($scope.backendCallbackFunction, true);
  };

  $scope.backendCallbackFunction = function(type, data) {
    console.log('callback received: ' + type);
    if (type =='enabledHooks') {
      $scope.enabled = true;
      $scope.$apply();
    }
    if (type == 'new-page'){
      //                console.log('new url: ' + data);
      $scope.currentPage = data;
      $scope.$apply();
    }
    if (type == 'diff-info') {
      $scope.diffMessage = data;
      $scope.$apply();
    }

    if (type =='log') {
        console.log('Backend: ' + data.message);
    }

    if (type =='screenshots-complete') {
        console.log('Screenshots completed');
        $scope.updateScreenshotData();
        $scope.haveScreenshots = true;
        $scope.$apply();
    }
  };


  $scope.close = function() {
    window.close();
  };

  $scope.disable = function() {
    $scope.otherWindows.disableHooks();
    $scope.enabled = false;
    $scope.close();
  };


  $scope.reloadWithoutTinkers = function() {
      $scope.disable();
      chrome.tabs.reload(function() {
          $scope.takeScreenshot(function(success){
            $scope.enable();
          });
      });
  };


  $scope.openImageInNewWindow = function(type) {
      var filename;
      if (type == 'before') {
          filename = $scope.beforeImageFilepath;
      }
      if (type == 'after') {
          filename = $scope.afterImageFilepath;
      }

      window.open(filename);

  };

   $scope.openHtml= function() {

       var name = $scope.currentPage.split('?')[0].split('#')[0];
       if (name) {
           name = name
               .replace(/^https?:\/\//, '')
               .replace(/[^A-z0-9]+/g, '-')
               .replace(/-+/g, '-')
               .replace(/^[_\-]+/, '')
               .replace(/[_\-]+$/, '');
           name = '-' + name;
       } else {
           name = '';
       }
       name = 'screencapture' + name + '-' + Date.now() + '.html';


       function onwriteend() {
           // open the file that now contains the blob
           var filename = 'filesystem:chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/temporary/' + name;
           console.log('Written ' + filename);
//           callback(filename);
           window.open(filename);
       }

       function errorHandler() {
           console.log('Error');
       }

       // create a blob for writing html to file with embedded images...
       var html = "<html><h2>Before:</h2>\n"
           + "<img src='" + $scope.beforeImageUri + "'>\n"
           +"<br><h2>After:</h2><br>\n<img src='" + $scope.afterImageUri + "'>\n"
           + "<br></html>"
       var blob = new Blob([html], {type: 'text/html'});

       window.webkitRequestFileSystem(window.TEMPORARY, blob.size, function(fs){
           fs.root.getFile(name, {create: true}, function(fileEntry) {
               fileEntry.createWriter(function(fileWriter) {
                   fileWriter.onwriteend = onwriteend;
                   fileWriter.write(blob);
               }, errorHandler);
           }, errorHandler);
       }, errorHandler);

   };



  // prepare the popup on display...

  $scope.updateScreenshotData();

  function getIndex() {
    $scope.otherWindows.patchedUrls(function(urls) {
      $scope.$apply(function() {
        $scope.saves = urls;
      });

    });
  }

  getIndex();

  // if we are already enabled we will need to reconnect this popup instance to the background
  // if not we can wait until they click enable
  if ($scope.enabled) {
    $scope.otherWindows.reconnectPopup($scope.backendCallbackFunction);

  }

  console.log('Popup open and logging.');
}]);
