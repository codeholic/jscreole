<!--
!! auto-generated from .pod by `pod2md.sed`
!! -->


<a name="jscreole" id="jscreole"></a>
jscreole - Parse Creole into DOM
================================
```js
var creole = new creole({
    interwiki: {
        MeatballWiki: 'http://www.usemod.com/cgi-bin/mb.pl?',
        TiddlyWiki: 'http://www.tiddlywiki.com/#',
        WikiCreole: 'http://www.wikicreole.org/wiki/',
        Palindrome: function(link) {
                return 'http://www.example.com/wiki/' + link.split('').reverse().join('');
            }
    },
    linkFormat: '#'
});

var div = document.createElement('div');
creole.parse(div, "* This is [[Wikipedia:Wikitext|wikitext]]");
```

This module implements Creole 1.0 parser, as defined by
http://www.wikicreole.org/wiki/Creole1.0 .


<a name="options" id="options"></a>
Options
-------

* <a name="defaultimagetext" id="defaultimagetext"></a>`defaultImageText`: Alternative text for an image with no alternative text
  ```text
  {{image.png}}
  ```

  as opposed to empty alternative text
  ```text
  {{image.png|}}
  ```

  Note that strict Creole 1.0 doesn't allow images with no alternative text.

* <a name="interwiki" id="interwiki"></a>`interwiki`: Interwiki map. Object properties' values are strings, arrays of one or two
  strings, or functions. The first string is a leading part
  of the URL. If the second string is given as well, it is a
  trailing part. If the value is a function, which takes a link identifier as an
  argument, its return value is the whole URL.

* <a name="linkformat" id="linkformat"></a>`linkFormat`: Internal links' format. Same format as in ["interwiki"](#interwiki)'s properties.

* <a name="strict" id="strict"></a>`strict`: Whether the parser is strict Creole 1.0. For constructor only, i. e.
  non-overridable in `parse` method. A non-strict parser allows images in tables
  and images with no alternative text.

<a name="creole" id="creole"></a>
creole._base - Parse text into DOM
==================================
```js
// Define grammar
var g = {
    para: { _tag: 'p',
        _regex: /([ \t]*\S.+((\r?\n|\r)[ \t]*\S.*)*)/, _capture: 0 }
};
g._root = { _children: [ g.para ] };

// Create parser
var parser = new creole._base(g);

// Parse
var div = document.createElement('div');
parser.parse(div, 'para\n' +
                  ' continues\n\n' +
                  'another para\n \n' +
                  'yet another para');
```

This module implements a simple recursive descent parser using regular
expressions for lexical analysis. The result is stored into a DOM object,
that can be then put in a document or traversed using standard DOM API.


<a name="parser" id="parser"></a>
Parser
------

* `new creole._base(grammar, options)`:

  The constructor creates a new parser object given a grammar and options.
  The grammar is an object of any type, which must contain a root property,
  that also must be an object of any type. The root is cast to a
  type specified by `this._ruleConstructor`, being `creole._rule`
  by default. See ["Rules"](#rules) for more info on defining rule objects.

  Options are optional but if passed it must be an object. The only option
  available in `creole._base` is `forIE`, which should be set `true` for
  Microsoft Internet Explorer compatibility. Derived objects and subinterfaces
  may extend the `options` object with their own options.

* `parse(node, data, options)`:

  This method parses flat text data and creates a DOM tree inside a given node,
  which should be a Node object. If options are passed, they override those
  passed to the constructor. Options merge at the first depth, merging
  nested options is not supported.

<a name="rules" id="rules"></a>
Rules
-----

* `_regex`: A regular expression to match the input.

* `_capture`: What should be captured for the output data: 0 for the whole matched substring,
  1 and so on for corresponding capturing brackets. If not listed, data will be
  empty.

* `_replaceRegex`, `_replaceString`: If set, captured data will be processed before output.

* `_tag`: If set, captured data will be enclosed inside a new child element, otherwise
  they will be put in the current node.

* `_attrs`: If set to an object, a new child element will have the given attributes.

* `_children`: An array of grammar rules, which define possible child nodes.

* `_fallback`: If there are chunks which don't match any child rule, they are being
  processed with this one.

<a name="author" id="author"></a>
Author
======

Ivan Fomichev <[ifomichev@gmail.com](mailto:ifomichev@gmail.com)>


<a name="copyright" id="copyright"></a>
Copyright
=========
```text
Copyright (c) 2008 Ivan Fomichev

Portions Copyright (c) 2007 Chris Purcell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
