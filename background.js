/**
 * This code is original Tinker-chrome code
 * https://github.com/chrishumphreys/tinker-chrome
 * Chris Humphreys and others
 * License: GNU GENERAL PUBLIC LICENSE v3
 */

var DEBUG = true;

var enabled;

var screenshotsEnabled = false;

var screenshot_after;
var screenshot_before;

var notificationsEnabled = true;

// called by popup...
function getEnabled () {
  return enabled;
}

function enable () {
  if (!enabled) {
    enabled = true;
    _registerListener();
  }
}

// called by popup...
function getScreenshotsEnabled() {
    return screenshotsEnabled;
}
// called by popup...
function setScreenshotsEnabled(enabled) {
    screenshotsEnabled = enabled;
}

function getScreenshotAfterDataUri() {
    return screenshot_after;
}

function getScreenshotBeforeDataUri() {
    return screenshot_before;
}

function disable () {
  enabled = false;
}

var popupCallback;

var ContentStore = {

  multiGet : function(strArr, cb) {
    chrome.storage.local.get(strArr, function(items) {
      cb(items);
    });
  },

  get : function(url, cb) {

    chrome.storage.local.get(url, function(items) {
      //                    console.log('get : ' + JSON.stringify(items));
      cb(items[url]);
    });

  },

  set : function(url, data) {

    chrome.storage.local.get([url, 'index'], function(items) {

      var added, indexAdded = false;

      if (items != null) {

        if (items[url] != null) {
          //                    console.log('appending');
          items[url].push(data);
          added = true;
        }

        //                        chrome.storage.local.get("index", function(items) {
        //                console.log('index: ' + items.index);

        if (items.index != null) {
          //                    console.log('adding to index');
          items.index.push(url);
          indexAdded = true;
        }
        //                        });

      } else {
        items = {};
      }

      if (!added) {
        //                console.log('storing new');
        items[url] = [];
        items[url].push(data);
      }

      if (!indexAdded) {
        //                console.log('initialising index to ' + url);
        items.index = [];
        items.index.push(url);
      }

      chrome.storage.local.set(items, function() {
        //                console.log('stored');
      });

    });

  },

  index : function(cb) {
    chrome.storage.local.get(["index"], function(items) {
      if (items.index) {
        cb(items.index);
      } else {
        cb([]);
      }
    });
  },

  clear : function() {
    chrome.storage.local.clear(function() {});
  }

};


var contentScriptListener = function(info) {

  if(DEBUG)console.log('background received ' + JSON.stringify(info));

  if (info.type == 'diff') {
    _handleNewDiffMessage(info);
  }

  if (info.type == 'url') {
    _handlePageIdentificationMessage(info.url);
  }

  if (info.type == 'peek-url') {
    _handlePeekPageMessage(info.url);
  }

};

// handle messages from the content-script running inside the page...
function _registerListener() {
  if(DEBUG)console.log('Registering background listener');
  chrome.runtime.onConnect.addListener(function(port) {

    port.onMessage.addListener(contentScriptListener);
  });
}


//called by popup window
function disableHooks() {
  if(DEBUG)console.log('Disable hooks started...');
  disable();
  chrome.tabs.onUpdated.removeListener(pageHookListener);

}

var pageHookListener = function(tabId, e, tab) {
  if(DEBUG)console.log("tab load received  : " + JSON.stringify(e));

  if (e.status == 'complete') {
    if (tab.url.indexOf('http') == 0) {
      if(DEBUG)console.log('new http(s) page loaded: ' + tabId);
      _injectScripts(tabId, function(){
        _getPage(tabId);
      });
    }
  }
};

// called by popup window
function enableHooks(callback, screenshots) {
  if(DEBUG)console.log('Enable hooks started...');

  screenshotsEnabled = screenshots;

  popupCallback = callback;

  // called every time the active tab loads a page.
  // this ensures we remain hooked as they navigate around.
  // push in our content-script so we can apply diffs or edit content.
  chrome.tabs.onUpdated.addListener( pageHookListener
    //        , {url: [{schemes: 'http'}, {schemes: 'https'}]}
  );

  // Now to hook the currently active tab.
  // push in our content-script so we can apply diffs or edit content.
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var tabId = tabs[0].id;
    if(DEBUG)console.log('enabling for active tab : ' + tabId);
    _injectScripts(tabId, function(){
      enable();
      _getPage(tabId);
      popupCallback('enabledHooks', null)
    });
  });
}


function _injectScripts(tabId, cb) {
  if(DEBUG)console.log('about add content script hooks into: ' + tabId);
  try {
    chrome.tabs.executeScript(tabId, {file: "combined_content_script.js"}, cb);
  } catch(e){
    console.log('unable to inject scripts : ' + e);
  }
}



function _getPage(tabId) {
  _sendCommand({ "type": "get-page" }, tabId);
}

// called by popup window
function reconnectPopup(callback) {
  popupCallback = callback;
  _sendCommandToActiveTab({ "type": "peek-page" }, function(success){});
}

// called by popup window
function startEdit() {
  _sendCommandToActiveTab({ "type": "start-edit" }, function(success){});
}

// called by popup window
function finishEdit(indexUrl, indexName) {
  _sendCommandToActiveTab({ "type": "finish-edit", indexUrl : indexUrl, indexName : indexName }, function(success){});
}

// called by popup window
function clearSaves() {
  ContentStore.clear();
}

// called by popup window
function patchedUrls(callback) {
  ContentStore.index(callback);
}

function _sendCommandToActiveTab(command, callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if(DEBUG)console.log('sending command to tab : ' + tabs[0].id + ' ' + command.type);
    chrome.tabs.sendMessage(tabs[0].id, command, function(response) {
      if (response) {
        if(DEBUG)console.log("sendCommand response: " + response != null ? JSON.stringify(response) : 'null');
        callback(true);
      } else {
        callback(true);
      }
    });
  });
}

function _sendCommand(command, tabId) {
  if(DEBUG)console.log('sending command to tab : ' + tabId + ' ' + command.type);
  chrome.tabs.sendMessage(tabId, command, function(response) {
    if (response) {
      if(DEBUG)console.log("sendCommand response: " + response != null ? JSON.stringify(response) : 'null');
    }
  });
}

function _handlePageIdentificationMessage(url) {
  _logToPopup('_handlePageIdentificationMessage...');

  if(screenshotsEnabled) {
      _takeScreenshot(url, 'screenshot_before', function(){});
  }

  _applyDiffs(url, function(success) {
      //diffs applied
      if(screenshotsEnabled) {
          _takeScreenshot(url, 'screenshot_after', function() {
              // we now have both screenshots
              screenshotsEnabled= false;
              popupCallback('screenshots-complete', url);
          });
      }
  });

   _notifyPopupWindowOfNewUrl(url);
}

function _handlePeekPageMessage(url) {
  _notifyPopupWindowOfNewUrl(url);
}

function _notifyPopupWindowOfNewUrl(url) {
  if(DEBUG)console.log('informing popup of new page : ' + url);
  popupCallback('new-page', url);
}

// find and apply matching diffs for this url
function _applyDiffs(url, callback) {
  if (false)_applyExactMatchDiffs(url, callback);
  else _applyRegexDiffs(url, callback);
}


function _applyExactMatchDiffs(url, callback) {

  ContentStore.get(url, function(items) {

    if (items != null) {
      if(DEBUG)console.log('applying ' + items.length + ' diffs to page : ' + url);

      var command = {
        "type" : "apply",
        "diffs": items
      };

      _sendCommandToActiveTab(command, function(success){

          //        popupCallback('diff-info', 'applied ' + items.length + ' tinkerings');
          if (notificationsEnabled) {
              chrome.notifications.create('', {
                  type: "basic",
                  title: "Tinker Chrome",
                  message: '' + items.length + ' tinkerings applied',
                  iconUrl: 'icon32.png'
              }, function(notificationId) {});
          }
          callback(success);

      });

    } else {
      if(DEBUG)console.log('no diffs found for  ' + url);
      //            popupCallback('diff-info', 'no tinkerings applied' );

    }

  });
}

function _applyRegexDiffs(url, callback) {

  function matches(regex, actual){
    var regex = new RegExp('^' + regex + '$');
    return regex.test(actual);
  }

  chrome.storage.local.get(["index"], function(items) {
    if (items.index) {
      var matchingUrls = [];
      items.index.forEach(function(indexUrl) {
        console.log("Regex apply, attempting to match " + indexUrl);
        if (matches(indexUrl, url)) {
          console.log("matched " + indexUrl);
          matchingUrls.push(indexUrl);
        }
      });

      var diffs = [];
      //TODO this has a bit of an issue where different diffs using the same indexUrl will result in duplicate diffs.
      ContentStore.multiGet(matchingUrls, function(items) {
        console.log(JSON.stringify(items));
        console.log('matchingUrls : ' + matchingUrls.length);
        matchingUrls.forEach(function(indexUrl){
          var urlDiffs = items[indexUrl];
          if (urlDiffs != null) {
            console.log("len: " + diffs.length);
            console.log('Found ' + urlDiffs.length + ' diffs');
            diffs = diffs.concat(urlDiffs);
            console.log('lenb: ' + diffs.length);
          }
        });
        if (diffs.length > 0) {
          console.log(diffs);
          _sendCommandToActiveTab({ "type": "apply", "diffs": diffs }, function(success){
              if (notificationsEnabled) {
                    chrome.notifications.create('', {
                      type: "basic",
                      title: "Tinker Chrome",
                      message: '' + diffs.length + ' tinkerings applied',
                      iconUrl: 'icon32.png'
                    }, function(notificationId) {});
              }
              callback(success);
          });
        } else {
          console.log('no diffs found for  ' + url);
        }
      });

    }
  });
}

function _handleNewDiffMessage(newValue) {
  if (newValue != null) {

    if (newValue.url != null && newValue.diff != null) {

      if(DEBUG)console.log('New content for ' + newValue.url + ' ' + newValue.indexName + ' ' + newValue.indexUrl + ' : ' + newValue.diff);
      if (newValue.indexUrl) {
        ContentStore.set(newValue.indexUrl, newValue.diff);
      } else {
        ContentStore.set(newValue.url, newValue.diff);
      }
    } else {
      console.log('Invalid contentChange');
    }
  }
}

function _takeScreenshot(url, popupMessageCode, callback) {
    _logToPopup('about to take screenshot');
        chrome.tabs.captureVisibleTab(function(dataURI) {
            if (dataURI) {
                if (popupMessageCode == 'screenshot_before') {
                    screenshot_before = dataURI;
                }
                if (popupMessageCode == 'screenshot_after') {
                    screenshot_after = dataURI;
                }
            }
            callback();
        });
}

function _logToPopup(message) {
    popupCallback('log', {message : message});
}


function getNotificationsEnabled() {
    return notificationsEnabled;
}

function setNotificationsEnabled(notifications) {
    notificationsEnabled = notifications;
}
