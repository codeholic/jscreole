// $Id$
if (typeof JSAN != 'undefined') {
    new JSAN().use('Parse.Simple.Base');
}
else {
    if (typeof Parse == 'undefined'
        || typeof Parse.Simple == 'undefined'
        || typeof Parse.Simple.Base == 'undefined')
    {
        throw new Error("You must load either JSAN or Parse.Simple.Base " +
            "before loading Parse.Simple.Creole");
    }
}

Parse.Simple.Creole = function(options) {
    var rx = {};
    rx.link = '[^\\]|~\\n]*(?:(?:\\](?!\\])|~.)[^\\]|~\\n]*)*';
    rx.linkText = '[^\\]~\\n]*(?:(?:\\](?!\\])|~.)[^\\]~\\n]*)*';
    rx.uriPrefix = '\\b(?:(?:https?|ftp)://|mailto:)';
    rx.uri = rx.uriPrefix + rx.link;
    rx.rawUri = rx.uriPrefix + '\\S*[^\\s!"\',.:;?]';
    rx.interwikiPrefix = '[\\w.]+:';
    rx.interwikiLink = rx.interwikiPrefix + rx.link;

    var formatLink = function(link, format) {
        format = format instanceof Array ? format : [ format ];
        if (typeof format[1] == 'undefined') { format[1] = ''; }
        return format[0] + link + format[1];
    };

    var g = {
        hr: { tag: 'hr', regex: /(^|\n)\s*----\s*(\n|$)/ },

        br: { tag: 'br', regex: /\\\\/ },
        
        preBlock: { tag: 'pre', capture: 2,
            regex: /(^|\n)\{\{\{\n((.*\n)*?)\}\}\}(\n|$)/,
            replaceRegex: /^ ([ \t]*\}\}\})/gm,
            replaceString: '$1' },
        tt: { tag: 'tt',
            regex: /\{\{\{(.*?\}\}\}+)/, capture: 1,
            replaceRegex: /\}\}\}$/, replaceString: '' },

        ulist: { tag: 'ul', capture: 0,
            regex: /(^|\n)([ \t]*\*[^*#].*(\n|$)([ \t]*[^\s*#].*(\n|$))*([ \t]*[*#]{2}.*(\n|$))*)+/ },
        olist: { tag: 'ol', capture: 0,
            regex: /(^|\n)([ \t]*#[^*#].*(\n|$)([ \t]*[^\s*#].*(\n|$))*([ \t]*[*#]{2}.*(\n|$))*)+/ },
        li: { tag: 'li', capture: 0,
            regex: /[ \t]*([*#]).+(\n[ \t]*[^*#\s].*)*(\n[ \t]*\1[*#].+)*/,
            replaceRegex: /(^|\n)[ \t]*[*#]/g, replaceString: '$1' },

        table: { tag: 'table', capture: 0,
            regex: /(^|\n)(\|.*?[ \t]*(\n|$))+/ },
        tr: { tag: 'tr', capture: 2, regex: /(^|\n)(\|.*?)\|?[ \t]*(\n|$)/ },
        th: { tag: 'th', regex: /\|+=([^|]*)/, capture: 1 },
        td: { tag: 'td', capture: 1,
            regex: /\|+([^|~]*(~(.|(?=\n)|$)[^|~]*)*)/ },

        singleLine: { regex: /.+/, capture: 0 },
        paragraph: { tag: 'p', capture: 0,
            regex: /(^|\n)([ \t]*\S.*(\n|$))+/ },
        text: { capture: 0, regex: /(^|\n)([ \t]*[^\s].*(\n|$))+/ },

        strong: { tag: 'strong', capture: 1,
            regex: /\*\*([^*~]*((\*(?!\*)|~(.|(?=\n)|$))[^*~]*)*)(\*\*|\n|$)/ },
        em: { tag: 'em', capture: 1,
            regex: '\\/\\/(((?!' + rx.uriPrefix + ')[^\\/~])*' +
                   '((' + rx.rawUri + '|\\/(?!\\/)|~(.|(?=\\n)|$))' +
                   '((?!' + rx.uriPrefix + ')[^\\/~])*)*)(\\/\\/|\\n|$)' },

        img: { regex: '\\{\\{((?!\\{)[^|}\\n]*(?:}(?!})[^|}\\n]*)*)\\|' +
                      '([^}~\\n]*((}(?!})|~.)[^}~\\n]*)*)}}',
            build: function(node, r, options) {
                var img = document.createElement('img');
                img.src = r[1];
                img.alt = r[2].replace(/~(.)/g, '$1');
                node.appendChild(img);
            } },

        namedUri: { regex: '\\[\\[(' + rx.uri + ')\\|(' + rx.linkText + ')\\]\\]',
            build: function(node, r, options) {
                var link = document.createElement('a');
                link.href = r[1];
                if (options && options.isPlainUri) {
                    link.appendChild(document.createTextNode(r[2]));
                }
                else {
                    this.apply(link, r[2], options);
                }
                node.appendChild(link);
            } },

        namedLink: { regex: '\\[\\[(' + rx.link + ')\\|(' + rx.linkText + ')\\]\\]',
            build: function(node, r, options) {
                var link = document.createElement('a');
                
                link.href = options && options.linkFormat
                    ? formatLink(r[1].replace(/~(.)/g, '$1'), options.linkFormat)
                    : r[1].replace(/~(.)/g, '$1');
                this.apply(link, r[2], options);
                
                node.appendChild(link);
            } },

        unnamedUri: { regex: '\\[\\[(' + rx.uri + ')\\]\\]',
            build: 'dummy' },
        unnamedLink: { regex: '\\[\\[(' + rx.link + ')\\]\\]',
            build: 'dummy' },
        unnamedInterwikiLink: { regex: '\\[\\[(' + rx.interwikiLink + ')\\]\\]',
            build: 'dummy' },

        rawUri: { regex: '(' + rx.rawUri + ')',
            build: 'dummy' },

        escapedSequence: { regex: '~(' + rx.rawUri + '|.)', capture: 1,
            tag: 'span', attrs: { 'class': 'escaped' } },
        escapedSymbol: { regex: /~(.)/, capture: 1,
            tag: 'span', attrs: { 'class': 'escaped' } }
    };
    g.unnamedUri.build = g.rawUri.build = function(node, r, options) {
        if (!options) { options = {}; }
        options.isPlainUri = true;
        g.namedUri.build.call(this, node, Array(r[0], r[1], r[1]), options);
    };
    g.unnamedLink.build = function(node, r, options) {
        g.namedLink.build.call(this, node, Array(r[0], r[1], r[1]), options);
    };
    g.namedInterwikiLink = { regex: '\\[\\[(' + rx.interwikiLink + ')\\|(' + rx.linkText + ')\\]\\]',
        build: function(node, r, options) {
                var link = document.createElement('a');
                
                var m, f;
                if (options && options.interwiki) {
                m = r[1].match(/(.*?):(.*)/);
                f = options.interwiki[m[1]];
            }
            
            if (typeof f == 'undefined') {
                if (!g.namedLink.apply) {
                    g.namedLink = new this.constructor(g.namedLink);
                }
                return g.namedLink.build.call(g.namedLink, node, r, options);
            }

            link.href = formatLink(m[2].replace(/~(.)/g, '$1'), f);
            
            this.apply(link, r[2], options);
            
            node.appendChild(link);
        }
    };
    g.unnamedInterwikiLink.build = function(node, r, options) {
        g.namedInterwikiLink.build.call(this, node, Array(r[0], r[1], r[1]), options);
    };
    g.namedUri.children = g.unnamedUri.children = g.rawUri.children =
            g.namedLink.children = g.unnamedLink.children =
            g.namedInterwikiLink.children = g.unnamedInterwikiLink.children =
        [ g.escapedSymbol, g.img ];

    for (var i = 1; i <= 6; i++) {
        g['h' + i] = { tag: 'h' + i, capture: 2,
            regex: '(^|\\n)[ \\t]*={' + i + '}[ \\t]' +
                   '([^~]*?(~(.|(?=\\n)|$))*)[ \\t]*=*\\s*(\\n|$)'
        };
    }

    g.ulist.children = g.olist.children = [ g.li ];
    g.li.children = [ g.ulist, g.olist ];
    g.li.fallback = g.text;

    g.table.children = [ g.tr ];
    g.tr.children = [ g.th, g.td ];
    g.td.children = [ g.singleLine ];
    g.th.children = [ g.singleLine ];

    g.h1.children = g.h2.children = g.h3.children =
            g.h4.children = g.h5.children = g.h6.children =
            g.singleLine.children = g.paragraph.children =
            g.text.children = g.strong.children = g.em.children =
        [ g.escapedSequence, g.strong, g.em, g.br, g.rawUri,
            g.namedUri, g.namedInterwikiLink, g.namedLink,
            g.unnamedUri, g.unnamedInterwikiLink, g.unnamedLink,
            g.tt, g.img ];

    g.root = {
        children: [ g.h1, g.h2, g.h3, g.h4, g.h5, g.h6,
            g.hr, g.ulist, g.olist, g.preBlock, g.table ],
        fallback: { children: [ g.paragraph ] }
    };

    Parse.Simple.Base.call(this, g, options);
};

Parse.Simple.Creole.prototype = new Parse.Simple.Base();

Parse.Simple.Creole.prototype.constructor = Parse.Simple.Creole;

/*

=head1 NAME

Parse.Simple.Base - Parse Creole into DOM

=head1 SYNOPSIS

  var creole = new Parse.Simple.Creole({
      interwiki: {
          MeatballWiki: 'http://www.usemod.com/cgi-bin/mb.pl?',
          TiddlyWiki: 'http://www.tiddlywiki.com/#',
          WikiCreole: 'http://www.wikicreole.org/wiki/',
          Wikipedia: 'http://en.wikipedia.org/wiki/'
      },
      linkFormat: '#'
  });
  
  var div = document.createElement('div');
  creole.parse(div, "* This is [[Wikipedia:Wikitext|wikitext]]");

=head1 DESCRIPTION

This module implements Creole 1.0 parser, as defined by
L<http://www.wikicreole.org/wiki/Creole1.0>.

=head2 Options

=over

=item interwiki

Interwiki map. Object properties' values are either strings or
arrays of one or two strings. The first string is a leading part
of the URL. If the second string is given as well, it is a
trailing part.

=item linkFormat

Internal links' format. Same format as in L<"interwiki">'s properties.

=back

=head1 SEE ALSO

Parse.Simple.Base

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
