class FindWindowClass {
  text = "";
  visible = false;
  windowElement = null;
  title = null;
  windowMoving = { moving: false };
  findTextInput = null;
  findButton = null;
  findCallback = null;

  constructor(findCallback) {
    this.createWindow();
    this.findCallback = findCallback ?? null;
  }

  get findText() { return this.findTextInput.value; }

  startMoving(e) {
    if (e.button === 0) {
      if (this.windowMoving?.moving) {
        this.stopMoving();
      } else {
        this.windowMoving.moving = true;
        this.windowMoving.startX = this.windowElement.offsetLeft;
        this.windowMoving.startY = this.windowElement.offsetTop;
        this.windowMoving.startMouseX = e.clientX;
        this.windowMoving.startMouseY = e.clientY;
        this.windowMoving.moveListener = this.continueMoving.bind(this);
        this.windowMoving.upListener = this.stopMoving.bind(this);
        window.addEventListener("mousemove", this.windowMoving.moveListener);
      }
    }
  }

  continueMoving(e) {
    var diffX = e.clientX - this.windowMoving.startMouseX;
    var diffY = e.clientY - this.windowMoving.startMouseY;
    var minLeft = 10, minTop = 10;
    var maxLeft = window.innerWidth - this.windowElement.clientWidth - minLeft;
    var maxTop = window.innerHeight - this.windowElement.clientHeight - minTop;
    var winLeft = this.windowMoving.startX + diffX;
    var winTop = this.windowMoving.startY + diffY;
    winLeft = Math.max(minLeft, Math.min(winLeft, maxLeft));
    winTop = Math.max(minTop, Math.min(winTop, maxTop));
    this.windowElement.style.left = winLeft + "px";
    this.windowElement.style.top = winTop + "px";
  }

  stopMoving(e) {
    if (this.windowMoving?.moving) {
      window.removeEventListener("mousemove", this.windowMoving.moveListener);
    }
    this.windowMoving.moving = false;
  }

  createTitle() {
    this.title = this.windowElement.getElementsByClassName("window-title")[0];
    this.title.onmousedown = this.startMoving.bind(this);
    window.addEventListener("mouseup", this.stopMoving.bind(this));
    this.createTitleButtons();
  }

  createTitleButtons() {
    var closeBtn = this.windowElement.getElementsByClassName("window-close")[0];
    closeBtn.onmousedown = function(e) { e.stopPropagation(); };
    closeBtn.onmouseup = (function(e) {
      if (e.button === 0) this.hide();
    }).bind(this);
  }

  createFindInput() {
    for (let inp of this.windowElement.getElementsByTagName("input")) {
      if (inp.type == "text") {
        this.findTextInput = inp;
        this.findTextInput.onkeydown = (e) => {
          if (e.keyCode === 13 /* Enter key */) {
            this.find();
            // TODO: Dodgy hack to retain focus. Revise.
            var f = () => { this.findTextInput.focus(); };
            setTimeout(f, 100);
          }
        }
      }
    }
  }

  createFindButton() {
    this.findButton = this.windowElement.getElementsByTagName("button")[0];
    this.findButton.onclick = this.find.bind(this);
  }

  createWindow() {
    this.windowElement = document.getElementById("find-window");
    this.createTitle();
    this.createFindInput();
    this.createFindButton();
  }

  find() {
    if (this.findCallback && typeof this.findCallback === "function") {
      this.findCallback(this.findText);
    }
  }

  show() {
    this.windowElement.style.display = "block";
    this.findTextInput.focus();
    this.findTextInput.selectionStart = 0;
    this.findTextInput.selectionEnd = this.findTextInput.value.length;
  }

  hide() {
    this.windowElement.style.display = "none";
  }
}