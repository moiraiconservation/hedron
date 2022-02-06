///////////////////////////////////////////////////////////////////////////////
// menu.js ////////////////////////////////////////////////////////////////////

const { app, dialog } = require('electron');

///////////////////////////////////////////////////////////////////////////////
// MODULE /////////////////////////////////////////////////////////////////////

module.exports = {

	create_menu(win) {
		return [
			{
				label: 'File',
				submenu: [

					{
						id: 'open_signalink',
						label: 'Open SignaLink File...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								filters: [
									{ name: 'MS Excel', extensions: ['xls', 'xlsx', 'csv'] },
									{ name: 'Text', extensions: ['txt'] },
									{ name: 'All Files', extensions: ['*'] }
								],
								properties: ['openFile']
							})
								.then((response) => {
									if (!response.canceled) {
										win.main.webContents.send('toRender', { command: 'bounce', subcommand: 'open_signalink', success: true, data: response });
									}
								});
						}
					},

					{
						id: 'open_drugbank_target_polypeptides',
						label: 'Open DrugBank Target Polypeptides File...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								filters: [
									{ name: 'MS Excel', extensions: ['xls', 'xlsx', 'csv'] },
									{ name: 'Text', extensions: ['txt'] },
									{ name: 'All Files', extensions: ['*'] }
								],
								properties: ['openFile']
							})
								.then((response) => {
									if (!response.canceled) {
										win.main.webContents.send('toRender', { command: 'bounce', subcommand: 'open_drugbank_target_polypeptides', success: true, data: response });
									}
								});
						}
					},

					{
						id: 'open_drugbank_vocabulary',
						label: 'Open DrugBank Vocabulary File...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								filters: [
									{ name: 'MS Excel', extensions: ['xls', 'xlsx', 'csv'] },
									{ name: 'Text', extensions: ['txt'] },
									{ name: 'All Files', extensions: ['*'] }
								],
								properties: ['openFile']
							})
								.then((response) => {
									if (!response.canceled) {
										win.main.webContents.send('toRender', { command: 'bounce', subcommand: 'open_drugbank_vocabulary', success: true, data: response });
									}
								});
						}
					},

					{ type: 'separator' },

					{ label: 'Exit', click() { app.quit() } }

				]
			},

			{
				label: 'Debug',
				submenu: [
					{ label: 'Developer Console', click() { win.main.webContents.openDevTools({ mode: 'detach' }) } }
				]
			}
		]
	}

}