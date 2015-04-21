import request from 'co-supertest';
import assert from 'assert';
import _app from '../app';
import './common';

describe('main controller', function () {
	let app;

	before(function* () {
		app = _app().listen();
	});

	describe('default route', function () {

		it('should return JSON data', function* () {
			yield request(app)
				.get('/api')
				.expect('Content-Type', /json/)
				.expect(200)
				.end();
		});

		it('should echo data', function* () {
			const testData = { name: 'Ondrej', age: 27 };

			const response = yield request(app)
				.get('/api')
				.query(testData)
				.expect(200)
				.end();

			assert.deepEqual(response.body, {
				name: 'Ondrej',
				age: 27
			});
		});
	});
});
