require 'fluentnode'
jscreole = require '../../lib/creole'

describe 'Wiki-Parsing',->
  it 'confirm wiki to html parsing',->
    wiki_Text       = "== A title\n
                      \n
                      some text\n
                      \n
                      * a point"
    expected_Html   = "<h2>A title</h2><p> some text\n</p> <ul>\n<li> a point</li></ul>"

    jsdom           = require('jsdom').jsdom()
    window          = jsdom.parentWindow
    div             = window.document.createElement('div')
    global.document = window.document
    new jscreole().parse(div, wiki_Text)
    delete global.document
    div.innerHTML.assert_Is expected_Html
