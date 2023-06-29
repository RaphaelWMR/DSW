const express = require('express');
const connection = require('../connection');
const router = express.Router();

const jwt = require('jsonwebtoken');
require('dotenv').config();


router.post('/signup', (req, res) => {
    let user = req.body;
    query = "SELECT email,password,role,status FROM user WHERE email=?"
    connection.query(query, [user.email], (err, results) => {
        if (!err) {
            if (results.length <= 0) {
                query = "INSERT INTO user(name, contactNumber, email, password,status,role) VALUES (?,?,?,?,'false','user')";
                connection.query(query, [user.name, user.contactNumber, user.email, user.password], (err, results) => {
                    if (!err) {
                        return res.status(200).json({ message: "Sucessfully Registered" });
                    } else {
                        return res.status(500).json(err);
                    }
                })
            } else {
                return res.status(400).json({ message: "Emaily already exist." })
            }
        } else {
            return res.status(500).json(err);
        }
    })
})

router.post('/login', (req, res) => {
    const user = req.body;
    query = "SELECT email,password,role,status FROM user WHERE email=?";
    connection.query(query, [user.email], (err, results) => {
        if (results.length <= 0 || results[0].password != user.password) {
            return res.status(401).json({ message: "Incorrect Username or Password" });
        } else if (results[0].status == 'false') {
            return res.status(401).json({ message: "Wait for Admin Approval" });
        } else if (results[0].password == user.password) {
            const response = { email: results[0].email, role: results[0].role }
            const acessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: '8h' })
            res.status(200).json({ token: acessToken })
        }
    })
})

module.exports = router;