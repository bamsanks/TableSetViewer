const NAT_LOG_10 = Math.log(10);

class TableView {

  element;
  numRows;
  numCols;

  table;
  scrollX;
  scrollY;

  colWidths = [];
  rowHeights = [];

  selections = [];

  setTable(table) {
    this.table = table;
    this.numRows = table.numRows;
    this.numCols = table.numKeys + table.numValueCols;
    this.rowHeights = Array(this.numRows).fill(30); // Default row height = 30
    this.colWidths = Array(this.numCols).fill(100); // Default col width = 100
  }

  estimateHeaderPositions() {
    var colHeaders = document.getElementById("column-headers");
    var rowHeaders = document.getElementById("row-headers");
    var scrollX = globals.tableViews[globals.activeTableView].scrollX;
    var scrollY = globals.tableViews[globals.activeTableView].scrollY;
    var bufferList = document.getElementById("buffer-left").clientWidth;
    var bufferTop = document.getElementById("buffer-top").clientHeight;
    colHeaders.style.marginLeft = bufferList - scrollX + "px";
    rowHeaders.style.marginTop = bufferTop - scrollY + "px";
  }

  delayedRender(renderHeaders = true) {
    if (!this.renderTimeout) {
      // TODO: Don't rely on this function
      this.estimateHeaderPositions();
      this.renderTimeout = setTimeout(() => {
        this.printTable(renderHeaders);
        this.contentFrame.focus();
        this.renderTimeout = null;
      }, 5 /* timeout in ms */);
    }
  }

  onscroll(e) {
    // Retain scroll position
    this.scrollX = e.srcElement.scrollLeft;
    this.scrollY = e.srcElement.scrollTop;
    this.delayedRender();
  }

  onmousedown(e) {
    var cell = e.target;
    var [row, col] = [cell.attributes.row, cell.attributes.col];
    // If left-click, or right-click outside current selection, this set new selection
    if (e.button == 0 || (e.button == 2 && !this.inSelection(row, col))) {
      if (e.button == 0) this.selecting = true;
      // Exit if cell not click on (e.g. scroll bar clicked)
      if (!(row >= -1) || !(col >= -1)) return;
      var range = {
        from: { row: row, col: col },
        to:   { row: row, col: col }
      };
      // Handle full row / col selection when headers clicked
      if (row == -1) { range.from.row = 0; range.to.row = this.numRows - 1; }
      if (col == -1) { range.from.col = 0; range.to.col = this.numCols - 1; }
  
      if (e.shiftKey) {
        // If shift is pressed, just extend the most recent selection
        var idx = this.selections.length - 1;
        this.selections[idx].to = range.to;
      } else if (e.ctrlKey) {
        // If ctrl is pressed, add a new selection
        this.selections.push(range);
      } else {
        // ...and if no special keys pressed, just replace all selections with the new one
        this.selections = [range];
      }
      this.printTable();
    }
  }

  onmousemove(e) {
    if (this.selecting) {
      var cell = e.target;
      var [row, col] = [cell.attributes.row, cell.attributes.col];
      var idx = this.selections.length - 1;
      if (row >= -1 && col >= -1) {
        if (row == -1) row = this.numRows - 1;
        if (col == -1) col = this.numCols - 1;
        this.selections[idx].to.row = row;
        this.selections[idx].to.col = col;
        this.printTable();
      }
    }
  }

  onmouseup(e) {
    this.selecting = false;
    this.contentFrame.focus();
  }

  onkeydown(e) {
    if (e.ctrlKey && e.keyCode == 0x43) { // Ctrl-C pressed
      var withHeaders = e.shiftKey;
      this.copyDataToClipboard(withHeaders, withHeaders);
    } else if (e.ctrlKey && e.keyCode == 0x41) { // Ctrl-A pressed
      this.selectAll();
    }
  }

  copyDataToClipboard(withRowHeaders, withColHeaders) {
    if (this.selections[0]) {
      var r1 = Math.min(this.selections[0].from.row, this.selections[0].to.row);
      var r2 = Math.max(this.selections[0].from.row, this.selections[0].to.row);
      var c1 = Math.min(this.selections[0].from.col, this.selections[0].to.col);
      var c2 = Math.max(this.selections[0].from.col, this.selections[0].to.col);
      var copyText = "";
      if (withColHeaders) {
        if (withRowHeaders) copyText += "\t";
        for (let c = c1; c <= c2; c++) {
          copyText += this.table.colNames[c] + (c == c2 ? "" : "\t");
        }
        copyText += "\n";
      }
      for (let r = r1; r <= r2; r++) {
        if (withRowHeaders) copyText += (r + 1) + "\t";
        for (let c = c1; c <= c2; c++) {
          copyText += this.table.getCell(r, c) + (c == c2 ? "" : "\t");
        }
        copyText += (r == r2 ? "" : "\n");
      }

      navigator.clipboard.writeText(copyText);
    }
  }

  selectAll() {
    this.selections = [{
      from: { row: 0, col: 0 },
      to:   { row: this.table.numRows - 1, col: this.table.numCols - 1 }
    }];
    this.printTable();
    this.contentFrame.focus();
  }

  activateEvents() {
    this.contentFrame.onscroll = this.onscroll.bind(this);
    this.contentFrame.onkeydown = this.onkeydown.bind(this);

    var targets = [this.contentFrame, this.columnHeader, this.rowHeader];
    for (let target of targets) {
      target.onmousedown = this.onmousedown.bind(this);
      target.onmousemove = this.onmousemove.bind(this);
      target.onmouseup = this.onmouseup.bind(this);
    }
  }

  find(text, caseSensitive, wrap, inSelection) {
    caseSensitive = caseSensitive ?? false;
    wrap = wrap ?? true;
    inSelection = inSelection ?? false;

    var nestBroken = false;
    var cellText;
    var startRow = this.selections[0]?.to?.row ?? 0;
    var startCol = this.selections[0]?.to?.col ?? 0;
    text = caseSensitive ? text : text.toLowerCase();
    var endRow = wrap ? startRow : this.table.numRows;
    var endCol = wrap ? startCol : this.table.numCols;
    var r = startRow, c = startCol;
    while (true) {
      c++;
      if (r == startRow && c == startCol) break;
      if (c == this.numCols) { c = 0; r++; }
      if (r == this.numRows) {
        if (wrap) { r = 0; } else { return; }
      }
      cellText = this.table.getCell(r, c).toString();
      if (!caseSensitive) cellText = cellText.toLowerCase();
      if (cellText.includes(text)) break;
    }

    if(r == endRow && c == endCol) return;
    this.jumpTo(r, c, true);
  }

  jumpTo(row, col, select) {
    select = select ?? false;
    if (select) {
      this.selections = [{
        from: { row: row, col: col },
        to:   { row: row, col: col}
      }];
    }
    var top = 0, left = 0;
    for (var r = 0; r < row; r++) top += this.rowHeights[r];
    for (var c = 0; c < col; c++) left += this.colWidths[c];
    this.contentFrame.scrollLeft = left - this.contentFrame.clientWidth / 2;
    this.contentFrame.scrollTop = top - this.contentFrame.clientHeight / 2;
    this.printTable();
  }

  calculateBounds(startPos, sizes, maxSizeTotal) {
    var pos = startPos;
    var lowBound = -1, highBound = sizes.length;
    for (let t = 0; t < sizes.length; t++) {
      pos += sizes[t];
      if (pos > 0) {
        if (lowBound === -1) lowBound = t;
      }
      if (pos > maxSizeTotal) {
        highBound = t;
        break;
      }
    }
    return [lowBound, highBound];
  }

  inSelection(r, c) {
    for (let selection of this.selections) {
      if (((r >= selection.from.row && r <= selection.to.row) ||
           (r <= selection.from.row && r >= selection.to.row)) &&
          ((c >= selection.from.col && c <= selection.to.col) ||
           (c <= selection.from.col && c >= selection.to.col))) {
        return true;
      }
    }
    return false;
  }

  printRowHeaders(bufferTop, firstRow, lastRow) {
    let rowHeadersDiv = document.getElementById("row-headers");
    // TODO: This is messy, try not to remove everything and re-add
    for (let i = rowHeadersDiv.children.length; i > 0; i--) rowHeadersDiv.children[0].remove();
    rowHeadersDiv.style.marginTop = bufferTop - this.scrollY + "px";
    for (let r = firstRow; r <= lastRow; r++) {
      let rowDiv = document.createElement("div");
      let colEl = document.createElement("div");
      rowDiv.classList.add("table-row-header");
      rowDiv.style.height = this.rowHeights[r];
      rowDiv.attributes.row = r; rowDiv.attributes.col = -1;
      colEl.attributes.row = r; colEl.attributes.col = -1;
      rowDiv.appendChild(colEl);
      rowHeadersDiv.appendChild(rowDiv);
      colEl.innerText = r + 1;
    }
    var headerContainer = document.getElementById("header-container");
    var numDigits = (x) => Math.floor(Math.log(x) / NAT_LOG_10) + 1;
    var rowHeaderWidth = Math.max(Math.round(numDigits(lastRow + 1) * 6.5 + 9.51), 40);
    headerContainer.style.marginLeft = rowHeaderWidth + "px";
  }

  columnResized() {
    let entry = entries[0];
    let header = entry.target;
    this.colWidths[header.attributes.col] = header.clientWidth;

    this.delayedRender(false);
  }

  initDrag(e) {
    if (e.button == 0) {
      this.colSizing = { sizing: true, target: e.target.parentElement };
      this.colSizing.startX = e.clientX;
      this.colSizing.startWidth = parseInt(document.defaultView.getComputedStyle(e.target.parentElement).width, 10);
      document.documentElement.addEventListener("mousemove", (e) => { this.doDrag(e); }, false);
      document.documentElement.addEventListener("mouseup", (e) => { this.stopDrag(e); }, false);
      e.stopPropagation();
    }
  }

  doDrag(e) {
    if (this.colSizing?.sizing) {
      var t = this.colSizing.target;
      var newWidth = this.colSizing.startWidth + e.clientX - this.colSizing.startX;
      t.style.width = newWidth + "px";
      this.colWidths[t.attributes.col] = newWidth;
      this.delayedRender(false);
    }
  }

  stopDrag(e) {
    this.colSizing = { sizing: false };
    document.documentElement.removeEventListener("mousemove", this.doDrag, false);
    document.documentElement.removeEventListener("mouseup", this.stopDrag, false);
  }

  autoSizeColumn(e) {
    var colHeader = e.target.parentElement;
    var firstColHeader = colHeader.parentElement.children[0];
    var idx = colHeader.attributes.col;
    var firstIdx = firstColHeader.attributes.col;
    var offsetIdx = idx - firstIdx;
    colHeader.style.width = 0;
    colHeader.style.minWidth = 0;
    var highestWidth = colHeader.children[0].scrollWidth;
    for (let r of document.getElementsByClassName("table-row")) {
      r.children[offsetIdx].style.width = 0;
      r.children[offsetIdx].style.minWidth = 0;
      let contentWidth = r.children[offsetIdx].scrollWidth;
      highestWidth = contentWidth > highestWidth ? contentWidth : highestWidth;
    }
    this.colWidths[idx] = highestWidth + 20;
    this.printTable();
  }

  createColSizer() {
    var colSizer = document.createElement("div");
    colSizer.classList.add("horizontal-sizer");
    colSizer.onmousedown = this.initDrag.bind(this);
    colSizer.ondblclick = this.autoSizeColumn.bind(this);
    return colSizer;
  }

  printColHeaders(bufferLeft, firstCol, lastCol) {
    var colHeadersDiv = document.getElementById("column-headers");
    // TODO: This is messy, try not to remove everything and re-add
    
    for (let i = colHeadersDiv.children.length; i > 0; i--) colHeadersDiv.children[0].remove();
    colHeadersDiv.style.marginLeft = bufferLeft - this.scrollX + "px";
    for (let c = firstCol; c <= lastCol; c++) {
      let rowDiv = document.createElement("div");
      let colEl = document.createElement("div");
      let colSizer = this.createColSizer();
      rowDiv.classList.add("table-col-header");
      rowDiv.style.width = this.colWidths[c];
      rowDiv.appendChild(colEl);
      rowDiv.appendChild(colSizer);
      rowDiv.attributes.col = c; rowDiv.attributes.row = -1;
      colEl.attributes.col = c; colEl.attributes.row = -1;
      colHeadersDiv.appendChild(rowDiv);
      colEl.innerText = this.table.getColName(c);
    }
  }

  updateScrollPosition() {
    this.contentFrame.scrollLeft = this.scrollX;
    this.contentFrame.scrollTop = this.scrollY;
  }

  printTable(renderHeaders) {
    renderHeaders = renderHeaders ?? true;

    if (this.disableRendering) return;
    this.rendering = true;

    var firstRow, lastRow;
    var firstCol, lastCol;

    var maxHeight = this.contentFrame.clientHeight;
    var maxWidth = this.contentFrame.clientWidth;

    // Determine first/last visible row/col
    [firstRow, lastRow] = this.calculateBounds(-this.scrollY, this.rowHeights, maxHeight);
    [firstCol, lastCol] = this.calculateBounds(-this.scrollX, this.colWidths, maxWidth);

    // Give a buffer of 2 rows/cols each way to make scrolling / rendering clean
    [firstRow, lastRow] = [firstRow - 2, lastRow + 2];
    [firstCol, lastCol] = [firstCol - 2, lastCol + 2];

    // Make sure these are within the bounds of the table dimensions
    if (firstRow < 0) firstRow = 0;
    if (firstCol < 0) firstCol = 0;
    if (lastRow >= this.numRows) lastRow = this.numRows - 1;
    if (lastCol >= this.numCols) lastCol = this.numCols - 1;

    this.firstRow = firstRow; this.lastRow = lastRow;
    this.firstCol = firstCol; this.lastCol = lastCol;

    var oldMinHeight = this.element.style.minHeight;
    var oldMinWidth = this.element.style.minWidth;
    this.element.style.minHeight = this.element.clientHeight;
    this.element.style.minWidth = this.element.clientWidth;
    for (let i = this.element.children.length; i > 0; i--) this.element.children[0].remove();
    this.element.style.minHeight = oldMinHeight;
    this.element.style.minWidth = oldMinWidth;

    if (firstRow == -1) return;

    // Calculate left / right scroll buffer sizes;
    var bufferTop = 0, bufferBottom = 0, bufferLeft = 0, bufferRight = 0;
    for (let r = 0; r < firstRow; r++) bufferTop += this.rowHeights[r];
    for (let c = 0; c < firstCol; c++) bufferLeft += this.colWidths[c];
    for (let r = lastRow + 1; r < this.numRows; r++) bufferBottom += this.rowHeights[r];
    for (let c = lastCol + 1; c < this.numCols; c++) bufferRight += this.colWidths[c];

    var bufferTopEl = document.getElementById("buffer-top");
    var bufferLeftEl = document.getElementById("buffer-left");
    var bufferBottomEl = document.getElementById("buffer-bottom");
    var bufferRightEl = document.getElementById("buffer-right");

    bufferTopEl.style.minHeight = bufferTop + "px";
    bufferLeftEl.style.minWidth = bufferLeft + "px";
    bufferBottomEl.style.minHeight = bufferBottom + "px";
    bufferRightEl.style.minWidth = bufferRight + "px";

    // Print row and column headers
    if (renderHeaders) {
      this.printRowHeaders(bufferTop, firstRow, lastRow);
      this.printColHeaders(bufferLeft, firstCol, lastCol)
    }

    for (let r = firstRow; r <= lastRow; r++) {
      let rowDiv = document.createElement("div");
      rowDiv.classList.add("table-row");
      rowDiv.style.height = this.rowHeights[r];
      this.element.appendChild(rowDiv);
      for (let c = firstCol; c <= lastCol; c++) {
        let colEl = document.createElement("div");
        colEl.innerText = this.table.getCell(r, c);
        colEl.style.width = this.colWidths[c];
        colEl.style.minWidth = this.colWidths[c];
        colEl.attributes.row = r;
        colEl.attributes.col = c;
        if (this.inSelection(r, c)) colEl.classList.add("selected");
        rowDiv.appendChild(colEl);
      }
    }

    this.element.style.minHeight = "";

    setTimeout(() => { this.rendering = false; }, 0);
  }

  constructor(viewer, table) {
    // TODO: Be more careful about DOM when setting these
    this.contentFrame = viewer.children[1].children[1];
    this.element = this.contentFrame.children[1].children[1];
    this.rendering = false;
    this.selecting = false;
    this.disableRendering = false;

    this.contentFrame.tabIndex = 0;
    this.contentFrame.style.outline = "none";
    this.columnHeader = document.getElementById("column-headers");
    this.rowHeader = document.getElementById("row-headers");
    this.activateEvents();

    if (table) this.setTable(table);

    this.scrollX = 0;
    this.scrollY = 0;
  }
}