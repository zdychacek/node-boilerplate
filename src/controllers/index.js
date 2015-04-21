import fs from 'fs';
import path from 'path';

/**
 * Register all controllers with provided API
 * @param  {Object} API API mount point
 */
export default function registerControllers (API) {
	fs.readdirSync(__dirname)
		.filter((fileName) => fileName.endsWith('Ctrl.js'))
		.forEach((fileName) => {
			const ctrlFilePath = path.join(__dirname, fileName);

			require(ctrlFilePath).default(API);
		});
}
