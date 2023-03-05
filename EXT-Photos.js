/**
 ** Module : EXT-Photos
 ** @bugsounet
 ** ©02-2022
 ** support: https://forum.bugsounet.fr
 **/

logPhotos = (...args) => { /* do nothing */ }

Module.register("EXT-Photos", {
  defaults: {
    debug: false,
    displayDelay: 20 * 1000,
    loop: false
  },

  start: function () {
    if (this.config.debug) logPhotos = (...args) => { console.log("[PHOTOS]", ...args) }
    this.photos= {
      position: 0,
      urls: [],
      length: 0,
      running: false
    }
    this.timerPhoto = null
  },

  getDom: function() {
    var dom = document.createElement("div")
    dom.style.display = 'none'
    return dom
  },

  getStyles: function () {
    return [
      "EXT-Photos.css"
    ]
  },

  getTranslations: function() {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json"
    }
  },

  notificationReceived: function(noti, payload, sender) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.preparePopup()
        this.sendSocketNotification("INIT")
        break
      case "GAv5_READY":
        if (sender.name == "MMM-GoogleAssistant") this.sendNotification("EXT_HELLO", this.name)
        break
      case "EXT_PHOTOS-OPEN":
        logPhotos("Received:", payload)
        if (!payload || !payload.length) {
          this.sendNotification("EXT_ALERT", {
            message: this.translate("PhotosError"),
            type: "error"
          })
          return
        }
        this.photos.urls = payload
        this.photos.position = 0
        this.photos.length = payload.length
        this.startPhotos()
        break
      case "EXT_STOP":
        if (this.photos.running) {
          this.resetPhotos()
          this.endPhotos()
        }
        break
      case "EXT_PHOTOS-CLOSE":
        if (this.photos.running) {
          this.resetPhotos()
          this.endPhotos(true)
        }
        break
    }
  },

  /*********************/
  /** Popup Displayer **/
  /*********************/

  preparePopup: function() {
    var Photos = document.createElement("div")
    Photos.id = "EXT_PHOTOS"
    Photos.classList.add("hidden")
    var backPhoto = document.createElement("div")
    backPhoto.id = "EXT_PHOTOS_BACK"
    var currentPhoto = document.createElement("div")
    currentPhoto.id = "EXT_PHOTOS_CURRENT"
    currentPhoto.addEventListener('animationend', ()=>{
      currentPhoto.classList.remove("animated")
    })
    Photos.appendChild(backPhoto)
    Photos.appendChild(currentPhoto)
    document.body.appendChild(Photos)
  },

  startPhotos: function() {
    if (!this.photos.running) this.sendNotification("EXT_ALERT", {
      message: this.translate("PhotosOpen"),
      type: "information",
      icon: "modules/EXT-Photos/resources/Photos-Logo.png"
    })
    this.sendNotification("EXT_PHOTOS-CONNECTED")
    this.hideModules()
    this.showPhotos()
    this.photoDisplay()
  },

  endPhotos: function(extAlert=false) {
    if (extAlert) this.sendNotification("EXT_ALERT", {
      message: this.translate("PhotosClose"),
      type: "information",
      icon: "modules/EXT-Photos/resources/Photos-Logo.png"
    })
    this.sendNotification("EXT_PHOTOS-DISCONNECTED")
    this.hidePhotos()
    this.showModules()
  },

  showPhotos: function () {
    logPhotos("Show Photos Iframe")
    var iframe = document.getElementById("EXT_PHOTOS")
    iframe.classList.remove("hidden")
  },

  hidePhotos: function () {
    logPhotos("Hide Photos Iframe")
    var iframe = document.getElementById("EXT_PHOTOS")
    iframe.classList.add("hidden")
  },

  hideModules: function () {
    MM.getModules().enumerate((module)=> {
      module.hide(100, {lockString: "EXT_PHOTOS-LOCKED"})
    })
  },

  showModules: function () {
    MM.getModules().enumerate((module)=> {
      module.show(100, {lockString: "EXT_PHOTOS-LOCKED"})
    })
  },

/** photos code **/
  photoDisplay: function () {
    this.photos.running = true
    logPhotos("Loading photo #" + (this.photos.position) + "/" + (this.photos.length-1))
    var hidden = document.createElement("img")
    hidden.onerror = () => {
      this.sendNotification("EXT_ALERT", {
        message: this.translate("PhotosError"),
        type: "warning",
        icon: "modules/EXT-Photos/resources/Photos-Logo.png"
      })
      logPhotos("Photo Loading Error... retry with next")
      clearTimeout(this.timerPhoto)
      this.timerPhoto = null
      this.photoNext()
    }
    hidden.onload = () => {
      var back = document.getElementById("EXT_PHOTOS_BACK")
      var current = document.getElementById("EXT_PHOTOS_CURRENT")
      var dom = document.getElementById("EXT_PHOTOS")
      logPhotos("URL=", this.photos.urls[this.photos.position])
      back.style.backgroundImage = `url(${this.photos.urls[this.photos.position]})`
      current.style.backgroundImage = `url(${this.photos.urls[this.photos.position]})`
      current.classList.add("animated")
      this.timerPhoto = setTimeout( () => {
        this.photoNext()
      }, this.config.displayDelay)
    }
    hidden.src = this.photos.urls[this.photos.position]
  },

  photoNext: function () {
    if (this.photos.position >= (this.photos.length-1)) {
      if (this.config.loop) {
        this.photos.position = 0
        this.photoDisplay()
      } else {
        this.resetPhotos()
        this.endPhotos(true)
      }
    } else {
      this.photos.position++
      this.photoDisplay()
    }
  },

  resetPhotos: function () {
    var back = document.getElementById("EXT_PHOTOS_BACK")
    var current = document.getElementById("EXT_PHOTOS_CURRENT")
    clearTimeout(this.timerPhoto)
    this.timerPhoto = null
    this.photos= {
      position: 0,
      urls: [],
      length: 0,
      running: false
    }
    back.removeAttribute("style")
    current.removeAttribute("style")
    logPhotos("Reset Photos", this.photos)
  }
})
