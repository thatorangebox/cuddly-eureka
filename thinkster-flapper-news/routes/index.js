var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var passport = require('passport');
var User = mongoose.model('User');
var jwt = require('express-jwt');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});
console.log('index');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//GET posts
router.get('/posts', function(req, res, next){
	Post.find(function(err, posts){
		if(err){
			return next(err);
		}

		res.json(posts);
	});
});

//POST
router.post('/posts', auth, function(req, res, next){
	var post = new Post(req.body);
	post.author = req.payload.username;

	post.save(function(err, post){
		if(err){
			return next(err);
		}

		res.json(post);
	});
});

router.param('post', function(req, res, next, id){
	var query = Post.findById(id);

	query.exec(function(err, post){
		if(err){
			return next(err);		
		}

		if(!post){
			return next(new Error('can\'t find post'));
		}

		req.post = post;
		console.log(1);
		console.log(req.post);
		console.log(req.post.comments);
		return next();
	});
});

router.get('/posts/:post', function(req, res, next){
	req.post.populate('comments', function(err, post){
		if(err){
			return next(err);
		}
		console.log(2);
		console.log(req.post);
		console.log('##');
		console.log(post);
		res.json(post);
	});	
});

router.put('/posts/:post/upvote', auth, function(req, res, next){
	req.post.upvote(function(err, post){
		if(err){
			return next(err);
		}
		console.log(3);
		console.log(post);
		res.json(post);
	});
});

router.post('/posts/:post/comments', auth, function(req, res, next){
	var comment = new Comment(req.body);
	comment.post = req.post;
	comment.author = req.payload.username;
	// console.log(req);

	comment.save(function(err, comment){
		if(err){
			return next(err);
		}

		req.post.comments.push(comment);
		req.post.save(function(err, post){
			if(err){
				return next(err);
			}

			res.json(comment);
		});

		console.log(res);
	});
});

router.param('comment', function(req, res, next, id){
	var query = Comment.findById(id);

	query.exec(function(err, comment){
		if(err){
			return next(err);
		}

		if(!comment){
			return next(new Error('can\'t find comment'));
		}

		req.comment = comment;
		console.log(6);
		// console.log(req);
		// console.log('###');
		console.log(req.comment);
		return next();
	});
});

/*router.get('posts/:post/comments/:comment', function(req, res){
	console.log(7);
	console.log(req.comment);
	res.json(req.comment);
});*/

router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next){
	req.comment.upvote(function(err, comment){
		if(err){
			return next(err);			
		}
		console.log(5);
		console.log(comment);
		res.json(comment);
	});
});

router.post('/register', function(req, res, next){
	if(!req.body.username || !req.body.password){
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	var user = new User();

	user.username = req.body.username;

	user.setPassword(req.body.password);

	user.save(function(err){
		if(err){
			return next(err);
		}

		return res.json({token: user.generateJWT()});
	});
});

router.post('/login', function(req, res, next){
	if(!req.body.username || !req.body.password){
		return res.status(400).json({ message: 'Please fill out all fields' });
	}

	passport.authenticate('local', function(err, user, info){
			if(err){
				return next(err);
			}

			if(user){
				return res.json({ token: user.generateJWT() });
			} else{
				return res.status(401).json(info);
			}
	})(req, res, next);
});

module.exports = router;
