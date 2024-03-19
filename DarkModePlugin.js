/***
|Name       |DarkModePlugin|
|Description|This plugin introduces "dark mode" (changes styles) and switching it by the {{{darkMode}}} macro and operating system settings|
|Documentation|https://yakovl.github.io/TiddlyWiki_DarkModePlugin/|
|Version    |1.3.2|
|Author     |Yakov Litvin|
|Source     |https://github.com/YakovL/TiddlyWiki_DarkModePlugin/blob/master/DarkModePlugin.js|
|License    |[[MIT|https://github.com/YakovL/TiddlyWiki_YL_ExtensionsCollection/blob/master/Common%20License%20(MIT)]]|
!!!Demo
<<darkMode>>
<<darkMode label:"☀️/🌘">>
!!!Syntax
{{{
<<darkMode>> (<<switchNightMode>> also works, for backward compatibility)
<<darkMode label:"☀️/🌘">>
}}}
!!!Installation
Is as usual: import or copy the plugin with the {{{systemConfig}}} tag, reload. Note: for the plugin to work correctly, you should keep its name (DarkModePlugin).

!!!Optional configuration
When the dark mode is applied, the {{{darkMode}}} class is added to the {{{html}}} element. This allows to add ''styles for dark mode'' only, like this:
{{{
.darkMode code { color:red }
code { color: green }
}}}
Ordinary styles are applied to both modes, but {{{.darkMode}}} ones have higher precedence and "overwrite" the oridinary ones.

The palette applied for the dark mode can be ''customized'' by editing ColorPaletteDark (removing it restores the default values).

!!!Additional notes
Styles of some browser interface bits (like <html><button class="button" onclick='alert("this is known as an alert")'>alert</button</html>) are only affected by OS/browser's "dark mode"/theme, so for good UI it is recommended to switch OS dark mode (DarkModePlugin will follow). For Windows users, [[switching by hotkey|https://superuser.com/a/1724237/576393]] may be useful.

The plugin ''adds extra styles'' (see ~FollowDarkMode and ~FewerColors sections) which are not yet configurable.

The option {{{chkDarkMode}}} is now ''deprecated'': later it will be either removed or re-implemented.
!!!Code
***/
//{{{
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

	// setDark, setLight, and applyAdjustments are "governed outside": they don't check or change the cookie-parameter
	setDark: function() {
		var paletteTitle = this.getMainPaletteTitle()

		var lightPaletteTiddler = new Tiddler(this.lightPaletteTitle)
		lightPaletteTiddler.text = store.getTiddlerText(paletteTitle) || "shadow"
		store.saveTiddler(lightPaletteTiddler)

		var darkPaletteTiddler = new Tiddler(paletteTitle)
		darkPaletteTiddler.text = this.getDarkPaletteText()
		// attach the tiddler, recalc slices, invoke notifiers
		store.saveTiddler(darkPaletteTiddler)

		this.applyAdjustments(true)
	},
	setLight: function() {
		var paletteTitle = this.getMainPaletteTitle()

		var lightPaletteText = store.getTiddlerText(this.lightPaletteTitle)
		if(!lightPaletteText || lightPaletteText === "shadow")
			store.removeTiddler(paletteTitle) // to recalc slices of ColorPalette
		else
			store.saveTiddler(paletteTitle, paletteTitle, lightPaletteText)

		store.deleteTiddler(this.lightPaletteTitle)

		this.applyAdjustments(false)
	},
	applySectionCSS: function(sectionName) {
		var sectionText = store.getRecursiveTiddlerText(this.pluginName + "##" + sectionName, "", 1)
		var css = sectionText.replace(/^\s*{{{((?:.|\n)*?)}}}\s*$/, "$1")
		return setStylesheet(css, sectionName)
	},
	applyAdjustments: function(isDarkMode) {
		if(isDarkMode) {
			jQuery('html').addClass('darkMode')
			this.applySectionCSS("FollowDarkMode")
			this.applySectionCSS("~FewerColors")
		} else {
			jQuery('html').removeClass('darkMode')
			removeStyleSheet("FollowDarkMode")
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
	followOsMode: function(followLight) {
		// old browsers may fail to detect
		var isOsDarkModeDetected = window.matchMedia &&
			window.matchMedia('(prefers-color-scheme: dark)').matches

		if(isOsDarkModeDetected && !this.isDarkMode()) {
			config.options[this.optionName] = false
			this.switchMode()
		}

		if(!isOsDarkModeDetected && this.isDarkMode() && followLight) {
			config.options[this.optionName] = true
			this.switchMode()
		}
	},
	restoreSavedMode: function() {
		if(!this.isDarkMode()) return

		// TODO: check if styles are really missing (avoid applying twice)
		this.applyAdjustments(true)
		config.options[this.optionName] = true
	},
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		var pParams = paramString.parseParams("anon", null, true, false, true)
		var label = getParam(pParams, "label", "switch")
		var tooltip = ""

		createTiddlyButton(place, label, tooltip, this.switchMode)
	}
}

// We avoid using .init to support installation via SharedTiddlersPlugin, TiddlerInFilePlugin, and reinstalling via CookTiddlerPlugin.
// This also helps to avoid extra refreshing.
;(function(macro) {
	// Save the palette as shadow so that one can cusomize it
	config.shadowTiddlers[macro.darkPaletteTitle] =
		store.getTiddlerText(macro.pluginName + "##DarkModeColorPalette")

	// Set dark mode on start if OS dark mode is set or dark mode was saved previously
	macro.followOsMode(false)
	macro.restoreSavedMode()

	// install only once
	if(!config.extensions.DarkModePlugin) {
		// prevent sites to ask about unsaved changes after switching mode
		config.extensions.DarkModePlugin = {
			orig_confirmExit: confirmExit
		}
		window.confirmExit = function() {
			if(readOnly) return
			return config.extensions.DarkModePlugin.orig_confirmExit ?
				config.extensions.DarkModePlugin.orig_confirmExit() : undefined
		}

		// Detect OS mode change, apply
		if(window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)')
			.addEventListener('change', function(event) { macro.followOsMode(true) })
	}
})(config.macros.darkMode)
//}}}
/***
!!!FollowDarkMode
{{{
input, select, textarea {
	color:[[ColorPalette::Foreground]];
	background-color:[[ColorPalette::Background]];
}

.darkMode {
	color-scheme: dark;
}
}}}
!!!~FewerColors
{{{
.title, h1, h2, h3, h4, h5, h6 {
	color: [[ColorPalette::PrimaryDark]];
}
::selection {
	background: [[ColorPalette::TertiaryMid]];
}
}}}
!!!DarkModeColorPalette
Background: #000
Foreground: #ddd
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
