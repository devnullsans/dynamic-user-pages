const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

const users = [
	{ id: 1, name: 'Alex', email: 'alex@gmail.com', password: 'secret' },
	{ id: 2, name: 'Dexter', email: 'dexter@gmail.com', password: 'secret' },
	{ id: 3, name: 'Tom', email: 'tom@gmail.com', password: 'secret' }
];

const pages = [
	{ id: 1, business: 'MaaBeeNes', service: 'We do evethang but bettr!', uid: 1 },
	{ id: 2, business: 'BeeNessMan', service: 'Mad skills here!', uid: 2 },
	{ id: 3, business: 'Yoshnoya', service: 'Soup Bowls are special!', uid: 3 },
]

app.use(express.urlencoded({ extended: true }));

const {
	PORT = 5000,
	TTL = 7.2e6,
	SSN = 'sid',
	KEY = 'a4f087f1-c837-4740-8ed2'
} = process.env;

app.use(session({
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: TTL },
	secret: KEY,
	name: SSN
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
	const { userID } = req.session;
	if (userID) {
		res.locals.user = users.find(user => user.id === userID);
		res.locals.page = pages.filter(page => page.uid === userID);
	}
	next();
});

app.get('/', (req, res) => {
	const { user } = res.locals;
	res.render('index', { userName: user?.name });
	console.log(user?.id, 'Accessed Index page');
});

app.get('/login', redirectHome, (req, res) => res.render('login'));
app.get('/register', redirectHome, (req, res) => res.render('register'));

app.get('/home', redirectLogin, (req, res) => {
	const { user, page } = res.locals;
	res.render('home', {
		userName: user.name,
		userPages: page
	});
	console.log(user.id, 'Accessed Home page');
});

app.get('/route', redirectLogin, (req, res) => res.render('route', { pageID: null }));
app.post('/route', redirectLogin, (req, res) => {
	console.log(req.body);// { business: 'Hello', service: 'World!' }
	const { business, service } = req.body;
	//TODO param validation
	const { user } = res.locals;
	const page = {
		business, service,
		uid: user.id, id: pages.length + 1
	};
	pages.push(page);
	res.redirect('/home');
});
app.get('/route/:id', redirectLogin, (req, res) => {
	const pid = Number(req.params.id);
	if (!res.locals.page.some(pg => pg.id === pid)) res.status(403).end();
	else res.render('route', { pageID: pid });
});
app.post('/route/:id', redirectLogin, (req, res) => {
	console.log(req.body);// { business: 'Hello', service: 'World!' }
	const { business, service } = req.body;
	const pid = Number(req.params.id);
	//TODO param validation
	const page = res.locals.page.find(pg => pg.id === pid);
	if (!page) res.status(403).end();
	page.business = business;
	page.service = service;
	res.redirect('/home');
});

app.post('/logout', redirectLogin, (req, res) => {
	req.session.destroy(error => {
		if (error) {
			console.log(error);
			return res.redirect('/home');
		}
		res.clearCookie(SSN);
		// delete res.locals.user;
		res.redirect('/');
	});
});

app.post('/login', redirectHome, (req, res) => {
	console.log(req.body); // { email: 'tom@gmail.com', password: 'secret' }
	const { email, password } = req.body;
	// TODO params validation
	const user = users.find(usr => usr.email === email && usr.password === password);
	if (!user) return res.status(401).end();
	// TODO device verification via email
	req.session.userID = user.id;
	res.redirect('/home');
});

app.post('/register', redirectHome, (req, res) => {
	console.log(req.body); // { name: 'Tom', email: 'tom@gmail.com', password: 'secret' }
	const { name, email, password } = req.body;
	// TODO params validation
	const avail = users.find(usr => usr.email === email);
	if (avail)
		return res.status(409).end();
	// TODO email verification
	const user = {
		name, email, password,
		id: users.length + 1
	};
	users.push(user);
	req.session.userID = user.id;
	res.redirect('/home');
});

app.get('/:id', (req, res) => {
	const { id } = req.params;
	const page = pages.find(pg => pg.id === Number(id));
	if (page) res.render('page', {
		business: page.business,
		service: page.service,
	});
	else res.status(404).end();
});

app.listen(PORT, () => console.log(`running on port ${PORT}`));

function redirectLogin(req, res, next) {
	if (!req.session.userID) res.redirect('/login');
	else next();
}

function redirectHome(req, res, next) {
	if (req.session.userID) res.redirect('/home');
	else next();
}