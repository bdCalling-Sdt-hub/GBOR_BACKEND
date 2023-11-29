const UserModel = require("../model/userSchema")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const emailWithNodemailer = require("../config/email.config");
const { addChat } = require("./chat.controller");
const { addMessage } = require("./message.controller");
const { addNotification, getAllNotification } = require("./notification.controller");

const userTimers = new Map();

exports.userRegister = async (req, res) => {

    try {
        if (req.fileValidationError) {
            return res.status(400).json({ "messege": req.fileValidationError });
        }

        const { fName, lName, email, userName, dateOfBirth, password, confirmPass, termAndCondition, role, creator_category } = req.body
        const user = await UserModel.findOne({ email: email })
        if (user) {
            return res.status(409).send({ "messege": "email already exists" });

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


                        if (userTimers.has(user?._id)) {
                            clearTimeout(userTimers.get(user?._id));
                        }

                        // Set a new timer for the user to reset oneTimeCode after 3 minutes
                        const userTimer = setTimeout(async () => {
                            try {
                                user.oneTimeCode = null;
                                await user.save();
                                //console.log(`email verify code for user ${user._id} reset to null after 3 minutes`);
                                // Remove the timer reference from the map
                                userTimers.delete(user?._id);
                            } catch (error) {
                                console.error(`Error updating emailverify code for user ${user?._id}:`, error);
                            }
                        }, 180000); // 3 minutes in milliseconds

                        // Store the timer reference in the map
                        userTimers.set(user?._id, userTimer);
                        //console.log(user._id);
                        const secretid = process.env.JWT_SECRET;
                        //console.log(secretid);
                        const token = jwt.sign({ userID: user?._id }, secretid, { expiresIn: "15m" })

                        const link = `http://mongbor.com/email-verify/${user?._id}/${token}`
                        // Prepare email for activate user
                        const emailData = {
                            email,
                            subject: 'Account Activation Email',
                            html: `
                                <h1>Hello, ${user?.fName}</h1>
                                <p>Your Email verify link is <h3>${link}</h3> to verify your email</p>
                                <small>This Code is valid for 3 minutes</small>
                                `
                        }

                        emailWithNodemailer(emailData);

                        //const userInfo = await UserModel.findOne({ email }).select(['fName','lName','email','userName','uploadId','role']);
                        //const userInfo=user.select("-password");
                        return res.status(201).send({ "status": 201, "messege": "Registerd successfully!Please check your E-mail to verify.", "link": link })
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
    catch (err) {
        console.log(err)
        return res.status(400).send({ "status": 400, "messege": "unable to register" })
    }
}


exports.userLogin = async (req, res) => {
    const { email, password } = req.body
    //console.log(req.body);
    try {
        const user = await UserModel.findOne({ email: email })
        if (user.role == "admin" || user.role == "c_creator") {
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

                        const userInfo = await UserModel.findOne({ email }).select(['fName', 'lName', 'email', 'userName', 'uploadId', 'role', 'emailVerified', 'dateOfBirth', 'website', 'socialLink']);
                        const userData = await UserModel.findOne({ email });
                        let identity = userData.role == "admin" ? true : false;
                        return res.status(200).send({ "status": 200, "messege": "you are logged in successfully", "token": token, "data": { "userInfo": userInfo, identity } })

                    } else {
                        return res.status(401).send({ "status": 401, "messege": "your credential doesnt match" })

                    }

                } else {
                    return res.status(401).send({ "status": 401, "messege": "your credential doesnt match" })

                }
            } else {
                return res.status(400).send({ "status": 400, "messege": "All fields are required" })
            }
        } else {
            return res.status(401).send({ "status": 401, "messege": "You are not authorized user" });
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
            //console.log(passchange)
            return res.status(200).send({ "status": 200, "messege": "password changed successfully" })
        }
    } else {
        return res.status(400).send({ "status": 400, "messege": "All fields are required" })
    }


}


exports.changeExistingPassword = async (req, res) => {


    const user = await UserModel.findById(req.user?._id);
    const { currentPass, password, confirmPass } = req.body

    if (currentPass == "" || password == "" || confirmPass == "") {
        return res.status(400).send({ "status": 400, "messege": "All fields are required" })
    } else {
        const hashpassword = await bcrypt.compare(currentPass, user.password);
        if (hashpassword) {
            if (password !== confirmPass) {
                return res.status(400).send({ "status": 400, "messege": "password and confirm password doesnt match" })

            } else {
                const salt = await bcrypt.genSalt(10);
                const hashpassword = await bcrypt.hash(password, salt);
                const passchange = await UserModel.findByIdAndUpdate(req.user?._id, { $set: { password: hashpassword } })
                //console.log(passchange)
                return res.status(200).send({ "status": 200, "messege": "password changed successfully" })
            }
        } else {
            return res.status(400).send({ "status": 400, "messege": "Your credential is wrong" })
        }
    }

}


exports.loggeduserdata = async (req, res, next) => {
    try {


        const userData = await UserModel.findById(req.user._id);
        console.log("tushar", userData);
        let identity = userData.role == "admin" ? true : false;
        const user = await UserModel.findById({ _id: req.user?._id }).select(['fName', 'lName', 'email', 'userName', 'uploadId', 'creator_category', 'dateOfBirth']);

        return res.status(200).send({ "status": 200, "messege": "userdata from database", "data": { "userInfo": user, identity } });

    } catch (e) {
        next(e.message);
    }


}

exports.verifyEmail = async (req, res, next) => {
    console.log("tushar is comming");
    try {
        console.log(req.user.email);
        const user = await UserModel.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User Not Found' });
        } else if (user) {
            user.emailVerified = true;
            await user.save();
            const message = user.fName + ' ' + user.lName + ' wants to join monGbor, plese confirm accept or reject decision'
            const notification = {
                message,
                image: user.uploadId,
                role: 'admin',
                type: 'user',
                viewStatus: false
            }
            await addNotification(notification)
            const allNotification = await getAllNotification('admin', 10, 1)
            io.emit('admin-notification', allNotification)
            return res.status(200).json({ status: 200, message: 'Email veriified successfully' });
        } else {
            return res.status(401).json({ status: 401, message: 'Failed to verify' });
        };
    } catch (error) {
        console.log(error);
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

        const { verifyCode, email } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ status: 401, message: 'User not found' });
        } else if (user.emailVerifyCode === verifyCode) {
            return res.status(200).json({ status: 200, message: 'User verified successfully' });
        } else {
            return res.status(400).json({ status: 400, message: 'Failed to verify user' });
        }
    } catch (error) {
        next(error)
    }
};

exports.getAllUnapprovedUser = async (req, res) => {
    if (req.user.role == "admin") {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;

        const name = req.query.search || '';
        const searchRegExp = new RegExp('.*' + name + '.*', 'i');
        const filter = {
            $or: [
                { $expr: { $regexMatch: { input: { $concat: ["$fName", " ", "$lName"] }, regex: searchRegExp } } },
                { email: { $regex: searchRegExp } },
            ],
        };

        try {
            let allUnapprovedUser = await UserModel.find({ role: "unknown", emailVerified: true, ...filter }).limit(limit).skip((page - 1) * limit).sort({ createdAt: -1 });
            let totalUser = await UserModel.find({ role: "unknown", emailVerified: true, ...filter }).countDocuments();


            return res.status(200).json({
                status: 200, message: 'All unapproved user', data: { "all_unapproved_user": allUnapprovedUser }, pagination: {
                    totalDocuments: totalUser,
                    totalPage: Math.ceil(totalUser / limit),
                    currentPage: page,
                    previousPage: page - 1 > 0 ? page - 1 : null,
                    nextPage: page + 1 <= Math.ceil(totalUser / limit) ? page + 1 : null,
                }
            });
        } catch (err) {
            next(err.message);
        }
    } else {
        return res.status(401).json({ status: 401, message: 'UnAuthorized user.' });
    }

}

exports.approveUser = async (req, res) => {

    if (req.user.role == "admin") {
        try {
            const id = req.params.id;
            const user = await UserModel.findById(id);
            if (!user) {
                return res.status(404).json({ status: 404, message: 'User not found' });
            } else if (user) {
                user.role = "c_creator";
                await user.save();

                const emailData = {
                    email: user.email,
                    subject: "Account activate",
                    html: `
                        <h1>Hello,${user.fName}</h1>
                        <p>you account has been approved</p>
                        <p>Now you can log in in this address http://mongbor.com/signin</p>
                        `
                }

                emailWithNodemailer(emailData);

                //activating chat
                const chat = await addChat({ participants: [user._id, req.user._id] });

                if (chat) {
                    //console.log("chat created");
                    const message = await addMessage({
                        chat: chat._id,
                        sender: req.user._id,
                        message: "A warm welcome to the monGbor"
                    });
                    if (message) {
                        console.log("message created");
                    }
                }

                return res.status(200).json({ status: 200, message: 'User approved successfully' });
            } else {
                return res.status(401).json({ status: 401, message: 'Failed to approve user' });
            };
        }
        catch (err) {
            next(err.message);
        }
    }

}


exports.cancelUser = async (req, res) => {

    if (req.user.role == "admin") {
        try {
            const id = req.params.id;
            const user = await UserModel.findById(id);
            if (!user) {
                return res.status(404).json({ status: 404, message: 'User not found' });
            } else if (user) {
                user.role = "delete";
                await user.save();

                //activating chat

                return res.status(200).json({ status: 200, message: 'User cencal successfully' });
            } else {
                return res.status(401).json({ status: 401, message: 'Failed to cancel user' });
            };
        }
        catch (err) {
            next(err.message);
        }
    }

}


exports.deleteUser = async (req, res) => {

    if (req.user.role == "admin") {
        try {
            const id = req.params.id;
            const user = await UserModel.findById(id);
            if (!user) {
                return res.status(404).json({ status: 404, message: 'User not found' });
            } else if (user) {
                user.role = "unknown";
                await user.save();

                //activating chat

                return res.status(200).json({ status: 200, message: 'User delete successfully' });
            } else {
                return res.status(401).json({ status: 401, message: 'Failed to delete user' });
            };
        }
        catch (err) {
            next(err.message);
        }
    }

}



exports.resetpassword = async (req, res) => {
    const { password, confirmPass, email } = req.body

    const user = await UserModel.findOne({ email })

    if (user) {
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
    } else {
        return res.status(400).send({ "status": 400, "messege": "email doesnt exists" })
    }
}




exports.contentCreator = async (req, res) => {


    try {

        let ContentCreator = await UserModel.findById(req.params.id).select(['fName', 'lName', 'email', 'userName', 'uploadId', 'creator_category', 'website', 'socialLink','description']);;

        return res.status(200).json({ status: 200, message: "content creator details", data: { "Creator Details": ContentCreator } })

    } catch (err) {

        next(err.message);

    }

}






exports.getAllContentCreator = async (req, res) => {


    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 15;


        const name = !req.query.search ? null : req.query.search
        var filter;
        if (name !== null) {
            const searchRegExp = new RegExp('.*' + name + '.*', 'i');
            filter = {
                $or: [
                    { $expr: { $regexMatch: { input: { $concat: ["$fName", " ", "$lName"] }, regex: searchRegExp } } },
                    { $expr: { $regexMatch: { input: { $concat: ["$userName"] }, regex: searchRegExp } } },
                    { email: { $regex: searchRegExp } },
                ],
            };
        }


        let ContentCreator = await UserModel.find({ role: "c_creator", emailVerified: true, ...filter }).limit(limit).skip((page - 1) * limit).sort({ createdAt: -1 }).select(['fName', 'lName', 'email', 'userName', 'uploadId', 'creator_category', 'website', 'socialLink', 'total_amount','description']);
        let totalUser = await UserModel.find({ role: "c_creator", emailVerified: true, ...filter }).countDocuments();

        //console.log(totalUser, ContentCreator.length)

        return res.status(200).json({
            status: 200, message: "All content creator", data: { "all_creator": ContentCreator }, pagination: {
                totalDocuments: totalUser,
                totalPage: Math.ceil(totalUser / limit),
                currentPage: page,
                previousPage: page - 1 > 0 ? page - 1 : null,
                nextPage: page + 1 <= Math.ceil(totalUser / limit) ? page + 1 : null,
            }
        })

    } catch (err) {

        next(err.message);

    }

}



exports.profileUpdate = async (req, res) => {

    let social = JSON.parse(req.body.socialLink);



    try {
        let { fName, lName, website, uploadId } = req.body;


        const documentId = req.params.id;




        if (req.files && req.files['uploadId']) {
            let imageFileName = '';
            if (req.files.uploadId[0]) {
                // Add public/uploads link to the image file


                imageFileName = `${req.protocol}://${req.get('host')}/upload/image/${req.files.uploadId[0].filename}`;
            }

            const userData = await UserModel.findById(documentId);
            let fname = fName ? fName : userData.fName;
            let lname = lName ? lName : userData.lName;
            let webSite = website ? website : userData.website;
            let sociallink = social ? social : userData.social;
            let uploadid = imageFileName ? imageFileName : userData.imageFileName;
            const update = {
                fName: fname,
                lName: lname,
                website: webSite,
                socialLink: sociallink,
                uploadId: uploadid
            }

            let updatedDoc = await UserModel.findByIdAndUpdate(documentId, update, { new: true }).select(["-password", "-termAndCondition", "-emailVerified", "-emailVerifyCode"]);
            let data = await UserModel.findByIdAndUpdate(documentId, update, { new: true }).select(["role"]);
            console.log(updatedDoc);
            let identity = data.role == "admin" ? true : false;
            //console.log(identity)
            if (updatedDoc) {
                return res.status(200).json({ status: 200, message: "Profile updated successfully", data: { "userInfo": updatedDoc, "identity": identity } })
            } else {
                return res.status(401).json({ status: 401, message: "Profile not updated" })
            }


        } else {
            const userData = await UserModel.findById(documentId);
            let fname = fName ? fName : userData.fName;
            let lname = lName ? lName : userData.lName;
            let webSite = website ? website : userData.website;
            let sociallink = social ? social : userData.social;

            const update = {
                fName: fname,
                lName: lname,
                website: webSite,
                socialLink: sociallink,

            }




            let updatedDoc = await UserModel.findByIdAndUpdate(documentId, update, { new: true }).select(["-password", "-termAndCondition", "-emailVerified", "-emailVerifyCode"]);
            let data = await UserModel.findByIdAndUpdate(documentId, update, { new: true }).select(["role"]);

            let identity = data.role == "admin" ? true : false;
            //console.log(identity)
            if (updatedDoc) {
                return res.status(200).json({ status: 200, message: "Profile updated successfully", data: { "userInfo": updatedDoc, identity } })
            } else {
                return res.status(401).json({ status: 401, message: "Profile not updated" })
            }

        }




    } catch {
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }

}


exports.searchContentCreator = async (req, res) => {

    let name = req.params.name;
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 2;
        const searchRegExp = new RegExp('.*' + name + '.*', 'i');
        const user = await UserModel.find({
            $or: [
                { $expr: { $regexMatch: { input: { $concat: ["$fName", " ", "$lName"] }, regex: searchRegExp } } },
                { $expr: { $regexMatch: { input: { $concat: ["$userName"] }, regex: searchRegExp } } }
            ]
        }).limit(limit).skip((page - 1) * limit).sort({ createdAt: -1 }).select(['fName', 'lName', 'email', 'userName', 'uploadId', 'creator_category', 'website', 'socialLink','description']);



        const totalUser = await UserModel.find({
            $or: [
                { $expr: { $regexMatch: { input: { $concat: ["$fName", " ", "$lName"] }, regex: searchRegExp } } }
            ]
        }).countDocuments();;

        return res.status(200).json({
            status: 200, data: { searchData: user }, pagination: {
                totalDocuments: totalUser,
                totalPage: Math.ceil(totalUser / limit),
                currentPage: page,
                previousPage: page - 1 > 0 ? page - 1 : null,
                nextPage: page + 1 <= Math.ceil(totalUser / limit) ? page + 1 : null,
            }
        })

    } catch (err) {
        return res.status(404).json({ status: 404, message: `Don't have any content create in this name ${name}` })
    }

}


exports.profileUpdateByadmin = async (req, res) => {

    if (req.user?.role == "admin") {

        try {
            let description = req.body?.description;
            let sociallink = req.body.socialLink;
            let { userName, email } = req.body;
            console.log(email)
            const user = await UserModel.findById(req.params.id)
            console.log("tushar", user)
            if (user) {
                const update = {
                    userName: userName,
                    socialLink: sociallink,
                    description

                }
                let data = await UserModel.findByIdAndUpdate(user?._id, update, { new: true }).select(["-password", "-termAndCondition", "-emailVerified", "-emailVerifyCode"]);

                return res.status(200).json({ status: 200, message: "Profile updated successfully" });
            } else {
                return res.status(404).json({ status: 404, message: "Profile not updated" });
            }

        } catch (err) {
            return res.status(401).json({ status: 401, message: "Unauthorized user2" });
        }
    } else {

        return res.status(401).json({ status: 401, message: "Unauthorized user" })
    }

}


