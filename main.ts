import { App, Editor, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface PluginSettings {
	embedMode: embedMode
	frameBorder: boolean
}

enum embedMode {
	clipboard = "Clipboard",
	highlighted = "Highlighted",
}

const DEFAULT_SETTINGS: PluginSettings = {
	embedMode: embedMode.clipboard,
	frameBorder: false
}

export default class YoutubeEmbed extends Plugin {
	settings: PluginSettings

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		this.addCommand({
			id: "embed-youtube-video",
			name: "Embed Youtube Video",
			hotkeys: [
				{
					modifiers: ["Meta", "Alt"],
					key: "E"
				}
			],
			editorCallback: (editor: Editor) => {
				this.embed(editor)
			},
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async embed(editor: Editor) {
		let input: string = ""

		switch (this.settings.embedMode) {
			case embedMode.clipboard:
				input = await navigator.clipboard.readText();
				this.genrateIFrame(input)
					.then(x => editor.replaceRange(x, editor.getCursor()))
					.catch(err => new Notice(err))

				break;

			case embedMode.highlighted:
				input = editor.getSelection()
				this.genrateIFrame(input)
					.then(x => editor.replaceSelection(x, editor.getSelection()))
					.catch(err => new Notice(err))

				break;
		}
	}

	async genrateIFrame(input: string): Promise<string> {
		const regExp: RegExp = new RegExp(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/img)
		const matches: RegExpExecArray = regExp.exec(input)

		if (matches != null) {
			const id: string = matches[6]

			if (id) {
				const iFrame: string = `<iframe src="https://www.youtube.com/embed/${id}" height="113" width="200" style="aspect-ratio: 1.76991 / 1; width: 100%; height: 100%;" frameborder=${Number(this.settings.frameBorder)}></iframe>`

				return Promise.resolve(iFrame)
			}
		}

		return Promise.reject("Not Valid Youtube Link")
	}
}

class SettingsTab extends PluginSettingTab {
	plugin: YoutubeEmbed;

	constructor(app: App, plugin: YoutubeEmbed) {
		super(app, plugin);
		this.plugin = plugin;
	}


	display(): void {
		const containerEl: HTMLElement = this.containerEl;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Youtube Embed Settings' });

		new Setting(containerEl)
			.setName('Embed Mode')
			.addDropdown(dropdown => dropdown
				.addOption(embedMode.clipboard, embedMode.clipboard)
				.addOption(embedMode.highlighted, embedMode.highlighted)
				.setValue(this.plugin.settings.embedMode)
				.onChange(async (value: string) => {
					this.plugin.settings.embedMode = value as embedMode
					await this.plugin.saveSettings()
				}));

		new Setting(containerEl)
			.setName("Frame Border")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.frameBorder)
				.onChange(async (value: boolean) => {
					this.plugin.settings.frameBorder = value
					await this.plugin.saveSettings()
				}));
	}
}
