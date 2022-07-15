class BinaryFileHeader {

  infoLength;
  dataLength;
  hash;
  fileType;
  fileTypeVersion;
  creationTime;
  description;
  fileStub;
  storedPath;
  userName;
  vdPath;
  codeVersion;
  isTemplate;
  sectionInfo;
  platform;
  vdTemplate;

}

class TableSet {
  
  name;
  index;
  tableSets;
  tables;

  constructor() {
    this.name = "";
    this.index = [];
    this.tableSets = [];
    this.tables = [];
  }

  get structure() {
    var structure = { type: "TableSet", name: this.name, items: [] };
    for (let entry of this.index) {
      if (entry.type == "TableSet") {
        structure.items.push(this.tableSets[entry.index].structure);
      } else if (entry.type == "Table") {
        structure.items.push({ type: "Table", name : this.tables[entry.index].name });
      } else {
        throw("Unknown entry type");
      }
    }
    return structure;
  }

}

class Table {

  templateProperties;
  name;
  fileTableId;
  tableLoc;
  tableNameLoc;
  validationText;
  colNames;
  showRowIndices;
  rowIndexMultiplier;

  numRows;
  numWildKeys;
  numNonWildKeys;
  numKeys;
  numKeyCols;
  numValueCols;
  numColsExcel;
  numCols;
  keys;
  valueCols;

  getColName(c) {
    if (c < 0 || c > this.numKeys + this.numValueCols) throw("Column is out of bounds!");
    return this.colNames[c];
  }

  getCell(r, c) {
    if (r < 0 || r >= this.numRows) throw("Row is out of bounds!");
    if (c < 0 || c >= this.numKeys + this.numValueCols) throw("Column is out of bounds!");
    if (c < this.numKeys) {
      return this.keys[c].vals[r];
    } else {
      return this.valueCols[c - this.numKeys].vals[r];
    }
  }

}

class SectionInfo {

  numSections;
  start;
  end;
  name;

}

class RelativeAddress {

  sheetName;
  baseRangeName;
  rowOffset;
  colOffset;

}

class TemplateProperties {

  numProps;
  name;
  description;
  num;
  isList;
  explicitBlanks;
  numFixedCols;
  sameCols;
  minNumVariableCols;
  variablePrefix;
  variableNumFormat;
  variableValidationText;
  variableValidation;
  rowIndexMult;
  isFixed;
  emptyOk;
  transpose;
  prophetDimension;
  fileCols;
  numSheetProperties;

  fileType;
  tableCount;

  numberFormats;

}

class TemplateVariableValidation {

  variableType;
  naOk;
  blanksOk;
  interval;
  lowOpen;
  highOpen;
  validationList;

}

const KeyType = {
  wild: 1,
  cyclical: 2,
  interval: 3,
  ascending: 4
}

const VarType = {
  vBoolean: 11,
  vDouble: 5,
  vString: 8,
  vInteger: 3,
  vDate: 7,
  vTenor: -1
}

class Key {

  type;
  name;
  colNum;
  fieldNum;

  interval;
  lowOpen;
  highOpen;
  vals;
  blockEnds;
  compressedVals;
  dataType;
  listName;

  changeToLeft;
  listVals;
  blanksOk;

}

class ValueCol {
  validationListName;
  name;
  colNum;
  fieldNum;
  dataType;
  naOk;
  blanksOk;
  interval;
  lowOpen;
  highOpen;
  hasValidationList;
  validationList;
  vals;
  fileType;
  multiFile;
}

class IndexDef {
  isSet;
  index;

  constructor(isSet, index) {
    this.isSet = isSet;
    this.index = index;
  }
}