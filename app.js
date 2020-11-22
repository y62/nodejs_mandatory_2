const express = require("express");
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const ejs = require('ejs');
const app = express();
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

const port = 8080;


const createUserLimiter =rateLimit({
    windowMs: 2 * 60  * 1000, // 2 min.
    max: 3 ,     // limit each IP to 3 requests per windowMs
    message: "You have exceeded the 2 minutes limit, please come again later !"
});


app.use(express.static("frontend"));

//Database connection_____________________________________________________________________

const connection = mysql.createConnection({
    host: 'database-2.c8e4q2gd2tmb.eu-central-1.rds.amazonaws.com',
    port: 3306,
    user: 'admin',
    password: 'adminadmin',
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


app.get('/add',createUserLimiter ,(req, res) => {
    res.render('admin_add', {
        title : 'Create a booqie admin'
    });
});


app.post('/save',async (req, res) => {

    let data = {name: req.body.name, email: req.body.email, phone_no: req.body.phone_no, password: req.body.password}

            let sql = "INSERT INTO admins SET ?";

            let query = connection.query(sql, data, (err, results) => {
                if (err) throw err;
                res.redirect('/admins');
            });

 // Nodemailer
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: '',
            pass: ''
        }
    });

    // send mail with defined transport object
    let email = req.body.email
    const msg = {
        from: '"From express app 👻" <theExpressApp@example.com>', // sender address
        to: `${email}`, // list of receivers
        subject: "Registration conformation", // Subject line
        text: "Welcome User ! Your user id has been created. you can access your" +
            " user profile by login into your account.", // plain text body
    };

    // send mail with defined transport object
    const info = await transporter.sendMail(msg);



    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

    res.send('Email sent !')
});


app.get('/delete/:adminId',(req, res) => {
    const adminId = req.params.adminId;
    let sql = `DELETE from admins where id = ${adminId}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.redirect('/admins');
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

app.post('/auth', function(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    if (email && password) {
        connection.query('SELECT * FROM admins WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
            if (results.length > 0) {
                req.session.loggedin = true;
                req.session.email = email;
                res.redirect('/admins');
            } else {
                res.send('Incorrect Email and/or Password!');
            }
            res.end();
        });
    } else {
        res.send('Please enter Email and Password!');
        res.end();
    }
});

app.get('/admins',(req, res) => {
    if (req.session.loggedin) {
        let sql = "SELECT * FROM admins";
        let query = connection.query(sql, (err, rows) => {
            if (err) throw err;
            res.render('admin_list', {
                title: 'Welcome to booqie admin list',
                admins: rows
            });
        });
    } else {
        console.log("cannot login");
    }
});

app.get('/home', function(req, res) {
    if (req.session.loggedin) {
        res.send('Welcome back, ' + req.session.email + '!');
    } else {
        res.send('Please login to view this page!');
    }
    res.end();
});








app.listen(port, () => {
    console.log("Server is running on port:", port)
});
