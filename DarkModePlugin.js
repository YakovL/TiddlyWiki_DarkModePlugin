/***
|''Name''|NightModePlugin|
|''Description''|This plugin introduces "night mode" (changes styles) and switching it by the {{{switchNightMode}}} macro and operating system settings|
|''Version''|0.12.1|
|''Source''|https://github.com/YakovL/TiddlyWiki_DarkModePlugin/blob/master/DarkModePlugin.js|
|''Author''|Yakov Litvin|
!!!Syntax
{{{
<<switchNightMode>>
<<switchNightMode label:"☀️/🌘">>
}}}
!!!Demo
<<switchNightMode>>
<<switchNightMode label:"☀️/🌘">>
!!!Code
***/
//{{{
var pluginName = "NightModePlugin"

var applySectionCSS = function(sectionName) {
    var sectionText = store.getRecursiveTiddlerText(pluginName + "##" + sectionName, "", 1)
    var css = sectionText.replace(/^\s*{{{((?:.|\n)*?)}}}\s*$/, "$1")
    return setStylesheet(css, sectionName)
}

// when a browser doesn't support detection, returns falsy
var isOsInDarkMode = function() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

config.macros.switchNightMode = {
    nightCPText: store.getTiddlerText(pluginName + "##NightModeColorPalette"),
    // this helper may be more complex for custom theme
    getMainPaletteTitle: function() {
        return "ColorPalette"
    },
    dayPaletteTitle: "ColorPaletteDay",
    goNight: function() { // doesn't check or change the cookie-parameter

        var paletteTitle = this.getMainPaletteTitle()

        var dayPaletteTiddler = new Tiddler(this.dayPaletteTitle)
        var paletteTiddler = store.fetchTiddler(paletteTitle)
        dayPaletteTiddler.text = paletteTiddler ? paletteTiddler.text : "shadow"
        store.saveTiddler(dayPaletteTiddler)

        var nigthPaletteTiddler = new Tiddler(paletteTitle)
        nigthPaletteTiddler.text = this.nightCPText
        // attach the tiddler, recalc slices, invoke notifiers
        store.saveTiddler(nigthPaletteTiddler)

        this.adjustCss()
    },
    goDay: function() { // doesn't check or change the cookie-parameter

        var paletteTitle = this.getMainPaletteTitle()

        var dayPalette = store.fetchTiddler(this.dayPaletteTitle)
        store.deleteTiddler(this.dayPaletteTitle)
        if(dayPalette.text === "shadow")
            store.removeTiddler(paletteTitle) // to recalc slices of ColorPalette
        else {
            store.saveTiddler(paletteTitle, paletteTitle, dayPalette.text)
        }

        this.adjustCss()
    },
    isNight: function() {
        return !!store.fetchTiddler(this.dayPaletteTitle)
    },
    adjustCss: function() {
        var isNightMode = this.isNight()
        if(isNightMode) {
            applySectionCSS("TextBoxColors")
            applySectionCSS("~FewerColors")
        } else {
            removeStyleSheet("TextBoxColors")
            removeStyleSheet("~FewerColors")
        }
    },
    switchMode: function() {

        config.options.chkNightMode = !config.options.chkNightMode

        if(config.options.chkNightMode)
            config.macros.switchNightMode.goNight()
        else
            config.macros.switchNightMode.goDay()

// "baking" doesn't work yet..
        if(saveOption)
            saveOption("chkNightMode")
        else
            saveOptionCookie("chkNightMode")

        refreshColorPalette()
    },
    init: function() {
        this.adjustCss()
        config.options.chkNightMode = this.isNight()
    },
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {

        var pParams = paramString.parseParams("anon", null, true, false, true)
        var label = getParam(pParams, "label", "switch")
        var tooltip = ""

        createTiddlyButton(place, label, tooltip, this.switchMode)
    }
}

// apply night mode if it was set previously
// (.init method of the macro shouldn't be used as it is invoked too late and would require refreshing)
if(isOsInDarkMode())
    config.options.chkNightMode = true
if(config.options.chkNightMode)
    config.macros.switchNightMode.goNight()

// detect OS mode change, apply
if(window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(event) {
        var macro = config.macros.switchNightMode
        var shouldGoDark = !!event.matches
        if(shouldGoDark !== macro.isNight()) macro.switchMode()
    })
}
//}}}
/***
!!!TextBoxColors
{{{
input, select,
textarea { color:[[ColorPalette::Foreground]]; background-color:[[ColorPalette::Background]]; }
}}}
!!!~FewerColors
{{{
.title, h1, h2, h3, h4, h5, h6
    { color:[[ColorPalette::PrimaryDark]]; }
}}}
!!!NightModeColorPalette
Background: #000
Foreground: #fff
~PrimaryPale: #730
~PrimaryLight: #e70
~PrimaryMid: #fb4
~PrimaryDark: #feb
~SecondaryPale: #003
~SecondaryLight: #017
~SecondaryMid: #24b
~SecondaryDark: #7be
~TertiaryPale: #111
~TertiaryLight: #333
~TertiaryMid: #666
~TertiaryDark: #999
Error: #f44
!!!
***/
