#!/bin/sed -rf
# -*- coding: UTF-8, tab-width: 2 -*-

: read_all
  $!{N;b read_all}
: normalize_input
  s~[ \t]+(\n|$)~\1~g

: identify_blocks
  s~(^|\n)=head1 NAME\n+([^\f\n]+\n)~\n\n\1\2\f<underline>=\2~g
  s~\n=head[1-9] (DESCRIPTION|SYNOPSIS)\n+~\n~g
  s~\n=head1 (AUTHOR|COPYRIGHT)\n~\n\n\f<titlecase-word>\1\
    \f<underline>=\1\n~g
  s~\n=head2 ([A-Z][a-z]+)\n+~\n\n\1\n\f<underline>-\1\n\n~g
  s~\n((\n+  [^\f\n]+)+)~\f<code>\1\f</code>~g

: simple_transforms
  s~\f<titlecase-word>([A-Z])([A-Z]+)~\1\L\2\E~g
  s~\bC<([^<>]+)>~`\1`~g

: code_block_init
  s~(\f<code>)(\n*)~\2```\n\1~g
  s~(```)(\n\f<code>[^\f]*\n *var [a-z]+ = )~\1js\2~g
  s~(```)(\n\f<code>)~\1text\2~g
  s~(\n*)(\f</code>)~\n\2```\1~g
: code_block_again
  s~(\f<code>)(\n+)~\2\1~g
  s~(\f<code>) {2}([^\f\n]+)~\2\1~g
  s~(\f<code>)(\f</code>)~~g
t code_block_again

: underline
  s~(^|\n)([^\n]+\n) *(\f<underline>)~\n\f<hl>\2\2\3~g
  s~\f<hl>([A-Za-z-]+)\b[^\n]*~<a name="\L\1\E" id="\L\1\E"></a>~g
  s~(\f<underline>)(\S)[^\f\n]~\2\1\2~g
  s~(\f<underline>)(\S)(\n|$)~\3~g
t underline

: list_init
  s~\n=over\n~\n\f<ul>~g
  s~\n=item ([^\f\n]+)\n~\f</li>\n* \1:\n\f<li>~g
  s~\n=item(\n+)~\n* \f<li>~g
  s~\n=back\n~\n\f</ul>~g
: list_indent
  s~(\f<li>)([^\f\n]*)(\n+)~  \2\3\1~g
t list_indent
: list_clean_indent
  s~ +\n~\n~g
  s~\n+\f<(li|ul)>\f</(li|ul)>\n+~\n\n~g
: list_mark_identifiers
  s~(\n *\* )((new |[A-Za-z]+\.)*([a-z_]+[A-Z]?)+(|\
    | *\([^\n]*\))):\n~\1`\2`:\n~g
: list_merge_word_defs
  s~(\n *\* [`A-Za-z_-, ]+):\n+ *\* ([`A-Za-z_-]+:\n)~\1, \2~g
  s~(\n *\* [`A-Za-z_-, ]+:)\n+ {2}([A-Z])~\1 \2~g
t list_merge_word_defs

: links
  s~(\n *\* )(`([A-Za-z-]+)`)(\n|:)~\1<a name="\L\3\E" id="\L\3\E"></a>\2\4~g
  s~(\b|<)F<([^\f\n <>]+@[^\f\n <>]+)>(>|)~\1[\2](mailto:\2)\3~g
  s~\bL<("?([A-Za-z-]+)"?)>~[\1](#\L\2\E)~g
  s~\bL<([a-z]{2,8}://[^\f\n <>]+)>~\f<a> \1 \f</a>~g
  s~(^|\n|<| )\f<a> ~\1~g
  s~ \f</a>( |>|\n|$)~\1~g
  s~\f</?a>~~g


: normalize_output
  s~^\s+~~
  s~\s*$~\n~
  s~\n+=cut\n+$~~
  s~^~<!--\n!! auto-generated from .pod by `pod2md.sed`\n!! -->\n\n\n~
  p
b eof




: eof
