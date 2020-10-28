const express = require("express");
const mysql = require("mysql");


const app = express();

const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'mydb'
});

db.connect((eer) => {
    if (eer) throw eer;
    console.time('mysql');
    console.log("Database successfully connected!" +
        "console test...");
});


app.get("/", (req, res) => {
    res.send("<h1>We're all gonna make it!</h1>");
});

const port = 8080;

app.listen(port, () => {
    console.log("Server is running on port:", port)
    db.query("CREATE TABLE IF NOT EXISTS pet (name VARCHAR(20));");
});
