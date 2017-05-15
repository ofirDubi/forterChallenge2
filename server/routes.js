module.exports = function(app) {


	app.get('/', function(req, res) {
		res.sendfile('./public/index.html');
	});

	var output = "WELCOME to the chat room!" ;



	app.get('/data', function(req, res) {

		res.json(output);

	});
};