const PaymentModel = require("../model/paymentSchema");

exports.addPayment = async (req, res, next) => {
    console.log("req.body", req.body)
    try {
        const { amount, donarName, message, creator } = req.body
        if(!amount || !donarName || !message || !creator){
            return res.status(400).json({ status: 400, message: "All fields are required" });
        }
        else{
            const payment = new PaymentModel({
                amount,
                donarName,
                message,
                creator
            })
            const newPayment = await payment.save()
            return res.status(200).json({ status: 200, message: "Payment added successfully", data: newPayment });
        }
    } catch (err) {
        next(err.message);
    }
}


exports.getAllPayments = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 15;
        var data;
        if(req.user.role === "admin"){
            data = await PaymentModel.find().limit(limit).skip((page - 1) * limit).sort({ createdAt: -1 }).populate('creator');
        }
        else{
            data = await PaymentModel.find({creator:req.user._id}).limit(limit).skip((page - 1) * limit).sort({ createdAt: -1 }).populate('creator');
        }
        const totalPayments = await PaymentModel.countDocuments();

        console.log("totalPayments", req.body,totalPayments)
        return res.status(200).json({
            status: 200, message: "All content creator", 
            data: { 
                "all_creator": data 
            }, 
            pagination: {
                totalDocuments: totalPayments,
                totalPage: Math.ceil(totalPayments / limit),
                currentPage: page,
                previousPage: page - 1 > 0 ? page - 1 : null,
                nextPage: page + 1 <= Math.ceil(totalPayments / limit) ? page + 1 : null,
            }
        })

    } catch (err) {
        next(err.message);
    }
}