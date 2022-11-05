/***
|''Name''|NightModePlugin|
|''Description''|This plugin introduces the {{{switchNightMode}}} macro that allows to switch "day mode" and "night mode" styles|
|''Version''|0.11.1|
|''~CoreVersion''||
|''Author''|Yakov Litvin|
!!!Syntax
{{{
<<switchNightMode label:"try this">>
}}}
!!!Demo
<<switchNightMode label:"try this">>
!!!Code
***/
//{{{
var applySectionCSS = function(section) {
    var text = store.getRecursiveTiddlerText("NightModePlugin##" + section, "", 1)
    text = text.substring(3, text.length - 3)
    return setStylesheet(text, section)
};

config.macros.switchNightMode = {
    nightCPText: store.getTiddlerText("NightModePlugin##NightModeColorPalette"),
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
            store.saveTiddler(paletteTitle, paletteTitle, dayPaletteText)
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
};

function isOsInDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

// apply night mode if it was set previously
// (.init method of the macro shouldn't be used as it is invoked too late and would require refreshing)
if(isOsInDarkMode())
    config.options.chkNightMode = true
if(config.options.chkNightMode)
    config.macros.switchNightMode.goNight()
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
