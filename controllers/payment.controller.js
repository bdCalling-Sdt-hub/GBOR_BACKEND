const Notification = require("../model/notificationSchema");
const PaymentModel = require("../model/paymentSchema");
const UserModel = require("../model/userSchema");
const mongoose = require("mongoose");
const { addManyNotifications, allNotifications, getAllNotification } = require("./notification.controller");

exports.addPayment = async (req, res, next) => {

    try {
        const { amount, donarName, message, creator, gborAmount } = req.body;

        if (!amount || !donarName || !message || !creator || !gborAmount) {
            return res.status(400).json({ status: 400, message: "All fields are required" });
        } else {
            const payment = new PaymentModel({
                amount,
                donarName,
                message,
                creator,
                gborAmount
            });

            const creatorData = await UserModel.findById(creator);
            await payment.save();

            const adminMessage = `${donarName} has donated ${amount} to ${creatorData.fName} ${creatorData.lName}`;
            const creatorMessage = `You have received ${amount} from ${donarName}`;

            const newNotification = [
                {
                    message: adminMessage,
                    image: creatorData.uploadId,
                    role: 'admin',
                    type: 'payment',
                    linkId: payment._id,
                    viewStatus: false
                },
                {
                    message: creatorMessage,
                    image: creatorData.uploadId,
                    role: 'c_creator',
                    type: 'payment',
                    linkId: payment._id,
                    receiverId: creator,
                    viewStatus: false
                }
            ];

            await addManyNotifications(newNotification);
            const adminNotification = await getAllNotification('admin', 1, 10);
            io.emit('admin-notification', adminNotification)
            const creatorNotification = await getAllNotification('c_creator', 1, 10, creator);
            io.to('room' + creator).emit('c_creator-notification', creatorNotification)
            return res.status(200).json({ status: 200, message: "Payment added successfully", data: payment });
        }
    } catch (err) {
        console.error(err);
        next(err.message);
    }
}

exports.getAllPayments = async (req, res, next) => {

    try {
        const requestType = !req.query.requestType ? 'today-income' : req.query.requestType;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 15;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthlyTime = 30 * 24 * 60 * 60 * 1000
        monthlyStartDate = new Date(new Date().getTime() - monthlyTime);
        monthlyEndDate = new Date();
        const weeklyTime = 7 * 24 * 60 * 60 * 1000
        weeklyStartDate = new Date(new Date().getTime() - weeklyTime);
        weeklyEndDate = new Date();

        let data;
        let totalPayments;

        var filter = {};
        if (req.user.role === "c_creator") {
            filter = { creator: req.user._id };
        }
        if (requestType === 'today-income') {
            const gborAmount = req.query.gborAmount;
            const name = req.query.search;

            if (gborAmount) {
                const amountRange = gborAmount.split('-');
                const minAmount = Number(amountRange[0]);
                const maxAmount = Number(amountRange[1]);
                //console.log('min and max amount --------->', minAmount, maxAmount);

                filter = { ...filter, gborAmount: { $gte: minAmount, $lte: maxAmount } };
            }
            if (name) {
                const searchRegExp = new RegExp('.*' + name + '.*', 'i');
                const matchingCreators = await mongoose.model('user').find({
                    $expr: { $regexMatch: { input: { $concat: ["$fName", " ", "$lName"] }, regex: searchRegExp } }
                });

                const creatorIds = matchingCreators.map(creator => creator._id);

                filter = { ...filter, creator: { $in: creatorIds } };
            }

            data = await PaymentModel.find({ createdAt: { $gte: today }, ...filter }).limit(limit).skip((page - 1) * limit).sort({ createdAt: -1 }).populate('creator');
            totalPayments = await PaymentModel.countDocuments({ createdAt: { $gte: today }, ...filter });
        }


        else if (requestType === 'weekly-income') {
            const today = new Date();
            const tenWeeksAgo = new Date(today);
            tenWeeksAgo.setDate(today.getDate() - 7 * 52);

            let totalPaymentsByWeek = {};

            for (let i = 51; i >= 0; i--) {
                const weeklyStartDate = new Date(tenWeeksAgo);
                weeklyStartDate.setDate(tenWeeksAgo.getDate() + (i * 7));

                const weeklyEndDate = new Date(tenWeeksAgo);
                weeklyEndDate.setDate(tenWeeksAgo.getDate() + ((i + 1) * 7));

                const weekWiseData = await PaymentModel.find({
                    createdAt: { $gte: weeklyStartDate, $lt: weeklyEndDate },
                    ...filter
                }).populate('creator');

                const key = `Week ${i + 1}`;
                if (!totalPaymentsByWeek[key]) {
                    totalPaymentsByWeek[key] = {
                        amount: 0,
                        totalDonors: 0
                    };
                }

                weekWiseData.forEach(payment => {
                    totalPaymentsByWeek[key].amount += (payment?.amount || 0);
                    totalPaymentsByWeek[key].totalDonors++;
                });
            }

            data = Object.keys(totalPaymentsByWeek).map(key => {
                return {
                    weekNo: key,
                    amount: totalPaymentsByWeek[key].amount,
                    totalDonors: totalPaymentsByWeek[key].totalDonors
                };
            });
        }


        else if (requestType === 'monthly-income') {
            const data_by_month = await PaymentModel.find({
                createdAt: { $gte: monthlyStartDate, $lt: monthlyEndDate },
                ...filter
            }).limit(limit).skip((page - 1) * limit).sort({ createdAt: -1 }).populate('creator');

            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            let totalPaymentsByMonth = {};

            data_by_month.forEach(payment => {
                const year = payment.createdAt.getFullYear();
                const month = payment.createdAt.getMonth();

                const key = `${monthNames[month]} ${year}`;

                if (!totalPaymentsByMonth[key]) {
                    totalPaymentsByMonth[key] = {
                        amount: 0,
                        totalDonors: 0
                    };
                }

                totalPaymentsByMonth[key].amount += (payment?.amount || 0);
                totalPaymentsByMonth[key].totalDonors++;
            });

            totalPayments = await PaymentModel.countDocuments({
                createdAt: { $gte: monthlyStartDate, $lt: monthlyEndDate },
                ...filter
            });

            data = Object.keys(totalPaymentsByMonth).map(key => {
                return {
                    monthName: key,
                    amount: totalPaymentsByMonth[key].amount,
                    totalDonors: totalPaymentsByMonth[key].totalDonors
                };
            });

            //console.log(data);
        }



        else {
            return res.status(404).json({ status: 404, message: "Request type not found" });
        }

        const todayPayments = await PaymentModel.find({ createdAt: { $gte: today }, ...filter });
        const lastWeekPayments = await PaymentModel.find({ createdAt: { $gte: weeklyStartDate, $lt: weeklyEndDate }, ...filter });
        const lastMonthPayments = await PaymentModel.find({ createdAt: { $gte: monthlyStartDate, $lt: monthlyEndDate }, ...filter });

        await PaymentModel.countDocuments();

        const todayTotal = todayPayments.reduce((total, payment) => total + payment.amount, 0);
        const lastWeekTotal = lastWeekPayments.reduce((total, payment) => total + payment.amount, 0);
        const lastMonthTotal = lastMonthPayments.reduce((total, payment) => total + payment.amount, 0);

        //console.log("totalPayments", totalPayments);

        return res.status(200).json({
            status: 200, message: "Payment retrieved successfully",
            data: {
                "data": data,
                "totals": {
                    today: todayTotal,
                    lastWeek: lastWeekTotal,
                    lastMonth: lastMonthTotal
                }
            },
            pagination: {
                totalDocuments: totalPayments,
                totalPage: Math.ceil(totalPayments / limit),
                currentPage: page,
                previousPage: page - 1 > 0 ? page - 1 : null,
                nextPage: page + 1 <= Math.ceil(totalPayments / limit) ? page + 1 : null,
            },
        });
    } catch (err) {
        console.error(err);
        next(err.message);
    }
}

exports.getPreviousDonors = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = await PaymentModel.find({ creator: id }).sort({ amount: -1 }).limit(12);
        return res.status(200).json({ status: 200, message: "Last donors retrieved successfully", data });
    } catch (err) {
        console.error(err);
        next(err.message);
    }
}

exports.exceptMessageView = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ status: 403, message: "Access denied" });
        }
        const id = req.params.id;
        const payment = await PaymentModel.findById(id);
        if (!payment) {
            return res.status(404).json({ status: 404, message: "Payment not found" });
        }
        else {
            payment.isMessageVisible = true;
            await payment.save();
            return res.status(200).json({ status: 200, message: "Payment message view updated successfully", data: payment });
        }
    } catch (err) {
        console.error(err);
        next(err.message);
    }
}
