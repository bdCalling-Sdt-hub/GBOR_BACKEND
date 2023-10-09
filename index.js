const express = require("express");
const cors = require("cors")
require("dotenv").config();
const port = process.env.PORT || 5000
const app = express()
const userRoute = require("./Routes/user.route")
const dbconection = require("./config/dbconection")
const aboutAndPrivacyRoute=require("./Routes/aboutAndPrivacy.route")
const bannerRoute=require("./Routes/banner.route")
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const dburl = process.env.DB_URL

dbconection(dburl)

app.use("/api/auth/", userRoute);
app.use("/api/",aboutAndPrivacyRoute)
app.use("/api/",bannerRoute)

app.use('/upload/image', express.static(__dirname + '/upload/image/'));

app.use((err, req, res, next) => {
    //console.error("error tushar",err.message);
    res.status(500).json({ message: err.message });
});

app.listen(port,"192.168.10.13",() => {
    console.log(`server running in ${port}`)
    console.log("ok all right everything")
})