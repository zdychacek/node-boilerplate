import config from './config';
import koa from 'koa';
import Router from 'koa-router';
import mount from 'koa-mount';
import bodyParser from 'koa-bodyparser';
import compress from 'koa-compress';
import assert from 'assert';
import registerControllers from './controllers';

/**
 * Creates application.
 * @param  {Object} applications's settings
 * @return {KoaApplication}
 */
function app ({ compressThreshold = 10 * 1024 } = {}) {
	const app = koa(); // eslint-disable-line
	const APIv1 = new Router();

	app.use(compress({ threshold: compressThreshold }));
	app.use(bodyParser());
	app.use(mount('/api', APIv1.middleware()));

	// register controllers
	registerControllers(APIv1);

	return app;
}

// if we are running this module directly, then create application and start listening
if (require.main === module) {
	assert(config.http.port, 'Missing port configuration item.');

	app().listen(config.http.port);
}

export default app;
