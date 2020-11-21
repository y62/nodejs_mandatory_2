const express = require("express");
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const ejs = require('ejs');
const app = express();
const rateLimit = require("express-rate-limit");

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


app.post('/save',(req, res) => {

let data = {name: req.body.name, email: req.body.email, phone_no: req.body.phone_no, password: req.body.password}

        let sql = "INSERT INTO admins SET ?";

        let query = connection.query(sql, data, (err, results) => {
            if (err) throw err;
            res.redirect('/admins');
        });


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



 // Client Crud_____________________________________________________


// CREATE

//setting view for client registration form
app.get('/addClient',(req, res) => {
    res.render('client_add', {
        title : 'Create a booqie Client'
    });
});

// Create a client
app.post('/saveClient',(req, res) => {

    let data = {clientName: req.body.clientName,
        empNumber: req.body.empNumber,
        firstname: req.body.firstname,
        lastname:  req.body.lastname,
        emailId:   req.body.emailId,
        phoneNo:   req.body.phoneNo,
        address:req.body.address};
    let sql = "INSERT INTO clients SET ?";

    let query = connection.query(sql, data,(err, results) => {
        if(err) throw err;
        console.log(err);
        res.redirect('/clients');
    });
});

//READ

//read(get) all clients
app.get('/clients',(req, res) => {

    let sql = "SELECT * FROM clients";
    let query = connection.query(sql, (err, rows) => {
        if (!err) {
            res.render('client_list', {
                title: "Welcome to booqie's clients list",
                clients: rows
            });
        } else {
            throw err;
        }
    });

});
// UPDATE

// setting a view for client update form
/* app.get('/update',(req, res) => {
    res.render('updateClient', {
        title : 'Update a Client'
    });
});
*/

// update a client
app.get('/update/:clientId',(req, res) => {
    const clientId = req.params.clientId;
    let sql = `SELECT * from clients where clientId = ${clientId}`;
    let query = connection.query(sql, (err, result) => {
        if (err) throw err;
        res.render('updateClient', {
            title: "Edit Client Info ",
            clientId: result [0]
        });

    });
});

app.post('/updated',(req, res) => {


    const clientId = req.body.clientId;
        let sql = `UPDATE clients SET
            clientName = '"+ req.body.clientName +"',
            empNumber ='"+ req.body.empNumber +"',
            firstname= '" +req.body.firstname+"',
            lastname= '"+ req.body.lastname +"',
            emailId= '"+ req.body.emailId +"',
            phoneNo= '"+ req.body.phoneNo +"',
            address= '"+ req.body.address}+"' WHERE clientId = ${clientId};`;
        let query = connection.query(sql,(err, results) => {
            if(err) throw err;
            res.redirect('/clients');
        });
    });



// delete
app.get('/deleteC/:clientId',(req, res) => {

    const clientId = req.params.clientId;
    let sql = `DELETE from clients where clientId = ${clientId}`;
    let query = connection.query(sql, (err, result) => {
        if (err) throw err;
       // console.log(query)
        res.redirect('/clients');
    });
});


app.listen(port, () => {
    console.log("Server is running on port:", port)
});
