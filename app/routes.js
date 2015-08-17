var Contact = require('./models/contacts');

module.exports = function(app) {
	/* API */
	
	// get all contacts
	app.get('/api/contacts', function(req, res) {

		// mongoose get all contacts
		Contact.find(function(err, contacts) {

			// send an error
			if (err)
				res.send(err)

			res.json(contacts); // return all contacts
		});
	});
	
	// get contact form data and do someething ...
	app.post('/api/contact', function(req, res) {
		
		// insert new contact			
		Contact.create({
			name : req.body.form_data.name,
			email: req.body.form_data.email,
			done : false
		}, function(err, contact) {
			if (err)
				res.send(err);

			Contact.find(function(err, contacts) {
				if (err)
					res.send(err);

				var congrats = "Congrats "+req.body.form_data.name+"! ";
				res.send({status:congrats + " Your form has been sent!"});
			});
		});
		
	});
	

	/* APPLICATION */
	app.get('*', function(req, res) {
		// load index.html otherwise
		res.sendfile('./public/index.html');
	});
};