var menuData = {};

function closeMenus() {
  var menuItems = document.getElementsByClassName("menu-item");
  for (let menuItem of menuItems) {
    var subMenu = getSubMenu(menuItem);
    if (subMenu) {
      subMenu.style.display = "none";
      menuItem.classList.remove("open");
    }
  }
  menuData.open = false;
  document.body.removeEventListener("click", closeMenus);
}

function getSubMenu(parentEl) {
  var subMenuId = parentEl?.attributes?.submenu?.value;
  if (!subMenuId) return;
  var subMenu = document.getElementById(subMenuId);
  if (!subMenu || !subMenu.classList.contains("submenu")) return;
  return subMenu;
}

function toggleMenu(menuItem, targetState) {
  if (targetState === undefined) targetState = !menuItem.classList.contains("open");
  
  var subMenu = getSubMenu(menuItem);
  if (!subMenu) return;
  if (targetState) {
    closeMenus();
    var thisRect = menuItem.getBoundingClientRect();
    subMenu.style.display = "block";
    subMenu.style.top = thisRect.bottom - 1;
    subMenu.style.left = thisRect.left;
    subMenu.onclick = (e) => { e.stopPropagation(); };
    menuItem.classList.add("open");
    menuData.open = true;

    setTimeout(() => { document.body.addEventListener("mousedown", closeMenus) }, 0);
  } else {
    closeMenus();
  }
}

function menuMouseOver(e) {
  if (menuData.open) {
    toggleMenu(this, true);
  }
}

// TODO: Consider allowing callbacks to be added
function menuItemClicked(e) {
  var recognised = true;
  if (this.id == "file-open") {
    document.getElementById("file").click();
  } else if (this.id == "edit-copy") {
    if (globals.activeTableView) {
      globals.tableViews[globals.activeTableView].copyDataToClipboard();
    }
  } else if (this.id == "edit-copy-headers") {
    if (globals.activeTableView) {
      globals.tableViews[globals.activeTableView].copyDataToClipboard(true, true);
    }
  } else if (this.id == "edit-select-all") {
    if (globals.activeTableView >= 0) {
      globals.tableViews[globals.activeTableView].selectAll();
    }
  } else if (this.id == "edit-find") {
    findWindow.show();
  } else {
    recognised = false;
  }
  if (recognised) closeMenus();
  e.stopPropagation();
}

function initialiseMenus() {
  var els = document.getElementsByClassName("menu-item");
  for (let el of els) {
    var subId = el.attributes.submenu?.value;
    if (subId) {
      el.onmousedown = (e) => { toggleMenu(el); e.stopPropagation(); };
      el.onmouseover = menuMouseOver;
    }
  }

  wla = document.getElementsByClassName("submenu");
  for (let el of els) {
    let items = el.getElementsByTagName("p");
    for (let item of items) {
      item.onmousedown = (e) => { e.stopPropagation(); };
      item.onmouseup = menuItemClicked;
    }
  }
}

window.addEventListener("load", initialiseMenus);