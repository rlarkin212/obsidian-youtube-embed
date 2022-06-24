import { App, Editor, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface PluginSettings {
	mode: embedMode
}

enum embedMode {
	clipboard = "Clipboard",
	highlighted = "Highlighted",
}

const DEFAULT_SETTINGS: PluginSettings = {
	mode: embedMode.clipboard
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
		if (this.settings.mode == embedMode.clipboard) {
			const input = await navigator.clipboard.readText();
			const iFrame = await this.formatIFrame(input)

			if (iFrame != "") {
				editor.replaceRange(iFrame, editor.getCursor());
			} else {
				new Notice("Link was not a valid youtube watch link")
			}
		}

		if (this.settings.mode == embedMode.highlighted) {
			const input = editor.getSelection()
			const iFrame = await this.formatIFrame(input)

			if (iFrame != "") {
				editor.replaceSelection(iFrame, editor.getSelection())
			} else {
				new Notice("Link was not a valid youtube watch link")
			}
		}
	}

	async formatIFrame(input: string): Promise<string> {
		let iFrame = "";

		if (input.contains("https://www.youtube.com/")) {
			const url = input.split('?v=')[1]

			iFrame = `<iframe src="https://www.youtube.com/embed/${url}?feature=oembed" height="113" width="200" style="aspect-ratio: 1.76991 / 1; width: 100%; height: 100%;"></iframe>`
		}

		return iFrame;
	}
}

class SettingsTab extends PluginSettingTab {
	plugin: YoutubeEmbed;

	constructor(app: App, plugin: YoutubeEmbed) {
		super(app, plugin);
		this.plugin = plugin;
	}


	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Youtube Embed Settings' });
		new Setting(containerEl)
			.setName('Embed Mode')
			.addDropdown(dropdown => dropdown
				.addOption(embedMode.clipboard, embedMode.clipboard)
				.addOption(embedMode.highlighted, embedMode.highlighted)
				.setValue(this.plugin.settings.mode)
				.onChange(async (value: string) => {
					this.plugin.settings.mode = value as embedMode
					await this.plugin.saveSettings()
				}));
	}
}
