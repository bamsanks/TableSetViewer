var dummyFile = new TabularFile();
dummyFile.header = new TabularFileHeader();

dummyFile.header.infoLength = 100;
dummyFile.header.dataLength = 2000;
dummyFile.header.hash = "ABCDEF";
dummyFile.header.fileType = "DUMMY";
dummyFile.header.fileTypeVersion = 1;
dummyFile.header.creationTime = "2001-01-01";
dummyFile.header.description = "I am just a dummy file";
dummyFile.header.fileStub = "STUBSTUB";
dummyFile.header.storedPath = "c:/somewhere/on/disk.dummy";
dummyFile.header.userName = "dummy-driver";
dummyFile.header.vdPath = "c:/path/to/vd.file";
dummyFile.header.codeVersion = "v0.0.1"
dummyFile.header.isTemplate = false;
dummyFile.header.sectionInfo = new SectionInfo();
dummyFile.header.platform = "Windows";
dummyFile.header.vdTemplate = null;

dummyFile.content = new TableSet();
dummyFile.content.name = "root";

dummyFile.content.index.push({ type: "Table",    index: 0 });
dummyFile.content.index.push({ type: "Table",    index: 1 });
dummyFile.content.index.push({ type: "TableSet", index: 0 });
dummyFile.content.index.push({ type: "Table",    index: 2 });
dummyFile.content.index.push({ type: "Table",    index: 3 });
dummyFile.content.index.push({ type: "Table",    index: 4 });

var tblIdTracker = 0;

// Simple table generator
function DefineTable(name, numRows, numKeyCols, numValueCols) {
  let tbl = new Table();
  tbl.name = name;
  tbl.numKeys = numKeyCols;
  tbl.numKeyCols = numKeyCols;
  tbl.numValueCols = numValueCols;
  tbl.numCols = numKeyCols + numValueCols;
  tbl.numRows = numRows;
  tbl.keys = [];
  tbl.valueCols = [];
  tbl.colNames = [];
  tbl.fileTableId = tblIdTracker++;

  for (let i = 0; i < numKeyCols; i++) {
    let keyCol = new Key();
    keyCol.name = "Key #" + i;
    keyCol.vals = [...Array(numRows).keys()];
    tbl.keys.push(keyCol);
    tbl.colNames.push(keyCol.name);
  }

  for (let i = 0; i < numValueCols; i++) {
    let valCol = new ValueCol();
    valCol.name = "Header #" + i;
    valCol.vals = [...Array(numRows).keys()];
    tbl.valueCols.push(valCol);
    tbl.colNames.push(valCol.name);
  }

  return tbl;
}

dummyFile.content.tables.push(DefineTable("Tbl #1",           4,   3,   2));
dummyFile.content.tables.push(DefineTable("Tbl #2",          10,   1,   7));
dummyFile.content.tables.push(DefineTable("Tbl #3",           1,   1,   2));
dummyFile.content.tables.push(DefineTable("Medium Table",   100,   2,  12));
dummyFile.content.tables.push(DefineTable("Big Table",    10000,   7,  45));

function createProcessingWindow() {
  pWindow = document.createElement("div");
    pWindow.setAttribute("id", "processing-window");
    pWindow.innerHTML = "LOADING";
    var img = document.createElement("img");
    img.setAttribute("src", "./img/loading.gif");
    img.style.height = "16px";
    img.style.width = "16px";
    img.style.marginRight = "16px";
    pWindow.prepend(img);

    document.body.appendChild(pWindow)
    return pWindow;
}

function showProcessingWindow() {
  var pWindow = document.getElementById("processing-window") ?? 
    createProcessingWindow();
  pWindow.style.visibility = "visible";
}

function closeProcessingWindow() {
  var pWindow = document.getElementById("processing-window");
  if (!pWindow) return;
  pWindow.style.visibility = "hidden";
}

function addBigTable() {
  showProcessingWindow();
  setTimeout(() => {
    var idx = dummyFile.content.tables.length;
    globals.file.content.tables.push(DefineTable("Stupidly Big Table", 500000,   10,  100));
    globals.file.content.index.push({ type: "Table", index: idx });
    populateIndex(globals.file);
    closeProcessingWindow();
  }, 0);
}

var nestedTableSet = new TableSet();
nestedTableSet.name = "Group #1";
nestedTableSet.index.push({ type: "Table", index: 0});
nestedTableSet.tables.push(DefineTable("Nested table", 14, 1, 1));
dummyFile.content.tableSets.push(nestedTableSet);

window.addEventListener("load", () => {
  globals.file = dummyFile;
  populateIndex(dummyFile);
  createProcessingWindow();
});