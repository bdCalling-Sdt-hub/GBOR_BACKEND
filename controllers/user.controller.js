const UserModel = require("../model/userSchema")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const emailWithNodemailer = require("../config/email.config");



const userTimers = new Map();

exports.userRegister = async (req, res) => {

    if (req.fileValidationError) {
        return res.status(400).json({ "messege": req.fileValidationError });
    }

    const { fName, lName, email, userName, dateOfBirth, password, confirmPass, termAndCondition, role,creator_category } = req.body
    const user = await UserModel.findOne({ email: email })
    if (user) {
        return res.status(409).send({ "messege": "email already exists" })

    } else {
        if (fName && lName && email && userName && dateOfBirth && password && confirmPass) {
            if (password === confirmPass) {
                try {
                    const salt = await bcrypt.genSalt(10);
                    const hashpassword = await bcrypt.hash(password, salt);
                    let imageFileName = '';
                  
                    if (req.files.uploadId[0]) {
                        // Add public/uploads link to the image file


                        imageFileName = `${req.protocol}://${req.get('host')}/upload/image/${req.files.uploadId[0].filename}`;
                    }
                    const emailVerifyCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
                    const user = await UserModel.create({
                        fName,
                        lName,
                        email,
                        userName,
                        dateOfBirth,
                        password: hashpassword,
                        uploadId: imageFileName,
                        termAndCondition,
                        role: role ? role : "unknown",
                        emailVerifyCode,
                        creator_category


                    });


                    if (userTimers.has(user._id)) {
                        clearTimeout(userTimers.get(user._id));
                    }

                    // Set a new timer for the user to reset oneTimeCode after 3 minutes
                    const userTimer = setTimeout(async () => {
                        try {
                            user.oneTimeCode = null;
                            await user.save();
                            console.log(`email verify code for user ${user._id} reset to null after 3 minutes`);
                            // Remove the timer reference from the map
                            userTimers.delete(user._id);
                        } catch (error) {
                            console.error(`Error updating emailverify code for user ${user._id}:`, error);
                        }
                    }, 180000); // 3 minutes in milliseconds

                    // Store the timer reference in the map
                    userTimers.set(user._id, userTimer);
                    console.log(user._id);     
                    const secretid = process.env.JWT_SECRET;
                    console.log(secretid);
                    const token = jwt.sign({ userID: user._id }, secretid, { expiresIn: "15m" })
                
                    const link = `http://192.168.10.16:5000/email-verify/${user._id}/${token}`
                    // Prepare email for activate user
                    const emailData = {
                        email,
                        subject: 'Account Activation Email',
                        html: `
                            <h1>Hello, ${user.fName}</h1>
                            <p>Your Email verify link is <h3>${link}</h3> to verify your email</p>
                            <small>This Code is valid for 3 minutes</small>
                            `
                    }

                    emailWithNodemailer(emailData);

                    //const userInfo = await UserModel.findOne({ email }).select(['fName','lName','email','userName','uploadId','role']);
                    //const userInfo=user.select("-password");
                    return res.status(201).send({ "status": 201, "messege": "Registerd successfully!Please check your E-mail to verify.","link":link })
                } catch (e) {
                    console.log(e)
                    return res.status(400).send({ "status": 400, "messege": "unable to register" })
                }

            } else {
                return res.status(400).send({ "status": 400, "messege": "password and confirm password does not match" })
            }
        } else {
            return res.status(400).send({ "status": 400, "messege": "All fields are required" })
        }
    }
}


exports.userLogin = async (req, res) => {
    const { email, password } = req.body
    console.log(req.body);
    try {
        const user = await UserModel.findOne({ email: email })
        if (email && password) {
            if (user.emailVerified === false) {
                return res.status(401).send({ "status": 401, "messege": "your email is not verified" })
            }

            if (user.role === "unknown") {
                return res.status(401).send({ "status": 401, "messege": "Unathorized user" })
            }

            if (user !== null) {
                const ismatch = await bcrypt.compare(password, user.password)
                if ((user.email === email) && ismatch) {
                    const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })
                    const userInfo = await UserModel.findOne({ email }).select(['fName', 'lName', 'email', 'userName', 'uploadId', 'role','emailVerified']);
                    return res.status(200).send({ "status": 200, "messege": "you are logged in successfully", "token": token, "data": { "userInfo": userInfo } })

                } else {
                    return res.status(401).send({ "status": 401, "messege": "your credential doesnt match" })

                }

            } else {
                return res.status(401).send({ "status": 401, "messege": "your credential doesnt match" })

            }
        } else {
            return res.status(400).send({ "status": 400, "messege": "All fields are required" })
        }
    } catch (e) {
        console.log(e)
        return res.status(400).send({ "status": 400, "messege": "unable to login" })
    }


}

exports.changeuserpassword = async (req, res) => {
    const { password, confirmPass } = req.body
    if (password && confirmPass) {
        if (password !== confirmPass) {
            return res.status(400).send({ "status": 400, "messege": "password and confirm password doesnt match" })

        } else {
            const salt = await bcrypt.genSalt(10);
            const hashpassword = await bcrypt.hash(password, salt);
            const passchange = await UserModel.findByIdAndUpdate(req.user._id, { $set: { password: hashpassword } })
            console.log(passchange)
            return res.status(200).send({ "status": 200, "messege": "password changed successfully" })
        }
    } else {
        return res.status(400).send({ "status": 400, "messege": "All fields are required" })
    }


}

exports.loggeduserdata = async (req, res) => {
    const user = await UserModel.findById({ _id: req.user._id }).select(['fName', 'lName', 'email', 'userName', 'uploadId', 'role','creator_category'])
    return res.status(200).send({ "status": 200, "messege": "userdata from database", "data": { "userInfo": user } })

}



exports.verifyEmail = async (req, res, next) => {
  try {
       
        const user = await UserModel.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User Not Found' });
        } else if (user) {
            user.emailVerified = true;
            await user.save();
            return res.status(200).json({ status: 200, message: 'Email veriified successfully' });
        } else {
            return res.status(401).json({ status: 401, message: 'Failed to verify' });
        };
    } catch (error) {
        next(error)
    }
};

exports.senduserpasswordresetemail = async (req, res) => {
    const { email } = req.body
    if (email) {
        const user = await UserModel.findOne({ email: email })
        if (user) {
            const emailResetCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

            // Store the OTC and its expiration time in the database
            user.emailVerifyCode = emailResetCode;
            await user.save();
            try {
                const emailData = {
                    email,
                    subject: 'Password Reset Email',
                    html: `
                <h1>Hello, ${user.fName}</h1>
                <p>Your emailResetCode is <h3>${emailResetCode}</h3> to reset your password</p>
                <small>This Code is valid for 3 minutes</small>
              `
                }
                await emailWithNodemailer(emailData);

                res.status(200).send({ "status": 200, "messege": "password reset code send your email--check your email" })
            } catch (e) {
                console.log(e)
                res.send({ "status": "failed", "messege": "invalid email config" })
            }

        } else {
            return res.status(400).send({ "status": 400, "messege": "email doesnt exists" })
        }
    } else {
        res.status(400).send({ "status": 400, "messege": "Email field are required" })
    }
}

exports.verifyCodeForResetPassword = async (req, res, next) => {
    try {
        
        const { verifyCode,email } = req.body;
        
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({status:401, message: 'User not found' });
        } else if (user.emailVerifyCode === verifyCode) {
            return res.status(200).json({ status: 200, message: 'User verified successfully' });
        } else {
            return res.status(400).json({ status:400, message: 'Failed to verify user' });
        }
    } catch (error) {
        next(error)
    }
};

exports.resetpassword = async (req, res) => {
    const { password, confirmPass, email } = req.body
    
    const user = await UserModel.findOne({email})
    
    if(user){
        try {
           
            if (password && confirmPass) {
                if (password !== confirmPass) {
                    res.send({ "status": "failed", "messege": "password and confirm password doesnt match" })
                } else {
                    const salt = await bcrypt.genSalt(10)
                    const hashpassword = await bcrypt.hash(password, salt)
                    const passchange = await UserModel.findByIdAndUpdate(user._id, { $set: { password: hashpassword } })
    
                    return res.status(200).json({ "status": 200, "messege": "password reset successfully" })
                }
            } else {
                return res.status(400).send({ "status": 400, "messege": "All fields are required" })
            }
        } catch (error) {
            
            res.send({ "status": "failed", "messege": error.message })
        }
    }else{
        return res.status(400).send({ "status": 400, "messege": "email doesnt exists" }) 
    }
   

}





