const Notification = require("../model/notificationSchema");
const PaymentModel = require("../model/paymentSchema");
const UserModel = require("../model/userSchema");
const mongoose = require("mongoose");
const {
  addManyNotifications,
  allNotifications,
  getAllNotification,
} = require("./notification.controller");

exports.addPayment = async (req, res, next) => {
  console.log(req.body);
  try {
    const { amount, donarName, message, creator, gborAmount, c_userName } =
      req.body;

    if (!amount || !donarName || !message || !creator || !gborAmount) {
      return res
        .status(400)
        .json({ status: 400, message: "All fields are required" });
    } else {
      const payment = new PaymentModel({
        amount,
        donarName,
        message,
        creator,
        gborAmount,
        c_userName,
      });
      //console.log(creator)
      const creatorData = await UserModel.findById(creator);
      console.log(creatorData);
      let creatorAmount =
        parseInt(creatorData.total_amount) + parseInt(gborAmount);

      let updatedDoc = await UserModel.findByIdAndUpdate(
        creator,
        { $set: { total_amount: creatorAmount } },
        { new: true }
      );
      //console.log(updatedDoc);
      await payment.save();

      const adminMessage = `${donarName} has donated ${amount} to ${creatorData.fName} ${creatorData.lName}`;
      const creatorMessage = `You have received ${amount} from ${donarName}`;

      const newNotification = [
        {
          message: adminMessage,
          image: creatorData.uploadId,
          role: "admin",
          type: "payment",
          linkId: payment._id,
          viewStatus: false,
        },
        {
          message: creatorMessage,
          image: creatorData.uploadId,
          role: "c_creator",
          type: "payment",
          linkId: payment._id,
          receiverId: creator,
          viewStatus: false,
        },
      ];

      await addManyNotifications(newNotification);
      const adminNotification = await getAllNotification("admin", 10, 1);
      io.emit("admin-notification", adminNotification);
      const creatorNotification = await getAllNotification(
        "c_creator",
        10,
        1,
        creator
      );
      io.to("room" + creator).emit(
        "c_creator-notification",
        creatorNotification
      );
      return res.status(200).json({
        status: 200,
        message: "Payment added successfully",
        data: payment,
      });
    }
  } catch (err) {
    //console.error(err);
    next(err.message);
  }
};

exports.getAllPayments = async (req, res, next) => {
  try {
    const requestType = req.query.requestType;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;

    console.log("request type : ---->", requestType, limit, page);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthlyTime = 30 * 24 * 60 * 60 * 1000;
    monthlyStartDate = new Date(new Date().getTime() - monthlyTime);
    monthlyEndDate = new Date();
    const weeklyTime = 7 * 24 * 60 * 60 * 1000;
    weeklyStartDate = new Date(new Date().getTime() - weeklyTime);
    weeklyEndDate = new Date();

    let data;
    let totalPayments;

    var filter = {};
    if (req.user.role === "c_creator") {
      filter = { creator: req.user._id };
    }

    if (!requestType) {
      return res
        .status(404)
        .json({ status: 404, message: "Request type not found" });
    }

    if (requestType === "dashboard") {
      data = await PaymentModel.find({ ...filter })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .populate("creator");
      totalPayments = await PaymentModel.countDocuments({ ...filter });
    }

    if (requestType === "today-income") {
      const gborAmount = !req.query.gborAmount ? "" : req.query.gborAmount;
      const name = req.query.search;
      //console.log('gborAmount --------->', gborAmount);

      if (gborAmount) {
        const amountRange = gborAmount.split("-");
        const minAmount = Number(amountRange[0]);
        const maxAmount = Number(amountRange[1]);
        //console.log('min and max amount --------->', minAmount, maxAmount);

        filter = {
          ...filter,
          gborAmount: { $gte: minAmount, $lte: maxAmount },
        };
      }
      if (name) {
        const searchRegExp = new RegExp(".*" + name + ".*", "i");
        const matchingCreators = await mongoose.model("user").find({
          $expr: {
            $regexMatch: {
              input: { $concat: ["$fName", " ", "$lName"] },
              regex: searchRegExp,
            },
          },
          $expr: {
            $regexMatch: {
              input: { $concat: ["$userName"] },
              regex: searchRegExp,
            },
          },
        });

        const creatorIds = matchingCreators.map((creator) => creator._id);

        filter = { ...filter, creator: { $in: creatorIds } };
      }

      data = await PaymentModel.find({ createdAt: { $gte: today }, ...filter })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .populate("creator");
      totalPayments = await PaymentModel.countDocuments({
        createdAt: { $gte: today },
        ...filter,
      });
    }

    if (requestType === "weekly-income") {
      const today = new Date();
      const tenWeeksAgo = new Date(today);
      tenWeeksAgo.setDate(today.getDate() - 7 * 52);

      let totalPaymentsByWeek = {};

      for (let i = 51; i >= 0; i--) {
        const weeklyStartDate = new Date(tenWeeksAgo);
        weeklyStartDate.setDate(tenWeeksAgo.getDate() + i * 7);

        const weeklyEndDate = new Date(tenWeeksAgo);
        weeklyEndDate.setDate(tenWeeksAgo.getDate() + (i + 1) * 7);

        const weekWiseData = await PaymentModel.find({
          createdAt: { $gte: weeklyStartDate, $lt: weeklyEndDate },
          ...filter,
        }).populate("creator");

        const key = `Week ${i + 1}`;
        if (!totalPaymentsByWeek[key]) {
          totalPaymentsByWeek[key] = {
            amount: 0,
            totalDonors: 0,
          };
        }

        weekWiseData.forEach((payment) => {
          totalPaymentsByWeek[key].amount += payment?.amount || 0;
          totalPaymentsByWeek[key].totalDonors++;
        });
      }

      data = Object.keys(totalPaymentsByWeek).map((key) => {
        return {
          weekNo: key,
          gborAmount: totalPaymentsByWeek[key].amount / 500,
          amount: totalPaymentsByWeek[key].amount,
          totalDonors: totalPaymentsByWeek[key].totalDonors,
        };
      });
    }

    if (requestType === "monthly-income") {
      const data_by_month = await PaymentModel.find({
        createdAt: { $gte: monthlyStartDate, $lt: monthlyEndDate },
        ...filter,
      });

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      //console.log("monthly data ---->", data_by_month.length)

      let totalPaymentsByMonth = {};

      data_by_month.forEach((payment) => {
        const year = payment.createdAt.getFullYear();
        const month = payment.createdAt.getMonth();

        const key = `${monthNames[month]} ${year}`;

        if (!totalPaymentsByMonth[key]) {
          totalPaymentsByMonth[key] = {
            amount: 0,
            totalDonors: 0,
          };
        }

        totalPaymentsByMonth[key].amount += payment?.amount || 0;
        totalPaymentsByMonth[key].totalDonors++;
      });

      totalPayments = await PaymentModel.countDocuments({
        createdAt: { $gte: monthlyStartDate, $lt: monthlyEndDate },
        ...filter,
      });

      data = Object.keys(totalPaymentsByMonth).map((key) => {
        return {
          monthName: key,
          gborAmount: totalPaymentsByMonth[key].amount / 500,
          amount: totalPaymentsByMonth[key].amount,
          totalDonors: totalPaymentsByMonth[key].totalDonors,
        };
      });

      //console.log(data);
    }

    const todayPayments = await PaymentModel.find({
      createdAt: { $gte: today },
      ...filter,
    });
    const lastWeekPayments = await PaymentModel.find({
      createdAt: { $gte: weeklyStartDate, $lt: weeklyEndDate },
      ...filter,
    });
    const lastMonthPayments = await PaymentModel.find({
      createdAt: { $gte: monthlyStartDate, $lt: monthlyEndDate },
      ...filter,
    });

    await PaymentModel.countDocuments();

    const todayTotal = todayPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );
    const lastWeekTotal = lastWeekPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );
    const lastMonthTotal = lastMonthPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    //console.log("totalPayments", totalPayments);

    return res.status(200).json({
      status: 200,
      message: "Payment retrieved successfully",
      data: {
        data: data,
        totals: {
          today: todayTotal,
          lastWeek: lastWeekTotal,
          lastMonth: lastMonthTotal,
        },
      },
      pagination: {
        totalDocuments: totalPayments,
        totalPage: Math.ceil(totalPayments / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage:
          page + 1 <= Math.ceil(totalPayments / limit) ? page + 1 : null,
      },
    });
  } catch (err) {
    //console.error(err);
    next(err.message);
  }
};

exports.getAllDonorList = async (req, res, next) => {
  try {
    const id = req.params.id;
    var filter = {};
    const gborAmount = !req.query.gborAmount ? "" : req.query.gborAmount;
    const name = req.query.search;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    //console.log('gborAmount --------->', gborAmount);

    if (gborAmount) {
      const amountRange = gborAmount.split("-");
      const minAmount = Number(amountRange[0]);
      const maxAmount = Number(amountRange[1]);
      //console.log('min and max amount --------->', minAmount, maxAmount);

      filter = { ...filter, gborAmount: { $gte: minAmount, $lte: maxAmount } };
    }
    if (name) {
      const searchRegExp = new RegExp(".*" + name + ".*", "i");
      filter = {
        ...filter,
        donarName: { $regex: searchRegExp },
      };
    }
    if (req.user.role === "c_creator") {
      const data = await PaymentModel.find({ creator: id, ...filter })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
      const totalUser = await PaymentModel.countDocuments({
        creator: id,
        ...filter,
      });
      return res.status(200).json({
        status: 200,
        message: "Donor list retrieved successfully",
        data: data,
        pagination: {
          totalDocuments: totalUser,
          totalPage: Math.ceil(totalUser / limit),
          currentPage: page,
          previousPage: page - 1 > 0 ? page - 1 : null,
          nextPage: page + 1 <= Math.ceil(totalUser / limit) ? page + 1 : null,
        },
      });
    } else {
      return res.status(403).json({ status: 403, message: "Access denied" });
    }
  } catch (err) {
    console.error(err);
    next(err.message);
  }
};

exports.getPreviousDonors = async (req, res, next) => {
  try {
    const name = req.params.username;
    //const data = await PaymentModel.find({ creator: id }).sort({ amount: -1 }).limit(12);
    const data = await PaymentModel.find({ c_userName: name })
      .sort({ amount: -1 })
      .limit(12);
    return res.status(200).json({
      status: 200,
      message: "Last donors retrieved successfully",
      data,
    });
  } catch (err) {
    console.error(err);
    next(err.message);
  }
};

exports.getAllComments = async (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;

  try {
    let query = {};
    if (searchTerm) {
      // Create a regex pattern for case-insensitive search
      const regex = new RegExp(searchTerm, "i");
      // Build the query to search for users based on userName
      const users = await mongoose.model("user").find({ userName: regex });
      // Extract user IDs from the found users
      const userIds = users.map((user) => user._id);
      // Use the found user IDs to search for comments
      query.creator = { $in: userIds };
    }

    const result = await PaymentModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("creator");

    const total = await PaymentModel.countDocuments(query);

    return res.status(200).json({
      status: 200,
      message: "All comments retrieved successfully",
      pagination: {
        page,
        limit,
        total,
      },
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.reportMessageToAdmin = async (req, res, next) => {
  try {
    const id = req.params.id;
    const payment = await PaymentModel.findById(id);

    if (!payment) {
      return res
        .status(404)
        .json({ status: 404, message: "Payment not found" });
    }

    payment.reportStatus = true;
    await payment.save();
    const adminMessage = `${req.user.userName} reported a comment`;

    const newNotification = [
      {
        message: adminMessage,
        image: req.user.uploadId,
        role: "admin",
        type: "creator-messages",
        linkId: id,
        viewStatus: false,
      },
    ];

    await addManyNotifications(newNotification);
    const adminNotification = await getAllNotification("admin", 10, 1);
    io.emit("admin-notification", adminNotification);

    return res.status(200).json({
      status: 200,
      message: "Report send successfully",
      data: payment,
    });
  } catch (err) {
    console.error(err);
    next(err.message);
  }
};

exports.exceptMessageView = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ status: 403, message: "Access denied" });
    }
    const id = req.params.id;
    const payment = await PaymentModel.findById(id);
    if (!payment) {
      return res
        .status(404)
        .json({ status: 404, message: "Payment not found" });
    } else {
      payment.isMessageVisible = false;
      payment.reportStatus = false;
      await payment.save();
      return res.status(200).json({
        status: 200,
        message: "Payment message view updated successfully",
        data: payment,
      });
    }
  } catch (err) {
    console.error(err);
    next(err.message);
  }
};
