const express = require('express');
const connection = require('../connection');
const router = express.Router();

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
var auth = require('../services/authentication');
var check = require('../services/checkRole');
const checkRole = require('../services/checkRole');

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

var transporter = nodemailer.createTransport({
    service: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})

router.post('/forgotPassword', (req, res) => {
    const user = req.body;
    query = "SELECT email,password FROM user WHERE email=?";
    connection.query(query, [user.email], (err, results) => {
        if (!err) {
            if (results.length <= 0) {
                return res.status(200).json({ message: "Password sent successfully to your email.." });
            } else {
                var mailOptions = {
                    from: process.env.EMAIL,
                    to: results[0].email,
                    subject: "Password by Cafe Magnament System",
                    html: '<p><b>Your Login details for Cafe Magnament System</b><br>Email:</br>' + results[0].email + '<br><b>Password: </br>' + results[0].password + '<br><a href="http://localhost:8080/user/login">Click here to login</a></p>'
                };
                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
                return res.status(200).json({ message: "Password sent successfully to your email. " });
            }
        } else {
            return res.status(500).json(err);
        }
    })
})

router.get('/get', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    var query = "SELECT id,name,email,contactNumber,status FROM user WHERE role='user'";
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    })
})

router.patch('/update', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    let user = req.body;
    var query = "UPDATE user SET status=? WHERE id = ?";
    connection.query(query, [user.status, user.id], (err, results) => {
        if (!err) {
            if (results.affecedRows == 0) {
                return res.status(404).json({ message: "User id does not exist" });
            }
            return res.status(200).json({ message: "User Updated Successfully" })
        } else {
            return res.results(500).json(err);
        }
    })
})

router.get('/checkToken', auth.authenticateToken, (req, res) => {
    return res.status(200).json({ message: "true" });
})

router.post('/changePassword', auth.authenticateToken, (req, res) => {
    const user = req.body;
    const email = res.locals.email;
    var query = "SELECT * FROM user WHERE email=? AND password=?";
    connection.query(query, [email, user.oldPassword], (err, results) => {
        if (!err) {
            if (results.length <= 0) {
                return res.status(400).json({ message: "Incorrect old password" });
            } else if (results[0].password == user.oldPassword) {
                query = "UPDATE user SET password=? WHERE email=?";
                connection.query(query, [user.newPassword, email], (err, results) => {
                    if (!err) {
                        return res.status(200).json({ message: "Passsword Updated Successfully" });
                    } else {
                        return res.status(500).json(err);
                    }
                })
            } else {
                return res.status(400).json({ message: "Someting wen wrong. Prlease try again later" });
            }
        } else {
            return res.status(500).json(err);
        }
    })
})

module.exports = router;