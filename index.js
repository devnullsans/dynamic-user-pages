const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

const {
	PORT = 5000,
	TTL = 1e4,
	KEY = 'a4f087f1-c837-4740-8ed2'
} = process.env;

const users = [
	{ id: 1, name: 'Alex', email: 'alex@gmail.com', password: 'secret', pages: [] },
	{ id: 2, name: 'Dexter', email: 'dexter@gmail.com', password: 'secret', pages: [] },
	{ id: 3, name: 'Tom', email: 'tom@gmail.com', password: 'secret', pages: [] }
];

app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// app.use((req, res, next) => {
// 	res.locals.userValue = null;
// 	next();
// });

app.use(session({
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: TTL },
	secret: KEY,
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// / route res render index.ejs
app.get('/', (req, res) => {
	const { user } = req.session;
	res.render('index', { userName: user?.name });
	console.log(user?.id, 'Accessed Index page');
});
// /login route res render login.ejs
app.get('/login', redirectHome, (req, res) => {
	res.render('login');
});
// /register route res render register.ejs
app.get('/register', redirectHome, (req, res) => {
	res.render('register');
});
// /home route res render home.ejs
app.get('/home', redirectLogin, (req, res) => {
	const { user } = req.session;
	res.render('home', { userName: user.name });
	console.log(user.id, 'Accessed Home page');
});
// /route roiute res render route.ejs
app.get('/route', redirectLogin, (req, res) => {
	req.render('route');
});

// /logout redirect to /
app.post('/logout', redirectLogin, (req, res) => {

});
// /login redirect to /home OR json res error
app.post('/login', redirectHome, (req, res) => {
	console.log(req.body); // { email: 'tom@gmail.com', password: 'secret' }
	const { email, password } = req.body;
	const user = users.find(usr => usr.email === email && usr.password === password);
	if (!user) return res.status(401).end();
	req.session.user = user;
	res.redirect('/home');
});
// /register redirect to /home OR json res error
app.post('/register', redirectHome, (req, res) => {
	console.log(req.body); // { name: 'Tom', email: 'tom@gmail.com', password: 'secret' }
	const { name, email, password } = req.body;
	const avail = users.find(usr => usr.email === email);
	if (avail) return res.status(409).end();
	const user = {
		name, email,
		password, pages: [],
		id: users.length
	};
	users.push(user);
	req.session.user = user;
	res.redirect('/home');
});
app.post('/route', redirectLogin, (req, res) => {
	console.log(req.body);
});

app.listen(5000, () => console.log('running on port 5000'));

function redirectLogin(req, res, next) {
	if (!req.session.user) res.redirect('/login');
	else next();
}

function redirectHome(req, res, next) {
	if (req.session.user) res.redirect('/home');
	else next();
}

/*
app.get('/', (req, res) => {
	res.render('home', {
		topicHead: 'Student Form',
	});
	console.log('user accessing Home page');
});

app.post('/student/add', (req, res) => {
	const student = {
		first: req.body.fname,
		last: req.body.lname
	};
	console.log(student);
	res.render('home', {
		userValue: student,
		topicHead: 'Student Form'
	});
	//res.json(student);

});
*/
