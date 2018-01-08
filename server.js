var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

var axios = require('axios');
var cheerio = require('cheerio');

var db = require('./models');

var PORT = 3000;

var app = express();

app.use(logger('dev'));

app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static('public'));

var exphbs = require('express-handlebars');

app.engine("handlebars", exphbs({ defaultLayout: 'main'}));
app.set("view engine", "handlebars");

var MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/newsscrape';

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
	useMongoClient: true
});


app.get('/scrape', function(req, res){
	axios.get('https://www.npr.org/sections/news/').then(function(response){
		var $ = cheerio.load(response.data);

		$('article div h2').each(function(i, element){

			var result = {};

			result.title = $(this)
				.children('a')
				.text();
			result.link = $(this)
				.children('a')
				.attr('href');
			// result.summary = $(this.p)
			// 	.children('a')
			// 	.text();
			// 	console.log(result.summary + 'line 46')
			db.Article					
				.create(result)
				.then(function(dbArticle){
					// res.send('Scrape Complete');
				})
				.catch(function(err){
					res.json(err + 'this is the error you are getting');
				});

		});
		res.send('Scrape Complete')
	});
});

app.get('/articles', function(req, res){
	db.Article
		.find({})
		.then(function(dbArticle){
			res.json(dbArticle);
		})
		.catch(function(err){
			res.json(err);
		});
});

app.get('/articles/:id', function(req, res){
	db.Article.findOne({_id: req.params.id})
		.populate('Note')
		.then(function(dbArticle){
			res.json(dbArticle)
		})
		.catch(function(err){
			res.json(err)
		})
});

app.post('/articles/:id', function(req, res){
	db.Note
		.create(req.body)
		.then(function(dbNote){
			res.json(dbArticle)
		})
		.then(function(){
			db.Article.findOneAndUpdate({_id: req.params.id}, {notes: dbNote._id}, {new: true});
		})
		.catch(function(err){
			res.json(err)
		})
})

app.listen(PORT, function(){
	console.log('App running on port: ' + PORT)
})