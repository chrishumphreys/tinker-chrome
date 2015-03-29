/**
 * This code is original Tinker-chrome code
 * https://github.com/chrishumphreys/tinker-chrome
 * Chris Humphreys and others
 * License: GNU GENERAL PUBLIC LICENSE v3
 */

// simple script to experiment with regex for matching tinkerings to pages urls
function main(argv) {
    var regex = new RegExp('^http://bbc.co.uk/news/england/.*/as');

    console.log(regex.test('http://bbc.co.uk/news/england/12345678/as'));
}


// Must be last,
main(process.argv);
