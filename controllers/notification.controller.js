const mongoose = require('mongoose')
const Notification = require("../model/notificationSchema");
const UserModel = require('../model/userSchema');
const Payment = require('../model/paymentSchema');

async function addNotification(data) {
  try {

    // Create a new notification using the data provided
    const newNotification = new Notification(data);

    // Save the notification to the database
    await newNotification.save();
  }
  catch (error) {
    //console.error("Error adding notification:", error);
  }
}
async function addManyNotifications(data) {
  try {

    // Create a new notification using the data provided
    await Notification.insertMany(data);
  }
  catch (error) {
    //console.error("Error adding notification:", error);
  }
}
const allNotifications = async (req, res) => {

  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    var role = req.user.role
    var allNotification
    var notViewed
    var count
    //console.log('tupe', role)
    if (role === 'admin') {
      allNotification = await Notification.find({ role: role })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
      notViewed = await Notification.countDocuments({ viewStatus: 'false', role: role });
      count = await Notification.countDocuments({ role: role });
    }
    else if (role === 'c_creator') {
      allNotification = await Notification.find({ receiverId: req.user._id, role: role })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
      notViewed = await Notification.countDocuments({ viewStatus: 'false', receiverId: req.user._id, role: role });
      count = await Notification.countDocuments({ receiverId: req.user._id, role: role });
      console.log('creator->', req.user.lName, allNotification.length, notViewed)
    }
    else {
      return res.status(500).json(
        {
          status: 'Error',
          statusCode: '500',
          type: 'notifications',
          message: 'Role not specified for notifications',
        })
    }
    const data = {
      allNotification,
      notViewed: notViewed,
      pagination: {
        totalDocuments: count,
        totalPage: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page > 1 ? page - 1 : null,
        nextPage: page < Math.ceil(count / limit) ? page + 1 : null,
      },
    }
    if (role === 'admin') {
      io.emit('admin-notification', data)
    }
    else {
      io.to('room' + req.user._id).emit(`${role}-notification`, data)
    }
    //console.log('notification length -->', allNotification.length)
    return res.status(200).json(
      {
        status: 'OK',
        statusCode: '200',
        type: 'notification',
        message: 'Notifications retrieved successfully',
        data: data
      })
  }
  catch (error) {
    console.log(error);
    return res.status(500).json(
      {
        status: 'Error',
        statusCode: '500',
        message: 'Error getting notifications',
      })
  }
};

async function getAllNotification(role, limit = 10, page = 1, receiverId = null) {
  try {
    // Create a new notification using the data provided
    var allNotification
    var notViewed
    var count
    if (role === 'admin') {
      allNotification = await Notification.find({ role: role })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
      notViewed = await Notification.countDocuments({ viewStatus: 'false', role: role });
      count = await Notification.countDocuments({ role: role });
      console.log('admin data', allNotification.length, notViewed)
    }
    else if (role === 'c_creator') {
      allNotification = await Notification.find({ receiverId: receiverId, role: role })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
      notViewed = await Notification.countDocuments({ viewStatus: 'false', receiverId: receiverId, role: role });
      count = await Notification.countDocuments({ receiverId: receiverId, role: role });
      console.log('c_creator data', allNotification.length, notViewed)
    }
    const data = {
      allNotification,
      notViewed: notViewed,
      pagination: {
        totalDocuments: count,
        totalPage: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page > 1 ? page - 1 : null,
        nextPage: page < Math.ceil(count / limit) ? page + 1 : null,
      },
    }
    console.log('received notification--->', role, allNotification.length)
    return data
  }
  catch (error) {
    console.error("Error adding notification:", error);
    return res.status(500).json({ status: 'Error', statusCode: '500', message: 'Server error in retriving notifications' });
  }
}

const getNotificationDetails = async (req, res) => {
  //console.log(req.body)
  try {

    const id = req.params.id
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const notification = await Notification.findById(id);
    console.log(notification);
    if (!notification.viewStatus) {
      notification.viewStatus = true
      await Notification.findByIdAndUpdate(notification._id, { viewStatus: true }, { options: true })
    }
    const role = notification.role
    const type = notification.type
    var details
    if (role === 'user') {
      details = await UserModel.findById(notification.linkId).populate('creator')
      console.log("notification.linkId", notification.linkId, details)
    }
    else if (type === 'payment') {
      details = await Payment.findById(notification.linkId).populate('creator')
    }
    //retriving all notifications
    const allNotification = await Notification.find({ role: role })
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
    const notViewed = await Notification.countDocuments({ viewStatus: 'false', role: role });
    const count = await Notification.countDocuments({ role: role });
    const data = {
      allNotification,
      notViewed: notViewed,
      pagination: {
        totalDocuments: count,
        totalPage: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page > 1 ? page - 1 : null,
        nextPage: page < Math.ceil(count / limit) ? page + 1 : null,
      },
    }
    if (role === 'admin') {
      io.emit('admin-notification', data)
    }
    else if (role === 'c_creator') {
      io.to('room' + notification.receiverId.toString()).emit(`${role}-notification`, data)
    }
    //console.log('details api response ----------------->', details)
    return res.status(200).json({ status: 'OK', statusCode: '200', type: type, message: 'Notifications retrieved successfully', data: details })
  }
  catch (error) {
    console.error(error);
    //deleting the images if something went wrong

    return res.status(500).json({ status: 'Error', statusCode: '500', message: error.message });
  }
};

module.exports = { addNotification, addManyNotifications, getNotificationDetails, allNotifications, getAllNotification };