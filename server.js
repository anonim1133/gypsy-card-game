var express = require('express')
var serveStatic = require('serve-static')

var passport = require('passport')
  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
  
var logger = require('express-logger');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var session = require('express-session')
var util = require("util");
var db = require("./db");

global.config = require('./config');
var app = express();

var game = require('./game');

//app.use(serveStatic('resources'))
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(logger({path: "logs/error.log"}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(session({
    secret: global.config.SESSION_SECRET,
    name: global.config.SESSION_NAME,
    //store: sessionStore, // connect-mongo session store
    genid: function(req) {
		return require('crypto').randomBytes(48).toString('hex'); // use UUIDs for session IDs
	},
    proxy: true,
    resave: true,
    saveUninitialized: true
}));


// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/resources'));
    
    
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
    clientID: global.config.GOOGLE_CLIENT_ID,
    clientSecret: global.config.GOOGLE_CLIENT_SECRET,
    callbackURL: global.config.GOOGLE_CLIENT_URL
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));



//index route
app.get('/', function (req, res) {	
	if(req.user == undefined)
		res.redirect('/auth/google');
	else{
		var gameList;
		
		game.getList(8, function(rows){
			res.render('index', {
				message: 'Cześć ' + req.user.displayName,
				gameList: rows
			});
		});
	}
})

//ajax newGame route
app.post('/newGame', function (req, res) {
	if(req.user != undefined){
		game.create(req.body.tableName, req.user.id, req.body.players, function(id){
			res.redirect('/game/' + id);
		});
	}else{ 
		res.redirect('/auth/google');
	}
});

//game view
app.get('/game/:id', function(req, res){
	if(req.user == undefined)
		res.redirect('/auth/google/');
	else{
		if(req.params.id != undefined){
			
			game.getGame(req.params.id, function(info){
				var game_info = info[0];
				
				info.shift();
				var players = info;
				
				var turn = false;
				
				if(req.user.id == game_info.turn_id)
					turn = true;
				
				game.getGameCards(req.params.id, function(cards){
					res.render('game', {
					user_id: req.user.id,
					game: game_info,
					players: players,
					cards: cards[0],
					turn: turn
				});
			})
		});
		}
	}
});


//ajax join game
app.get('/joinGame/:gid/:uid', function(req, res){
	if(req.user == undefined)
		res.redirect('/auth/google/');
	else{
		game.join(req.params.gid, req.params.uid);
		
		var user = {
			uid: req.user.id,
			uname: req.user.displayName
		}
		
		res.send(user);
	};
	
});

//ajax start game
app.get('/startGame/:gid', function(req, res){
	if(req.user == undefined)
		res.redirect('/auth/google/');
	else{
		game.start(req.params.gid, req.user.id);
		res.send('START');
	};
});

//ajax get hand
app.get('/getHand/:gid', function(req, res){
	if(req.user == undefined)
		res.redirect('/auth/google/');
	else{
		game.getHand(req.params.gid, req.user.id, function(cards){
			res.send(cards);
		});
		
	};
});


//ajax play card
app.get('/playCard/:gid/:cid', function(req, res){
	if(req.user == undefined)
		res.redirect('/auth/google/');
	else{
		game.playCard(req.params.gid, req.user.id, req.params.cid, function(cards){
			res.send(cards);
		});
		
	};
});

//ajax get turn
app.get('/getTurn/:gid', function(req, res){
	if(req.user == undefined)
		res.redirect('/auth/google/');
	else{
		game.getTurn(req.params.gid, function(turn){
			if(turn !== undefined && turn.id == req.user.id)
				turn.self = true
			res.send(turn);
		});
		
	};
});

app.get('/check/:gid', function(req, res){
	if(req.user == undefined)
		res.redirect('/auth/google/');
	else{
		game.check(req.params.gid, function(value){
			res.send(value);
		});
		
	};
});







//authentication routes
app.get('/auth/google',
  passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/plus.login' }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
	db.newPlayer(req.user.id, req.user.displayName);
    // Successful authentication, redirect home.
    res.redirect('/');
  });


//Handle 404
app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});

//Handle 500
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('<a href="/auth/google">Sign In with Google</a><br/><pre>Something broke!<br>'+err.stack+'</pre>');
});

app.listen(8888)
