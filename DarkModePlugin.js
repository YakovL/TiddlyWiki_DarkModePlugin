/***
|''Name''|DarkModePlugin|
|''Description''|This plugin introduces "dark mode" (changes styles) and switching it by the {{{darkMode}}} macro and operating system settings|
|''Version''|1.0.0|
|''Source''|https://github.com/YakovL/TiddlyWiki_DarkModePlugin/blob/master/DarkModePlugin.js|
|''Author''|Yakov Litvin|
!!!Syntax
{{{
<<darkMode>>
<<switchNightMode>> (backward compatibility)
<<darkMode label:"☀️/🌘">>
}}}
!!!Demo
<<darkMode>>
<<switchNightMode>> (backward compatibility)
<<darkMode label:"☀️/🌘">>
!!!Additional notes
The palette applied for the dark mode can be customized by editing ColorPaletteDark (removing it restores the default values).
!!!Code
***/
//{{{
var applySectionCSS = function(pluginName, sectionName) {
    var sectionText = store.getRecursiveTiddlerText(pluginName + "##" + sectionName, "", 1)
    var css = sectionText.replace(/^\s*{{{((?:.|\n)*?)}}}\s*$/, "$1")
    return setStylesheet(css, sectionName)
}

// when a browser doesn't support detection, returns falsy
var isOsInDarkMode = function() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

config.macros.switchNightMode = // backward compatibility
config.macros.darkMode = {
    pluginName: "DarkModePlugin",
    optionName: "chkDarkMode",
    getDarkPaletteText: function() {
        return store.getTiddlerText(this.darkPaletteTitle)
    },
    // this helper may become more complex for custom themes
    getMainPaletteTitle: function() {
        return "ColorPalette"
    },
    lightPaletteTitle: "ColorPaletteLight",
    darkPaletteTitle: "ColorPaletteDark",

    // setDark, setLight, and adjustCss are "governed outside": they don't check or change the cookie-parameter
    setDark: function() {
        var paletteTitle = this.getMainPaletteTitle()

        var dayPaletteTiddler = new Tiddler(this.lightPaletteTitle)
        var paletteTiddler = store.fetchTiddler(paletteTitle)
        dayPaletteTiddler.text = paletteTiddler ? paletteTiddler.text : "shadow"
        store.saveTiddler(dayPaletteTiddler)

        var nigthPaletteTiddler = new Tiddler(paletteTitle)
        nigthPaletteTiddler.text = this.getDarkPaletteText()
        // attach the tiddler, recalc slices, invoke notifiers
        store.saveTiddler(nigthPaletteTiddler)

        this.adjustCss(true)
    },
    setLight: function() {
        var paletteTitle = this.getMainPaletteTitle()

        var dayPalette = store.fetchTiddler(this.lightPaletteTitle)
        store.deleteTiddler(this.lightPaletteTitle)
        if(dayPalette.text === "shadow")
            store.removeTiddler(paletteTitle) // to recalc slices of ColorPalette
        else {
            store.saveTiddler(paletteTitle, paletteTitle, dayPalette.text)
        }

        this.adjustCss(false)
    },
    adjustCss: function(isDarkMode) {
        if(isDarkMode) {
            applySectionCSS(this.pluginName, "TextBoxColors")
            applySectionCSS(this.pluginName, "~FewerColors")
        } else {
            removeStyleSheet("TextBoxColors")
            removeStyleSheet("~FewerColors")
        }
    },

    // "governance" methods
    isDarkMode: function() {
        return !!store.fetchTiddler(this.lightPaletteTitle)
    },
    switchMode: function() {
        var me = config.macros.darkMode
        config.options[me.optionName] = !config.options[me.optionName]

        config.options[me.optionName] ? me.setDark() : me.setLight()

// "baking" doesn't work yet..
        if(saveOption)
            saveOption(me.optionName)
        else
            saveOptionCookie(me.optionName)

        refreshColorPalette()
    },
    init: function() {
        var me = config.macros.darkMode
        config.shadowTiddlers[me.darkPaletteTitle] = store.getTiddlerText(me.pluginName + "##DarkModeColorPalette")

        var isDarkMode = me.isDarkMode()
        me.adjustCss(isDarkMode)
        config.options[me.optionName] = isDarkMode

        // detect OS mode change, apply
        if(window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',
            function(event) {
                var shouldSetDark = !!event.matches
                if(shouldSetDark !== me.isDarkMode()) me.switchMode()
            })
        }
    },
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        var pParams = paramString.parseParams("anon", null, true, false, true)
        var label = getParam(pParams, "label", "switch")
        var tooltip = ""

        createTiddlyButton(place, label, tooltip, this.switchMode)
    }
}

// apply dark mode if it was set previously
// (.init method of the macro shouldn't be used as it is invoked too late and would require refreshing)
if(isOsInDarkMode())
    config.options[this.optionName] = true
if(config.options[this.optionName])
    config.macros.darkMode.setDark()
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
!!!DarkModeColorPalette
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
