# tinker-chrome

Chrome extension for making and sharing changes to arbitrary web pages.

Built to support collaborative copy editing within web development companies.


# Why?

We have a need to allow content designers to experiment with copy changes on our websites before requesting formal changes through the development team.

We'd rather this was a easy point and click solution rather than having to manipulate the site's source code.

We want the copy editors to be able to make their changes against any live or test web site.


# How it works

Tinker-chrome is a small chrome extension which puts any open webpage into editable mode. After making arbitrary changes to the html copy
the extension records the changes as a diff patch (called a 'tinkering') which it will then apply every time you visit the page in the future. In this way you
can experiment with copy change on live sites and demo these changes interactively to other team members.

When you are happy with the changes and wish to share them with the site authors you can create before and after screenshots of each page suitable
for sending the the authors.


# Getting started

Install the extension either from the Chrome Web Store (search for Tinker-chrome) or from this source.

An easel icon should be visible in the toolbar next to the location box.

Clicking this icon allows you to interact with the extension.

Initially the extension is disabled (to avoid manipulating any site you visit).

Navigate to the site you wish to edit, click the easel and click 'Apply tinkerings and enable editing'

See https://github.com/chrishumphreys/tinker-chrome/wiki

There is a lot of scope for additional features, raise a ticket to request yours.

# Support

Check out the FAQ (https://github.com/chrishumphreys/tinker-chrome/wiki).

If you think you have found a bug or have suggestions feel free to raise an ticket in GitHub (https://github.com/chrishumphreys/tinker-chrome/issues).


# Developing and contributing

I'm very keen to extend this extension in ways helpful to users. Contact me on GitHub with your ideas.

To install in chrome from source for development

  * Go here in chrome: chrome://extensions
  * make sure 'development mode' checkbox is ticked.
  * click load unpacked extension, point it to the tinker-chrome dir

If you want to look at console.log statements you can see them in the chrome://extensions page and click more -> view -> in debugger

You can also sometimes see them in the debugger by right clicking on the easel icon and choosing Inspect popup. That will only show the popup.js output.

You might be able to see the combined_content_script.js output in the regular page debugger console.

See CONTRIBUTING.md for info on how to contribute.


# License

All original Tinker-chrome source is available under GNU GENERAL PUBLIC LICENSE v3 (https://github.com/chrishumphreys/tinker-chrome/blob/master/LICENSE).

Tinker-chrome includes code by other people which is licensed separately, see Libraries section.

# Libraries

Contains source from the following awesome projects:

  * angularJs (http://angularjs.org) Licensed under MIT (https://github.com/angular/angular.js/blob/master/LICENSE)
  * bootstrap (http://getbootstrap.com) Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
  * diffDom (https://github.com/fiduswriter/diffDOM)  License: GNU LESSER GENERAL PUBLIC LICENSE v3 (https://github.com/chrishumphreys/tinker-chrome/blob/master/LICENSE)
