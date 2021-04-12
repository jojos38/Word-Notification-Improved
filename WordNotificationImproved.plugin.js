/**
 * @name WordNotificationImproved
 * @author jojos38 (jojos38#1337) / Original idea by Qwerasd
 * @description Notifiy the user when a specific word is said in a server
 * @version 0.0.2
 * @invite DXpb9DN
 * @authorId 137239068567142400
 * @authorLink https://steamcommunity.com/id/jojos38
 * @donate DM me on Discord for Paypal link
 * @patreon https://www.patreon.com/jojos38/creators
 * @website https://github.com/jojos38
 * @source https://raw.githubusercontent.com/jojos38/Word-Notification-Improved/master/WordNotificationImproved.plugin.js
 * @updateUrl https://raw.githubusercontent.com/jojos38/Word-Notification-Improved/master/WordNotificationImproved.plugin.js
**/

module.exports = (_ => {
	const config = {
		"info": {
			name: "Word Notification Improved",
			id: "WordNotificationImproved",
			author: "jojos38",
			version: "0.0.2",
			description: "Notifiy the user when a specific word is said in a server"
		}
	};

	// ======================================================= ======================== ======================================================= //
	// ------------------------------------------------------- BDFDB STUFF, NOT MY CODE ------------------------------------------------------- //
	// ======================================================= ======================== ======================================================= //
	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && b.indexOf(`* @name BDFDB`) > -1) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin, try again later or download it manually from GitHub: https://github.com/mwittrien/BetterDiscordAddons/tree/master/Library/");
			});
		}
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${config.info.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => { delete window.BDFDB_Global.downloadModal; this.downloadLibrary(); }
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(config.info.id)) window.BDFDB_Global.pluginQueue.push(config.info.id);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${config.info.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		
		
		// ======================================================= =============== ======================================================= //
		// ------------------------------------------------------- CODE START HERE ------------------------------------------------------- //
		// ======================================================= =============== ======================================================= //
		var settings;
		const electron = require('electron');	
		const defaultSettings = {
			"white-list-words": [],
			"bdfdb-notification": true,
			"bdapi-notification": false,
			"ignore-private-messages": false,
			"ignore-muted-channels": false,
			"ignore-blocked-users": true,
			"ignore-if-focused": true,
			"case-sensitive": false,
			"ignore-muted-servers": false,
			"private-messages-only": false,
			"black-listed-servers": [],
			"black-listed-users": [],
			"bdapi-display-time": 5.0,
			"bdfdb-display-time": 5.0,
			"windows-notification": false,
			"windows-notification-focus": true
		}

		function parseList(list) {
			var words = list.split(',,').map(e => e.trim());
			return words;
		}

		function saveSetting(key, value) {
			settings[key] = typeof value == "string" ? parseList(value) : value;
			BdApi.saveData(config.info.id, "settings", settings);
		}

		function getSetting(key) {
			return BdApi.loadData(config.info.id, key);
		}

		return class WordNotificationImproved extends Plugin {
			// Required function. Called when the plugin is activated (including after reloads)
			start() {
				if (!global.ZeresPluginLibrary) return window.BdApi.alert("Library Missing",`The library plugin needed for ${config.info.name} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);
				ZLibrary.PluginUpdater.checkForUpdate(config.info.id, config.info.version, "LINK_TO_RAW_CODE");
				this.getChannelById = BdApi.findModuleByProps('getChannel').getChannel;
				this.getServerById = BdApi.findModuleByProps('getGuild').getGuild;
				this.isBlocked = BdApi.findModuleByProps('isBlocked').isBlocked;
				this.isMuted = BdApi.findModuleByProps('isGuildOrCategoryOrChannelMuted').isGuildOrCategoryOrChannelMuted.bind(BdApi.findModuleByProps('isGuildOrCategoryOrChannelMuted'));
				this.cancelPatch = BdApi.monkeyPatch(BdApi.findModuleByProps("dispatch"), 'dispatch', { after: this.messageReceived.bind(this) });
				this.selfID = BdApi.findModuleByProps('getId').getId();
				this.currentChannel = BdApi.findModuleByProps("getChannelId").getChannelId;
				this.checkSettings();
				this.checkChangelog();
			}
			
			checkSettings() {
				settings = getSetting("settings") || {};
				for (const [name, value] of Object.entries(defaultSettings)) {
					if (settings[name] == null) settings[name] = value;
				}
			}

			// Required function. Called when the plugin is deactivated
			stop() { this.cancelPatch(); }
			
			goToMessage(server, channel, message) {
				require('electron').remote.getCurrentWindow().focus();
				this.transitionTo(`/channels/${server ? server : '@me'}/${channel}/${message}`);
				requestAnimationFrame(() => this.transitionTo(`/channels/${server ? server : '@me'}/${channel}/${message}`));
			}
			
			messageReceived(data) {
				const words = settings["white-list-words"]; // Get the words
				if (!words) return;
				if (!words.length) return;
				if (data.methodArguments[0].type != 'MESSAGE_CREATE' && data.methodArguments[0].type != 'MESSAGE_UPDATE') return;
				if (data.methodArguments[0].optimistic) return;

				const blacklistedUsers = settings["black-listed-users"];
				const blacklistedServers = settings["black-listed-servers"];
				const message = data.methodArguments[0].message;
				const author = message.author || {};
				const channel = this.getChannelById(message.channel_id);
				const guild = this.getServerById(message.guild_id);

				// Ignore muted guilds?
				if (settings["ignore-muted-servers"]) if (this.isMuted(message.guild_id)) return;

				// Ignore muted channels?
				if (settings["ignore-muted-channels"]) if (this.isMuted(message.channel_id)) return;

				// Ignore self
				if (author.id == this.selfID) return;

				// Private messages only?
				if (settings["private-messages-only"]) if (message.guild_id) return;

				// Ignore blocked users?
				if (settings["ignore-blocked-users"]) if (this.isBlocked(author.id)) return;

				// Exclude private messages?
				if (settings["ignore-private-messages"]) if (!message.guild_id) return;

				// Ignore if the channel is focused
				if (settings["ignore-if-focused"]) if (this.currentChannel() == message.channel_id && electron.remote.getCurrentWindow().isFocused()) return;

				// Check blacklisted users
				if (blacklistedUsers.includes(author.id)) return;
				
				// Check blacklisted servers
				if (blacklistedServers.includes(message.guild_id)) return;

				var notifWord = "";
				var shouldNotify = false;
				const content = settings["case-sensitive"] ? message.content.toLowerCase() : message.content;
				if (!content) return;
				for (let word of words) { // For each word
					// Check if it's a Regex
					var match = word.match(new RegExp('^/(.*?)/([gimy]*)$'));
					try { if (match) word = new RegExp(match[1], match[2]); } catch(error) {}
					
					// Check if the message contains the word or the regex
					if (typeof word === "string") {
						if (settings["case-sensitive"]) word = word.toLowerCase();
						if (content.includes(word)) { notifWord = word; shouldNotify = true; }
					} else {
						var wordMatch = content.match(word);
						if (wordMatch) { notifWord = wordMatch; shouldNotify = true; }
					}
				}

				if (!shouldNotify) return;
				
				const channelName = channel ? (channel.name == "" ? "conversation" : "#" + channel.name) : "private messages";
				const guildName = guild ? guild.name : "private messages";
				const toastString = author.username + " just said \"" + notifWord + "\" in channel " + (channelName || "private messages") + " of " + guildName;
				
				if (settings["windows-notification"]) {
					var skip = false;
					if (settings["windows-notification-focused"] && electron.remote.getCurrentWindow().isFocused()) skip = true;
					if (!skip) {
						const notification = new Notification(
							"The word " + notifWord + " was said",
							{ body: "In channel " + channelName + " of " + guildName + "\n" + author.username + ": " + content });
						notification.addEventListener('click', _ => {
							this.goToMessage(guild.id, channel.id, message.id);
						});
					}
				}
				
				if (settings["bdapi-notification"]) {
					const timeout = settings["bdapi-display-time"];
					BdApi.showToast(toastString, { timeout: timeout*1000, type: "info" });
				}
				
				if (settings["bdfdb-notification"]) {
					const timeout = settings["bdfdb-display-time"];
					BDFDB.NotificationUtils.toast(toastString, {type: "info", timeout: timeout*1000});
				}
			}
			
			// This function is used to check if a new update was out and show the changelog of it
			checkChangelog() {
				const version = BdApi.loadData(config.info.id, "version");
				if (version != config.info.version) {
					window.BdApi.alert(config.info.name + " changelog", "First release!\n Be sure to check the settings (Discord's settings,-> plugins -> " + config.info.name + ")");
					BdApi.saveData(config.info.id, "version", config.info.version);	
				}
			}

			// No idea what the first parameter is supposed to be, it's always null
			settingChanged(p1, id, value) {
				saveSetting(id, value);
			}
			
			newSwitch(name, desc, id) {
				const tmpSwitch = new ZeresPluginLibrary.Settings.Switch(name, desc, settings[id]);
				tmpSwitch.id = id;
				return tmpSwitch;
			}
			
			newSlider(name, desc, min, max, id, options) {
				const tmpSlider = new ZeresPluginLibrary.Settings.Slider(name, desc, min, max, settings[id],  null, options);
				tmpSlider.id = id;
				return tmpSlider;
			}

			newTextBox(name, desc, id, options) {
				var content = "";
				for (let word of settings[id]) content += ",," + word;
				content = content.slice(2);
				const tmpTextbox = new ZeresPluginLibrary.Settings.Textbox(name, desc, content, null, options);
				tmpTextbox.id = id;
				return tmpTextbox;
			}

			getSettingsPanel () {
				const list = [];		
				const mainSettings = new ZeresPluginLibrary.Settings.SettingGroup("Main settings");
				const notificationSettings = new ZeresPluginLibrary.Settings.SettingGroup("Notifications settings");
				const mainSettingsMenu = [
					this.newTextBox(
						"Words to check", // Title
						"The list of words that should notify you. Supports Regex (example: Hello,,/myregex/g,,Bye)", // Desc
						"white-list-words", // Identifier
						{ placeholder: "Your words here separated by TWO comma" }
					),
					this.newSwitch(
						"Case sensitive",
						"Should the list of words to check be case sensitive or not (does not affect Regex)",
						"case-sensitive"
					),
					this.newSwitch(
						"Ignore muted servers", // Title
						null, // Description
						"ignore-muted-servers" // Identifier
					),
					this.newSwitch(
						"Ignore muted channels",
						null,
						"ignore-muted-channels"
					),
					this.newSwitch(
						"Ignore private messages",
						null,
						"ignore-private-messages"
					),
					this.newSwitch(
						"Ignore blocked users",
						null,
						"ignore-blocked-users",
					),
					this.newSwitch(
						"Ignore if window focused and on channel",
						"You will not get notified if the Discord's window is focused and you are on the channel",
						"ignore-if-focused",
					),
					this.newSwitch(
						"Private messages only",
						"This will only check private messages and ignore everything else",
						"private-messages-only"
					),
					this.newTextBox(
						"Blacklisted servers", // Title
						"Those servers will be ignored (put in IDs)", // Desc
						"black-listed-servers", // Identifier
						{ placeholder: "Your servers ID here separated by TWO comma (example: 501558901657305098,,201458801257605791)" }
					),
					this.newTextBox(
						"Blacklisted users", // Title
						"Those users will be ignored (put in IDs)", // Desc
						"black-listed-users", // Identifier
						{ placeholder: "Your users ID here separated by TWO comma (example: 501558901657305098,,201458801257605791)" }
					)
				];
				const notificationSettingsMenu = [
					this.newSwitch(
						"Send Windows notification", // Title
						"Shows a Windows notification", // Desc
						"windows-notification" // Identifier
					),
					this.newSwitch(
						"Windows notification only when not focused", // Title
						"Shows a Windows notification ONLY when Discord's window is not focused", // Desc
						"windows-notification-focus" // Identifier
					),
					this.newSwitch(
						"Send BdApi Discord notification",
						"Shows a BdApi notification (at the bottom middle of Discord's window)",
						"bdapi-notification",
						true
					),
					this.newSlider(
						"BdApi notification display time", // Title
						null, // Desc
						1, 30, // Min max
						"bdapi-display-time", // Identifier
						{
							markers: [1, 5, 10, 15, 20, 25, 30],
							units: " seconds",
						}
					),
					this.newSwitch(
						"Send BDFDB notification",
						"Shows a BDFDB notification (at the top right of Discord's window)",
						"bdfdb-notification"
					),
					this.newSlider(
						"BDFDB notification display time",
						null,
						1, 30,
						"bdfdb-display-time",
						{
							markers: [1, 5, 10, 15, 20, 25, 30],
							units: " seconds",
						}
					)
				];
				mainSettings.append(...mainSettingsMenu);
				notificationSettings.append(...notificationSettingsMenu);
				list.push(mainSettings);
				list.push(notificationSettings);
				return ZeresPluginLibrary.Settings.SettingPanel.build(this.settingChanged, ...list);
			}
		}
	})(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();
