const express = require("express");
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');


const app = express();

const port = 8080;


app.use(express.static("frontend"));

//____________________________________________________________________________

/*app.get("/", (req, res) => {
    return res.sendFile(__dirname + "/frontend/test.html");
});*/

const connection = mysql.createConnection({
    host: 'database-2.c8e4q2gd2tmb.eu-central-1.rds.amazonaws.com',
    port: 3306,
    user: 'admin',
    password: '',
    database: 'nodelogin'
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


//ADMIN CRUD______________________________________________________________

let transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        user: process.env.EMAIL,// TODO: your gmail account
        pass: process.env.PASSWORD // TODO: your gmail password
    }
});

// Step 2
let mailOptions = {
    from: 'y62@outlook.dk', // TODO: email sender
    to: 'yous1210@stud.kea.dk', // TODO: email receiver
    subject: 'ANDERS LATIF',
    text: 'HUSK AT LAVE MANDATORIES!!!!'
};

// Step 3
transporter.sendMail(mailOptions, (err, data) => {
    if (err) {
        return log('Error occurs');
    }
    return log('Email sent!!!');
});


app.get('/add',(req, res) => {
    res.render('register_user', {
        title : 'Create an user'
    });
});

app.post('/save',  (req, res) => {
const username = req.body.username;
const encryptedPassword = req.body.password;
    let password = bcrypt.hashSync(encryptedPassword, 10);
   // let password = hash.toString();
    const data = {username, password};
        let sql = "INSERT INTO users SET ?";
        connection.query(sql, data,(err, results) => {
        if(err) throw err;
            transporter.sendMail(mailOptions, (err, data) => {
                if (err) {
                    return console.log('Error occurs');
                }
                return console.log('Email sent!!!');
            });
        res.redirect('/users');
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

app.get('/emailNotFound', (req, res) => {
});


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
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
    let cuttedPass = "";
        function cutted() {
            connection.query("SELECT password FROM users WHERE username = ?", [username, password], function (error, result, fields) {
                let hashedPass = JSON.stringify(result);
             //   cuttedG = hashed.substring(13, 75);
             //   console.log(cuttedG);
                return cuttedPass = hashedPass.substring(14, 74);
            });
        }
        cutted();

          connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
              let mypass = cuttedPass;
            if (bcrypt.compareSync(password, mypass) === true)  {
                req.session.loggedin = true;
                req.session.username = username;
                res.redirect('/users');
            } else {
                res.send('Incorrect Username and/or Password!');
            }
            res.end();
        });
    } else {
        res.send('Please enter Username and Password!');
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
        console.log("cannot login")
    }
});

app.get('/home', function(req, res) {
    if (req.session.loggedin) {
        res.send('Welcome back, ' + req.session.username + '!');
    } else {
        res.send('Please login to view this page!');
    }
    res.end();
});

app.listen(port, () => {
    console.log("Server is running on port:", port)
});
