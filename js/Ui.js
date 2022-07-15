function createTitle(text) {
  let expander = document.createElement("p");
  let title = document.createElement("p");
  expander.innerText = "+";
  expander.classList.add("tableSetExpander");
  title.innerText = text;
  title.classList.add("tableSetName");
  return [expander, title];
}

function generateHtmlTree(content, route) {
  route = route ?? [];
  var rootNode = document.createElement("ul");
  for (let item of content.index) {
    let el = document.createElement("li");
    if (item.type == "TableSet") {
      let expander, title;
      [expander, title] = createTitle(content.tableSets[item.index].name);
      var subTree = generateHtmlTree(content.tableSets[item.index], [...route, item.index]);
      subTree.hidden = true;
      el.appendChild(expander);
      el.appendChild(title);
      el.appendChild(subTree);
      el.classList.add("tableSetNode");
    } else if (item.type == "Table") {
      el.innerHTML = "<p>" + content.tables[item.index].name + "</p>";
      el.classList.add("tableNode");
      el.attributes.route = [...route, item.index];
    } else {
      throw("Unexpected item, cannot populate index!")
    }
    rootNode.appendChild(el);
  }
  return rootNode;
}

function toggleTableSet(tableSetEl) {
  var exs = tableSetEl.getElementsByClassName("tableSetExpander");
  var uls = tableSetEl.getElementsByTagName("ul");
  if (exs.length === 0) return;
  if (uls.length === 0) return;
  var ex = exs[0];
  var ul = uls[0];
  ul.hidden = !ul.hidden;
  ex.innerText = ul.hidden ? "+" : "-";
}

function unselectAllNodes() {
  var nodes = document.getElementsByClassName("selected-node");
  for (var node of nodes) node.classList.remove("selected-node");
}

function populateIndex(tabularFile) {
  var index = document.getElementById("index");
  for (let child of index.children) child.remove();
  var tree = generateHtmlTree(tabularFile.content);
  index.appendChild(tree);

  globals.tableViews = [];

  index.onclick = function(e) {
    var els = document.elementsFromPoint(e.clientX, e.clientY);
    for (let el of els) {
      if (el.className == "tableSetExpander" || el.className == "tableSetName") {
        toggleTableSet(el.parentElement);
      }
      if (el.className == "tableNode") {
        unselectAllNodes();
        el.classList.add("selected-node");
        console.log("Select table, route = " + el.attributes.route);
        var tableSet = globals.file.content;
        for (var i = 0; i < el.attributes.route.length - 1; i++) {
          tableSet = tableSet.tableSets[el.attributes.route[i]];
        }
        var table = tableSet.tables[el.attributes.route[i]];
        var idx = table.fileTableId;
        if (globals.tableViews[idx] === undefined) {
          globals.tableViews[idx] = new TableView(document.getElementById("viewer"), table);
        }
        if (globals.tableViews[globals.activeTableView] !== undefined) {
          globals.tableViews[globals.activeTableView].disableRendering = true;
        }
        globals.tableViews[idx].disableRendering = false;
        globals.tableViews[idx].activateEvents();
        globals.tableViews[idx].printTable();
        globals.tableViews[idx].updateScrollPosition();
        globals.tableViews[idx].contentFrame.focus();
        globals.activeTableView = idx;
      }
    }
  }
}

var findWindow;
window.addEventListener("load", function() {
  var findFunction = function(text, caseSensitive) {
    caseSensitive = caseSensitive ?? false;
    if (!globals.activeTableView) return;
    globals.tableViews[globals.activeTableView].find(text, caseSensitive);
  }
  findWindow = new FindWindowClass(findFunction);
})