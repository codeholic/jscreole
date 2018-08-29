#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
SELFPATH="$(readlink -m "$0"/..)"


function upd_npm_pkg_meta () {
  cd "$SELFPATH" || return $?

  local PODMD_MOD=
  # PODMD_MOD='Pod::Markdown'
  # ^-- tested 2015-06-21: yielded quite some ugly Markdown, and no easy
  #     way to tell code block indentation apart from list indentation.
  [ -z "$PODMD_MOD" ] || perl_podmd_test 2>/dev/null \
    || perl_podmd_download || return $?

  local SRC_FN=
  for SRC_FN in ../../*.pod; do
    pod2markdown "$SRC_FN" || return $?
  done

  return 0
}


function perl_podmd_test () {
  perl -M"$PODMD_MOD" -e ''; return $?
}


function perl_podmd_download () {
  echo "W: Perl module $PODMD_MOD seems to not be installed." \
    "Will try to download it:" >&2
  local CPAN_DL_BASE='https://api.metacpan.org/source/'
  local PODMD_CPAN_DL='RWSTAUNER/Pod-Markdown-2.002/lib/Pod/Markdown.pm'
  local SAVE_FN="${PODMD_MOD//:://}".pm
  mkdir -p "${SAVE_FN%/*.pm}" || return $?
  wget -O "$SAVE_FN" -c "${CPAN_DL_BASE}${PODMD_CPAN_DL}" || return $?$(
    echo "E: Unable to download perl module $PODMD_MOD" >&2)
  perl_podmd_test; return $?
}


function perl_podmd_convert () {
  perl -M"$PODMD_MOD" -e "$PODMD_MOD"'->new->filter(@ARGV)' "$@"; return $?
}


function pod2markdown () {
  local SRC_FN="$1"; shift
  local DEST_FN="$1"; shift
  [ -n "$DEST_FN" ] || DEST_FN="${SRC_FN%.pod}.md"

  if [ -z "$PODMD_MOD" ]; then
    sed -nrf "$SELFPATH/pod2md.sed" "$SRC_FN" >"$DEST_FN" || return $?
    return 0
  fi

  perl_podmd_convert "$SRC_FN" >"$DEST_FN" || return $?
  sed -nrf perl-podmd-optim.sed -i "$DEST_FN" || return $?
  return 0
}



















upd_npm_pkg_meta "$@"; exit $?
