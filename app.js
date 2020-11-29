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


app.use(express.static("frontend"));

//____________________________________________________________________________


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

//set views file
app.set('views',path.join(__dirname,'frontend/views'));

//set view engine
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

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/frontend/login.html'));
});

//$2b$10$uCsFBmr1x9FsZ9svwyn19.FM7BV3EMqriqz137pbAbk1eg8I.fm06
//$2b$10$8aGd9MQGHuI.iAR2BHQypeN.DdyU36KfumcjaTvL2mJ04XLWUw4L6


app.post('/auth', function(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    if (email && password) {
        let cuttedPass = "";
        function cutted() {
            connection.query("SELECT password FROM users WHERE email = ?", [email, password], function (error, result, fields) {
                let hashedPass = JSON.stringify(result);
                //   cuttedG = hashed.substring(13, 75);
                //   console.log(cuttedG);
                return cuttedPass = hashedPass.substring(14, 74);
            });
        }
        cutted();

        connection.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], function (error, results, fields) {
            let mypass = cuttedPass;
            if (bcrypt.compareSync(password, mypass) === true)  {
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
                title: 'LOGIN PAGE',
                users: rows
            });
        });
    } else {
        res.send(loginMsg);
    }
});

app.get('/home', function(req, res) {
    if (req.session.loggedin) {
        res.send('Welcome back, ' + req.session.email + '!');
    } else {
        res.send('Please login to view this page...');
    }
    res.end();
});

//ADMIN CRUD______________________________________________________________

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
        from: 'y62@outlook.dk', //
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


app.listen(port, () => {
    console.log("Server is running on port:", port)
});