// $Id$
//!begin
if (!Parse) { var Parse = {}; }
if (!Parse.Simple) { Parse.Simple = {}; }

Parse.Simple.Base = function(grammar, options) {
    if (!arguments.length) { return; }

    this.grammar = grammar;
    this.grammar.root = new this.ruleConstructor(this.grammar.root);
    this.options = options;
};

Parse.Simple.Base.prototype = {
    ruleConstructor: null,
    grammar: null,
    options: null,

    parse: function(node, data, options) {
        if (options) {
            for (i in this.options) {
                if (typeof options[i] == 'undefined') { options[i] = this.options[i]; }
            }
        }
        else {
            options = this.options;
        }
        data = data.replace(/\r\n?/g, '\n');
        this.grammar.root.apply(node, data, options);
        if (options && options.forIE) { node.innerHTML = node.innerHTML.replace(/\r?\n/g, '\r\n'); }
    }
};

Parse.Simple.Base.prototype.constructor = Parse.Simple.Base;

Parse.Simple.Base.Rule = function(params) {
    if (!arguments.length) { return; }

    for (var p in params) { this[p] = params[p]; }
    if (!this.children) { this.children = []; }
};

Parse.Simple.Base.prototype.ruleConstructor = Parse.Simple.Base.Rule;

Parse.Simple.Base.Rule.prototype = {
    regex: null,
    capture: null,
    replaceRegex: null,
    replaceString: null,
    tag: null,
    attrs: null,
    children: null,

    match: function(data, options) {
        return data.match(this.regex);
    },

    build: function(node, r, options) {
        var data;
        if (this.capture !== null) {
            data = r[this.capture];
        }

        var target;
        if (this.tag) {
            target = document.createElement(this.tag);
            node.appendChild(target);
        }
        else { target = node; }

        if (data) {
            if (this.replaceRegex) {
                data = data.replace(this.replaceRegex, this.replaceString);
            }
            this.apply(target, data, options);
        }

        if (this.attrs) {
            for (var i in this.attrs) {
                target.setAttribute(i, this.attrs[i]);
                if (options && options.forIE && i == 'class') { target.className = this.attrs[i]; }
            }
        }
        return this;
    },

    apply: function(node, data, options) {
        var tail = '' + data;
        var matches = [];

        if (!this.fallback.apply) {
            this.fallback = new this.constructor(this.fallback);
        }

        while (true) {
            var best = false;
            var rule  = false;
            for (var i = 0; i < this.children.length; i++) {
                if (typeof matches[i] == 'undefined') {
                    if (!this.children[i].match) {
                        this.children[i] = new this.constructor(this.children[i]);
                    }
                    matches[i] = this.children[i].match(tail, options);
                }
                if (matches[i] && (!best || best.index > matches[i].index)) {
                    best = matches[i];
                    rule = this.children[i];
                    if (best.index == 0) { break; }
                }
            }
                
            var pos = best ? best.index : tail.length;
            if (pos > 0) {
                this.fallback.apply(node, tail.substring(0, pos), options);
            }
            
            if (!best) { break; }

            if (!rule.build) { rule = new this.constructor(rule); }
            rule.build(node, best, options);

            var chopped = best.index + best[0].length;
            tail = tail.substring(chopped);
            for (var i = 0; i < this.children.length; i++) {
                if (matches[i]) {
                    if (matches[i].index >= chopped) {
                        matches[i].index -= chopped;
                    }
                    else {
                        matches[i] = void 0;
                    }
                }
            }
        }

        return this;
    },

    fallback: {
        apply: function(node, data, options) {
            if (options && options.forIE) {
                // workaround for bad IE
                data = data.replace(/\n/g, ' \r');
            }
            node.appendChild(document.createTextNode(data));
        }
    }    
};

Parse.Simple.Base.Rule.prototype.constructor = Parse.Simple.Base.Rule;

//!end

/*

=head1 NAME

Parse.Simple.Base - Parse text into DOM

=head1 SYNOPSIS

  // Define grammar
  var g = {
      para: { tag: 'p',
          regex: /([ \t]*\S.+((\r?\n|\r)[ \t]*\S.*)*)/, capture: 0 }
  };
  g.root = { children: [ g.para ] };

  // Create parser
  var parser = new Parse.Simple.Base(g);
  
  // Parse
  var div = document.createElement('div');
  parser.parse(div, 'para\n' +
                    ' continues\n\n' +
                    'another para\n \n' +
                    'yet another para');

=head1 DESCRIPTION

This module implements a simple recursive descent parser using regular
expressions for lexical analysis. The result is stored into a DOM object,
that can be then put in a document or traversed using standard DOM API.

=head2 Parser

=over

=item new Parse.Simple.Base(grammar, options)

The constructor creates a new parser object given a grammar and options.
The grammar is an object of any type, which must contain a root property,
that also must be an object of any type. The root is cast to a
type specified by C<this.ruleConstructor>, being C<Parse.Simple.Base.Rule>
by default. See L<"Rules"> for more info on defining rule objects.

Options are optional but if passed it must be an object. The only option
available in C<Parse.Simple.Base> is C<forIE>, which should be set C<true> for
Microsoft Internet Explorer compatibility. Derived objects and subinterfaces
may extend the C<options> object with their own options.

=item parse(node, data, options)

This method parses flat text data and creates a DOM tree inside a given node,
which should be a Node object. If options are passed, they override those
passed to the constructor. Options merge at the first depth, merging
nested options is not supported.

=back

=head2 Rules

=over

=item regex

A regular expression to match the input.

=item capture

What should be captured for the output data: 0 for the whole matched substring,
1 and so on for corresponding capturing brackets. If not listed, data will be
empty.

=item replaceRegex

=item replaceString

If set, captured data will be processed before output.

=item tag

If set, captured data will be enclosed inside a new child element, otherwise
they will be put in the current node.

=item attrs

If set to an object, a new child element will have the given attributes.

=item children

An array of grammar rules, which define possible child nodes.

=item fallback

If there are chunks which don't match any child rule, they are being
processed with this one.

=back

=head1 AUTHOR

Ivan Fomichev <F<ifomichev@gmail.com>>

=head1 COPYRIGHT

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

=cut

*/
