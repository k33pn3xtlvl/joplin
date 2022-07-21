const { BaseCommand } = require('./base-command.js');
const { app } = require('./app.js');
const { _ } = require('@joplin/lib/locale');
const BaseModel = require('@joplin/lib/BaseModel').default;
const Folder = require('@joplin/lib/models/Folder').default;
const Note = require('@joplin/lib/models/Note').default;

class Command extends BaseCommand {
	usage() {
		return 'mv <item> [notebook]';
	}

	description() {
		return _('Moves the given <item> (notes matching pattern in current notebook or one notebook) to [notebook]. If <item> is subnotebook and [notebook] is "root", will make <item> parent notebook');
	}

	async action(args) {
		const pattern = args['item'];
		const destination = args['notebook'];
		let folder = null;

		if (destination !== 'root') {
			folder = await app().loadItem(BaseModel.TYPE_FOLDER, destination);
			if (!folder) throw new Error(_('Cannot find "%s".', destination));
		}

		const dstDups = await Folder.search({ titlePattern: destination, limit: 2 });
		if (dstDups.length > 1) {
			throw new Error(_('Ambiguous notebook "%s". Please use notebook id instead - look for parent id in metadata', destination));
		}

		const itemFolder = await app().loadItem(BaseModel.TYPE_FOLDER, pattern);
		if (itemFolder) {
			const srcDups = await Folder.search({ titlePattern: pattern, limit: 2 });
			if (srcDups.length > 1) {
				throw new Error(_('Ambiguous notebook "%s". Please use notebook id instead - look for parent id in metadata or use $b for current', pattern));
			}
			if (destination === 'root') {
				await Folder.moveToFolder(itemFolder.id, '');
			} else {
				await Folder.moveToFolder(itemFolder.id, folder.id);
			}
		} else {
			const notes = await app().loadItems(BaseModel.TYPE_NOTE, pattern);
			if (notes.length === 0) throw new Error(_('Cannot find "%s".', pattern));
			for (let i = 0; i < notes.length; i++) {
				await Note.moveToFolder(notes[i].id, folder.id);
			}
		}
	}
}

module.exports = Command;
