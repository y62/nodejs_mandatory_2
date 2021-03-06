require('dotenv').config();
const express = require("express");
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const app = express();
const port = 8080;
app.use(express.static("frontend/views"));


const createUserLimiter =rateLimit({
    windowMs: 2 * 60  * 1000, // 2 min.
    max: 3 ,     // limit each IP to 3 requests per windowMs
    message: "You have exceeded the 2 minutes limit, please come again later!"
});

const connection = mysql.createConnection({
    host: 'database-2.c8e4q2gd2tmb.eu-central-1.rds.amazonaws.com',
    port: 3306,
    user: process.env.DATAUSER,
    password: process.env.DATAPASS,
    database: process.env.DATABASE
});

connection.connect(function(error){
    if(!!error) console.log(error);
    else console.log('Database Connected!');
});


app.set('views',path.join(__dirname,'frontend/views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//LOGIN_______________________________________________________________

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/login', function(request, response) {
    response.sendFile(path.join(__dirname + '/frontend/views/login.html'));
});

app.post('/auth', function(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    if (email && password) {
        let cuttedPass = "";
        function cutted() {
            connection.query("SELECT password FROM users WHERE email = ?", [email, password], function (error, result, fields) {
                console.log(result);
                let hashedPass = JSON.stringify(result);
                return cuttedPass = hashedPass.substring(14, 74);
            });
        }
        cutted();

        connection.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], function (error, results, fields) {
            let hashPass = cuttedPass;
            if (bcrypt.compareSync(password, hashPass) === true)  {
                req.session.loggedin = true;
                req.session.email = email;
                res.redirect('/users');
            } else {
                res.send('Incorrect Username and/or Password!');
            }
            res.end();
        });
    } else {
        res.send(loginMsg);
        res.end();
    }
});

app.get('/users',(req, res) => {
    if (req.session.loggedin) {
        let sql = "SELECT * FROM users";
        let query = connection.query(sql, (err, rows) => {
            if (err) throw err;
            res.render('user_list', {
                title: 'User List',
                users: rows
            });
        });
    } else {
        res.send(loginMsg);
    }
});

app.get('/home', (req, res) => {
    if (req.session.loggedin) {
        res.send('Welcome back, ' + req.session.email + '!');
    } else {
        res.send('Please login to view this page...');
    }
    res.end();
});

//USER CRUD______________________________________________________________

const loginMsg = "Please login to view this page..."

function confirmationMail(confirmationAcc) {

    let transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });

    let mailOptions = {
        from: process.env.EMAIL, //
        to: confirmationAcc,
        subject: 'Welcome ' + confirmationAcc,
        text: 'Your account ' + confirmationAcc + ' has been successfully created!'
    };

    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            return console.log('Email not sent...');
        }
        return console.log('Confirmation sent...');
    });
}


app.get('/add', (req, res) => {
    if (req.session.loggedin) {
        res.render('register_user', {
            title: 'Create an user'
        });
    } else {
        res.send(loginMsg)
    }
});

app.post('/save', createUserLimiter,  (req, res) => {
    const email = req.body.email;
    const encryptedPassword = req.body.password;
    let password = bcrypt.hashSync(encryptedPassword, 10);
    // let password = hash.toString();
    const data = {email, password};
    let sql = "INSERT INTO users SET ?";
    connection.query(sql, data,(err, results) => {
        if(err) throw err;
        res.redirect('/users');
        confirmationMail(email);
    });
});

app.get('/delete/:userId',(req, res) => {
    const userId = req.params.userId;
    let sql = `DELETE from users where id = ${userId}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.redirect('/users');
    });
});

app.get('/', (req, res) => {
    return res.sendFile(__dirname + "/frontend/index.html");
});

app.get('/contact', (req, res) => {
    return res.sendFile(__dirname + "/frontend/contact.html");
});

app.listen(port, () => {
    console.log("Server is running on port:", port)
});