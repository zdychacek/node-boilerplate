/**
 * Returns some json data.
 */
function* index () {
	const { name, age} = this.query;

	this.body = { name, age };
}

// register route
export default function (router) {
	router.get('/', index);
}
