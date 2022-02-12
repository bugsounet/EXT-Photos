"use strict"

var NodeHelper = require("node_helper")
var log = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({
  socketNotificationReceived: function (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[PHOTOS] EXT-Photos Version:", require('./package.json').version, "rev:", require('./package.json').rev)
      break
    }
  }
})
