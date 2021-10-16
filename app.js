const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

const {
	PORT = 5000,
	TTL = 7.2e6,
	SSN = 'sid',
	KEY = 'a4f087f1-c837-4740-8ed2'
} = process.env;

const users = [
	{ id: 1, name: 'Alex', email: 'alex@gmail.com', password: 'secret', pages: [] },
	{ id: 2, name: 'Dexter', email: 'dexter@gmail.com', password: 'secret', pages: [] },
	{ id: 3, name: 'Tom', email: 'tom@gmail.com', password: 'secret', pages: [] }
];

app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
/*
// app.use((req, res, next) => {
// 	res.locals.userValue = null;
// 	next();
// });
*/

app.use(session({
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: TTL },
	secret: KEY,
	name: SSN
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
app.get('/login', redirectHome, (req, res) => res.render('login'));
// /register route res render register.ejs
app.get('/register', redirectHome, (req, res) => res.render('register'));
// /home route res render home.ejs

app.get('/home', redirectLogin, (req, res) => { // Always extract user from session
	const { user } = req.session;
	res.render('home', {
		userName: user.name,
		userPages: user.pages
	});
	console.log(user.id, 'Accessed Home page');
});

// /route route res render route.ejs
app.get('/route', redirectLogin, (req, res) => res.render('route', { pageID: null }));
// /route route res render route.ejs with data | for editing specific route data
app.get('/route/:id', redirectLogin, (req, res) => {
	const { id } = (req.params);
	const { user } = (req.session);
	const page = user.pages.find(pg => Number(id) === pg.id);
	if (!page) return res.status(403).end();
	// TODO render route form with data and save/cancel button
});

// /logout redirect to /
app.post('/logout', redirectLogin, (req, res) => {
	req.session.destroy(err => {
		if (err) {
			console.log(err);
			return res.redirect('/home');
		}
		res.clearCookie(SSN);
		res.redirect('/');
	});

});
// /login redirect to /home OR json res error
app.post('/login', redirectHome, (req, res) => {
	console.log(req.body); // { email: 'tom@gmail.com', password: 'secret' }
	const { email, password } = req.body;
	// IFDEF params validation
	const user = users.find(usr => usr.email === email && usr.password === password);
	if (!user) return res.status(401).end();
	// TODO device verification via email
	req.session.user = user;
	res.redirect('/home');
});
// /register redirect to /home OR json res error
app.post('/register', redirectHome, (req, res) => {
	console.log(req.body); // { name: 'Tom', email: 'tom@gmail.com', password: 'secret' }
	const { name, email, password } = req.body;
	// TODO params validation
	const avail = users.find(usr => usr.email === email);
	if (avail)
		return res.status(409).end();
	// TODO email verification
	const user = {
		name, email,
		password, pages: [],
		id: users.length + 1
	};
	users.push(user);
	req.session.user = user;
	res.redirect('/home');
});
app.post('/route', redirectLogin, (req, res) => {
	console.log(req.body);// { business: 'Hello', service: 'World!' }
	const { business, service } = req.body;
	//TODO param validation
	const { user } = req.session;
	const page = {
		business, service,
		id: user.pages.length + 1
	};
	user.pages.push(page);
	res.redirect('/home');
});

app.listen(PORT, () => console.log(`running on port ${PORT}`));

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
