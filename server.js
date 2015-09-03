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

var config = require("./config");
var app = express();

//app.use(serveStatic('resources'))
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(logger({path: "logs/error.log"}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(session({
    secret: config.SESSION_SECRET,
    name: config.SESSION_NAME,
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
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: config.GOOGLE_CLIENT_URL
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




app.get('/', function (req, res) {
	if(req.user == undefined){
		res.redirect('/auth/google')
	}else{
		res.render('index', { title: 'Witaj!', message: 'Cześć ' + req.user.displayName });
	}
})




app.get('/auth/google',
  passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/plus.login' }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
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
