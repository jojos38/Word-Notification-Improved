/**
 * @name WordNotificationImproved
 * @author jojos38 (jojos38#1337) / Original idea by Qwerasd
 * @description Notifiy the user when a specific word is said in a server
 * @version 0.1.0
 * @invite DXpb9DN
 * @authorId 137239068567142400
 * @authorLink https://steamcommunity.com/id/jojos38
 * @donate https://www.paypal.com/biz/fund?id=AR747SNG2H2XW
 * @patreon https://www.patreon.com/jojos38/creators
 * @website https://github.com/jojos38
 * @source https://raw.githubusercontent.com/jojos38/Word-Notification-Improved/master/WordNotificationImproved.plugin.js
 * @updateUrl https://raw.githubusercontent.com/jojos38/Word-Notification-Improved/master/WordNotificationImproved.plugin.js
**/

module.exports = (_ => {
	const config = {
		"info": {
			name: "WordNotificationImproved",
			id: "WordNotificationImproved",
			author: "jojos38",
			version: "0.1.0",
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
		const defaultSettings = {
			"white-list-words": [],
			"bdfdb-notification": true,
			"bdapi-notification": false,
			"ignore-private-messages": false,
			"ignore-emotes": false,
			"ignore-muted-channels": false,
			"ignore-blocked-users": true,
			"ignore-if-focused": true,
			"case-sensitive": false,
			"ignore-muted-servers": false,
			"private-messages-only": false,
			"white-listed-servers": [],
			"black-listed-servers": [],
			"black-listed-users": [],
			"black-listed-channels": [],
			"use-white-list": false,
			"bdapi-display-time": 5.0,
			"bdfdb-display-time": 5.0,
			"windows-notification": false,
			"windows-notification-focused": true,
			"dm-toast": ["{{username}} just said \"{{trigger-word}}\" in a private message"],
			"guild-toast": ["{{username}} just said \"{{trigger-word}}\" in channel #{{channel}} of {{guild}}"],
			"dm-windows": ["The word \"{{trigger-word}}\" was said in a private message.\\n{{username}}: {{message}}"],
			"guild-windows": ["The word \"{{trigger-word}}\" was said in channel #{{channel}} of {{guild}}\\n{{username}}: {{message}}"]
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
			return BdApi.Data.load(config.info.id, key);
		}

		return class WordNotificationImproved extends Plugin {
			// Required function. Called when the plugin is activated (including after reloads)

			start() {				
				const that = this;
				this.messageReceivedOrUpdated = function(data) { that.messageReceived(data); };
				
				if (!global.ZeresPluginLibrary) return window.BdApi.alert("Library Missing",`The library plugin needed for ${config.info.name} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);
				ZLibrary.PluginUpdater.checkForUpdate(config.info.id, config.info.version, "LINK_TO_RAW_CODE");
				this.getChannelById = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("getChannel")).getChannel; // BdApi.findModuleByProps("getChannel", "hasChannel").getChannel;
				this.getServerById = ZeresPluginLibrary.DiscordModules.GuildStore.getGuild; // BdApi.findModuleByProps("getGuild").getGuild;
				this.isBlocked = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("isBlocked")).isBlocked; // BdApi.findModuleByProps("isBlocked").isBlocked;
				this.transitionTo = BdApi.Webpack.getModule((m) => typeof m === "function" && String(m).includes(`"transitionTo - Transitioning to "`), { searchExports: true });
				this.isMuted = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("isGuildOrCategoryOrChannelMuted")).isMuted;
				BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("dispatch")).subscribe("MESSAGE_CREATE", that.messageReceivedOrUpdated);
				BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("dispatch")).subscribe("MESSAGE_UPDATE", that.messageReceivedOrUpdated);
				this.selfID = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("getUser")).getCurrentUser().id;
				this.currentChannel = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("getVoiceChannelId")).getChannelId;
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
			stop() {
				BdApi.findModuleByProps("dispatch", "subscribe").unsubscribe("MESSAGE_CREATE", this.messageReceivedOrUpdated);
				BdApi.findModuleByProps("dispatch", "subscribe").unsubscribe("MESSAGE_UPDATE", this.messageReceivedOrUpdated);
			}

			goToMessage(server, channel, message) {
				this.transitionTo(`/channels/${server ? server : '@me'}/${channel}/${message}`);
				requestAnimationFrame(() => this.transitionTo(`/channels/${server ? server : '@me'}/${channel}/${message}`));
			}

			replaceVariables(string, guild, channel, author, message, notifWord) {
				if (!string) return "Please check Advanced Settings for Word Notification Improved"
							   string = string.replace(/\\n/g,       		"\n");
				if (guild)     string = string.replace(/{{guild}}/g,        guild);
				if (author)    string = string.replace(/{{username}}/g,  	author);
				if (channel)   string = string.replace(/{{channel}}/g, 	    channel);
				if (message)   string = string.replace(/{{message}}/g,      message);
				if (notifWord) string = string.replace(/{{trigger-word}}/g, notifWord);
				return string;
			}

			async messageReceived(data) {
				const words = settings["white-list-words"]; // Get the words
				if (!words) return;
				if (data.optimistic) return;

				const focused = document.hasFocus();
				const blacklistedUsers = settings["black-listed-users"];
				const blacklistedChannels = settings["black-listed-channels"];
				const blacklistedServers = settings["black-listed-servers"];
				const whitelistedServers = settings["white-listed-servers"];
				const message = data.message;
				const author = message.author || {};
				const channel = this.getChannelById(message.channel_id);
				const guild = this.getServerById(message.guild_id);
				const guildID = guild ? guild.id : null;

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
				if (settings["ignore-if-focused"]) if (this.currentChannel() == message.channel_id && focused) return;

				// Check blacklisted users
				if (blacklistedUsers.includes(author.id)) return;
				
				// Check blacklisted channels
				if (blacklistedChannels.includes(message.channel_id)) return;

				// Check blacklisted servers
				if (!settings['use-white-list'] && blacklistedServers.includes(message.guild_id)) return;

				// Check whitelisted servers
				else if (settings['use-white-list'] && !whitelistedServers.includes(message.guild_id)) return;

				// Check if message has something in it
				if (!message.content) return;

				// Get message content and check for case sensitivity
				let content = settings["case-sensitive"] ? message.content : message.content.toLowerCase();

				// If ignore emotes
				if (settings["ignore-emotes"]) content = content.replace(/<a{0,1}:[a-zA-Z0-9_.]{2,32}:[0-9]{18}>/g, "");

				// Check if any word from the list matches
				let notifWord = "";
				let shouldNotify = false;
				for (let word of words) { // For each word
					// Check if it's a Regex
					const match = word.match(new RegExp('^/(.*?)/([gimy]*)$'));
					try { if (match) word = new RegExp(match[1], match[2]); } catch(error) {}

					// Check if the message contains the word or the regex
					if (typeof word === "string") {
						if (!settings["case-sensitive"]) word = word.toLowerCase();
						if (content.includes(word)) { notifWord = word; shouldNotify = true; }
					} else {
						const wordMatch = content.match(word);
						if (wordMatch) { notifWord = wordMatch; shouldNotify = true; }
					}
				}
				if (!shouldNotify) return;

				// If it's a message in a guild
				if (message.guild_id) {
					var toastString = this.replaceVariables(settings["guild-toast"][0], guild.name, channel.name, author.username, message.content, notifWord);
					var windowsString = this.replaceVariables(settings["guild-windows"][0], guild.name, channel.name, author.username, message.content, notifWord);
				} else {
					var toastString = this.replaceVariables(settings["dm-toast"][0], null, null, author.username, message.content, notifWord);
					var windowsString = this.replaceVariables(settings["dm-windows"][0], null, null, author.username, message.content, notifWord);
				}

				// Should we send a Windows notification?
				if (settings["windows-notification"]) {
					// Send a notification only if not focused?
					let onlyNotFocused = settings["windows-notification-focused"];
					if ((!focused && onlyNotFocused) || !onlyNotFocused) {
						const notification = new Notification("Word Notification Improved", { body: windowsString });
						notification.addEventListener('click', _ => {
							this.goToMessage(guildID, channel.id, message.id);
						});
					}
				}

				// Should we send a bdapi notification?
				if (settings["bdapi-notification"]) {
					const timeout = settings["bdapi-display-time"];
					BdApi.showToast(toastString, { timeout: timeout*1000, type: "info" });
				}

				// Should we send a bdfdb notification?
				if (settings["bdfdb-notification"]) {
					const timeout = settings["bdfdb-display-time"];
					const toast = BDFDB.NotificationUtils.toast(toastString, {
						timeout: timeout*1000,
						barColor: BDFDB.UserUtils.getStatusColor("online", true),
						avatar: BDFDB.UserUtils.getAvatar(author.id)
					});
					toast.addEventListener("click", _ => { this.goToMessage(guildID, channel.id, message.id); });
				}
			}

			// This function is used to check if a new update was out and show the changelog of it
			checkChangelog() {
				const version = BdApi.loadData(config.info.id, "version");
				if (version != config.info.version) {
					window.BdApi.alert(config.info.name + " changelog", "Clicking on a notification now opens Discord to the channel");
					BdApi.Data.save(config.info.id, "version", config.info.version);
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

			newTextBox(name, desc, id, options, type) {
				var content = "";

				if (type == "list") {
					if (settings[id]) for (let word of settings[id]) content += ",," + word;
					content = content.slice(2);
				} else if (type == "message") {
					content = settings[id] || "";
				}

				const tmpTextbox = new ZeresPluginLibrary.Settings.Textbox(name, desc, content, null, options);
				tmpTextbox.id = id;
				return tmpTextbox;
			}

			getSettingsPanel() {
				const list = [];
				const mainSettings = new ZeresPluginLibrary.Settings.SettingGroup("Main settings");
				const notificationSettings = new ZeresPluginLibrary.Settings.SettingGroup("Notifications settings");
				const advancedSettings = new ZeresPluginLibrary.Settings.SettingGroup("Advanced settings");
				const mainSettingsMenu = [
					this.newTextBox(
						"Words to check", // Title
						"The list of words that should notify you, seperated by TWO commas. Supports Regex (example: Hello,,/myregex/g,,Bye)", // Desc
						"white-list-words", // Identifier
						{ placeholder: "Your words here separated by TWO comma" },
						"list"
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
						"Ignore emotes",
						null,
						"ignore-emotes"
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
						"These servers will be ignored (put in IDs)", // Desc
						"black-listed-servers", // Identifier
						{ placeholder: "The server IDs separated by TWO commas (example: 501558901657305098,,201458801257605791)" },
						"list"
					),
					this.newTextBox(
						"Blacklisted users", // Title
						"These users will be ignored (put in IDs)", // Desc
						"black-listed-users", // Identifier
						{ placeholder: "The user IDs separated by TWO commas (example: 501558901657305098,,201458801257605791)" },
						"list"
					),
					this.newTextBox(
						"Blacklisted channels", // Title
						"These channels will be ignored (put in IDs)", // Desc
						"black-listed-channels", // Identifier
						{ placeholder: "The channel IDs separated by TWO commas (example: 501558901657305098,,201458801257605791)" },
						"list"
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
						"Shows a Windows notification only when Discord's window is not focused", // Desc
						"windows-notification-focused" // Identifier
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
				const advancedSettingsMenu = [
					this.newSwitch(
						"Use a whitelist instead of a blacklist",
						"This will disallow every server but the ones whitelisted (Blacklist won't have any effect if you enable this!)",
						"use-white-list"
					),
					this.newTextBox(
						"Whitelisted servers",
						"Only those servers will trigger the notifications (put in IDs)",
						"white-listed-servers",
						{ placeholder: "Your servers ID here separated by TWO comma (example: 501558901657305098,,201458801257605791)" },
						"list"
					),
					this.newTextBox(
						"Customize the BdApi and BDFDB notification for DMs",
						"Variables: {{username}} {{message}} {{trigger-word}} \\n (line break)",
						"dm-toast",
						{},
						"message"
					),
					this.newTextBox(
						"Customize the BdApi and BDFDB notification for servers",
						"Variables: {{guild}} {{channel}} {{username}} {{message}} {{trigger-word}} \\n (line break)",
						"guild-toast",
						{},
						"message"
					),
					this.newTextBox(
						"Customize the Windows notification for DMs",
						"Variables: {{guild}} {{username}} {{channel}} {{message}} {{trigger-word}} \\n (line break)",
						"dm-windows",
						{},
						"message"
					),
					this.newTextBox(
						"Customize the Windows notification for servers",
						"Variables: {{username}} {{message}} {{trigger-word}} \\n (line break)",
						"guild-windows",
						{},
						"message"
					)
				];

				mainSettings.append(...mainSettingsMenu);
				notificationSettings.append(...notificationSettingsMenu);
				advancedSettings.append(...advancedSettingsMenu);
				list.push(mainSettings);
				list.push(notificationSettings);
				list.push(advancedSettings);
				return ZeresPluginLibrary.Settings.SettingPanel.build(this.settingChanged, ...list);
			}
		}
	})(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();
