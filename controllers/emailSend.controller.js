const emailWithNodemailer = require("../config/email.config");

exports.contact= async (req, res) => {

let email=req.body.email;

let subject=req.body.subject;
let message=req.body.message;
let name=req.body.name;
    
    const emailData = {
        email:"freelancerrtushar@gmail.com",
        subject:subject,
        html:`
            <h1>Hello,${name}</h1>
            <p>${message}</p>
            <p>${email}</p>
            `
    }

    emailWithNodemailer(emailData);

    res.status(200).json({status:200,data:"email send successfully"});
    

}