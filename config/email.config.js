require("dotenv").config();
const nodemailer = require("nodemailer")

let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    requireTLS:true,
    auth: {
        user: process.env.EMAIL_USER, // generated ethereal user
        pass: process.env.EMAIL_PASS, // generated ethereal password
    },
});

const emailWithNodemailer = async (emailData) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM, // sender address
        to: emailData.email, // list of receivers
        subject: emailData.subject, // Subject line
        html: emailData.html, // html body
      }
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent %s", info.response);
    } catch (error) {
      console.error('Error sending mail', error);
      throw error;
    }
  };

module.exports=emailWithNodemailer