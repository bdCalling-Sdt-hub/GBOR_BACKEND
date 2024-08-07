const jwt = require("jsonwebtoken");
const UserModel=require("../model/userSchema")

exports.checkuser = async(req, res, next) => {
    
    const { authorization } = req.headers;
    let token;
    if (authorization && authorization.startsWith("Bearer")) {
        try {
            token = authorization.split(" ")[1]; 
            const {userID} = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await UserModel.findById({ _id: userID }).select("-password")
            
            next()
        } catch (e) {
            return res.status(401).send({ "status": 401, "messege": "Unauthorized user" })   

        }
        
    }

    if (!token) {
       return res.status(401).send({ "status": 401, "messege": "Unauthorized user. No token" })   

    }
    
}