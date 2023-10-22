const mongoose = require('mongoose')
const Notification = require("../model/notificationSchema");

async function addNotification(data) {
  try {

    // Create a new notification using the data provided
    const newNotification = new Notification(data);

    // Save the notification to the database
    await newNotification.save();
  }
  catch (error) {
    console.error("Error adding notification:", error);
  }
}
async function addManyNotifications(data) {
  try {

    // Create a new notification using the data provided
    await Notification.insertMany(data);
  }
  catch (error) {
    console.error("Error adding notification:", error);
  }
}
async function getAllNotification(type, limit = 10, page = 1, receiverId = null) {
  try {
    // Create a new notification using the data provided
    var allNotification
    var notViewed
    var count
    if (type === 'admin') {
      allNotification = await Notification.find({ type: type })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
      notViewed = await Notification.countDocuments({ viewStatus: 'false', type: type });
      count = await Notification.countDocuments({ type: type });
    }
    else if(type === 'user' || type === 'host'){
      allNotification = await Notification.find({ receiverId: receiverId, type: type })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
      notViewed = await Notification.countDocuments({ viewStatus: 'false', receiverId: receiverId, type: type });
      count = await Notification.countDocuments({ receiverId: receiverId, type: type });
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
    return data
  }
  catch (error) {
    console.error("Error adding notification:", error);
    return res.status(500).json({ status: 'Error', statusCode: '500', message: 'Server error in retriving notifications' });
  }
}

const allNotifications = async (req, res) => {

  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    var type = req.user.role
    var allNotification
    var notViewed
    var count
    if (type === 'admin') {
      allNotification = await Notification.find({ type: type })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
      notViewed = await Notification.countDocuments({ viewStatus: 'false', type: type });
      count = await Notification.countDocuments({ type: type });
    }
    else if(type === 'c_creator'){
      allNotification = await Notification.find({ receiverId: req.user._id, type: type })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
      notViewed = await Notification.countDocuments({ viewStatus: 'false', receiverId: req.user._id, type: type });
      count = await Notification.countDocuments({ receiverId: req.user._id, type: type });
    }
    else{
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
    if(type === 'admin'){
      io.emit('admin-notification', data)
    }
    else{
      io.to('room'+req.user._id).emit(`${type}-notification`, data)
    }
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

const getNotificationDetails = async (req, res) => {
  console.log(req.body)
  try {
    //extracting the notification id from param that is going to be edited
    const id = req.params.id
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    
    const notification = await Notification.findById(id)
    if (!notification.viewStatus) {
      notification.viewStatus = true
      await notification.save()
    }
    const type = notification.type
    //retriving all notifications
    const allNotification = await Notification.find({ type: type })
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
    const notViewed = await Notification.countDocuments({ viewStatus: 'false', type: type });
    const count = await Notification.countDocuments({ type: type });
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
    io.emit('admin-notification', data)
    console.log('details api response ----------------->',data)
    return res.status(200).json({ status: 'OK', statusCode: '200', type: 'notification', message: 'Notifications retrieved successfully', data: data })
  }
  catch (error) {
    console.error(error);
    //deleting the images if something went wrong

    return res.status(500).json({ status: 'Error', statusCode: '500', message: 'Error changing notification view-status' })
  }
};

async function updateAndGetNotificationDetails(notificationId, pages = 1, limits = 10) {
  console.log(req.body)
  try {
    //extracting the notification id from param that is going to be edited
    const id = notificationId
    const page = Number(pages) || 1;
    const limit = Number(limits) || 10;
    const notification = await Notification.findById(id)
    if (!notification.viewStatus) {
      notification.viewStatus = true
      await notification.save()
    }
    const type = notification.type
    //retriving all notifications
    const allNotification = await Notification.find({ type: type })
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
    const notViewed = await Notification.countDocuments({ viewStatus: 'false', type: type });
    const count = await Notification.countDocuments({ type: type });
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
    io.emit('admin-notification', data)
  }
  catch (error) {
    console.error(error);
    //deleting the images if something went wrong

    return res.status(500).json({ status: 'Error', statusCode: '500', message: 'Error changing notification view-status' })
  }
};


module.exports = { addNotification, addManyNotifications, getAllNotification, getNotificationDetails, allNotifications, updateAndGetNotificationDetails };