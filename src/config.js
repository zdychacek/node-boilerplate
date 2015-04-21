require('source-map-support').install();
import 'gulp-traceur/node_modules/traceur/bin/traceur-runtime';
import 'es6-shim';

export default {
	http: {
		port: 8080
	}
};
