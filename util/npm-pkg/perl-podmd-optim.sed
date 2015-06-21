#!/bin/sed -nrf
# -*- coding: UTF-8, tab-width: 2 -*-

: read_all
  $!{N;b read_all}
: normalize_input
  s~[ \t]+(\n|$)~\1~g
  s~^\s*~<!--\n!! auto-generated from .pod !!\n!! -->\n\n\n~

: identify_blocks
  s~\n# NAME\n+([^\f\n]+\n)~\n\n\1\f<underline>=\1~g
  s~\n# (DESCRIPTION|SYNOPSIS)\n+~\n~g
  # s~\n((\n+ {4}[^\f\n]+)+)~\f<code>\1\f</code>~g

: simple_transforms
  s~\f<titlecase-word>([A-Z])([A-Z]+)~\1\L\2\E~g

: code_block_init
  s~(\f<code>)(\n*)~\2```\n\1~g
  s~(```)(\n\f<code>[^\f]*\n *var [a-z]+ = )~\1js\2~g
  s~(```)(\n\f<code>)~\1text\2~g
  s~(\n*)(\f</code>)~\n\2```\1~g
: code_block_again
  s~(\f<code>)(\n+)~\2\1~g
  s~(\f<code>) {4}([^\f\n]+)~\2\1~g
  s~(\f<code>)(\f</code>)~~g
t code_block_again

: underline
  #s~(^|\n)([^\n]+\n) *(\f<underline>)~\n\f<hl>\2\2\3~g
  #s~\f<hl>([A-Za-z-]+)\b[^\n]*~<a name="\L\1\E" id="\L\1\E"></a>~g
  s~(\f<underline>)(\S)[^\f\n]~\2\1\2~g
  s~(\f<underline>)(\S)(\n|$)~\3~g
t underline

: list_optim
  s~(\n *\- )((new |[A-Za-z]+\.)*([a-z\\_]+[A-Z]?)+(|\
    | *\([^\n]*\)))\n~\1`\2`\n~g



: normalize_output
  s~^\s+~~
  s~\s*$~\n~
  s~\n+=cut\n+$~~
  p
b eof




: eof
