class TabularFile {

  header;
  content;
  
  constructor(data) {
    this.checkStructsExist();
    this.totalNumTables = 0; 
    if (data === undefined) return;

    this.reader = new TabularFileReader(data);
    this.header = this.readHeader();
    this.content = this.readTableSet();
  }

  checkStructsExist() {
    var missing = (name => `Definition for '${name}' is missing!`);
    if (typeof TabularFileHeader !== "function") throw(missing("TabularFileHeader"));
    if (typeof TableSet !== "function") throw(missing("TabularFileContent"));
    if (typeof Table !== "function") throw(missing("Table"));
    if (typeof SectionInfo !== "function") throw(missing("SectionInfo"));
  }

  readSectionInfo() {
    var sectionInfo = new SectionInfo();
    sectionInfo.numSections = this.reader.readInt32();
    sectionInfo.start = this.reader.readInt32Array(sectionInfo.numSections);
    sectionInfo.end = this.reader.readInt32Array(sectionInfo.numSections);
    sectionInfo.name = this.reader.readStringArray();
    return sectionInfo;
  }

  readHeader() {
    var header = new TabularFileHeader();
    header.infoLength = this.reader.readInt32();
    header.dataLength = this.reader.readInt32();
    header.hash = this.reader.readString();
    header.fileType = this.reader.readString();
    
    var fileTypeVersionExists = (this.reader.readInt32() == -1);
    header.fileTypeVersion = fileTypeVersionExists ? this.reader.readInt32() : -1;
    this.reader.useFastString = fileTypeVersionExists;

    header.creationTime = this.reader.readString();
    header.descriptions = this.reader.readString();
    header.fileStub = this.reader.readString();
    header.storedPath = this.reader.readString();
    header.userName = this.reader.readString();
    header.vdPath = this.reader.readString();
    header.codeVersion = this.reader.readString();
    header.isTemplate = this.reader.readBoolean();
    header.sectionInfo = this.readSectionInfo();
    header.platform = this.reader.readString();
    if (header.fileType.toUpperCase() == "VD") {
      header.vdTemplate = this.reader.readString();
    }
    return header;
  }

  readTableSet() {
    var content = new TableSet();
    var tableNames = this.reader.readStringArray();
    for (let i = 0; i < tableNames.length; i++) {
      let itemType = this.reader.readString();
      if (itemType == "cTable") {
        content.index.push({ type: "Table", index: content.tables.length });
        var table = this.readTable();
        table.fileTableId = this.totalNumTables++;
        content.tables.push(table);
      } else if (itemType == "Dictionary") {
        content.index.push({ type: "TableSet", index: content.tableSets.length });
        let tableSet = this.readTableSet();
        tableSet.name = tableNames[i];
        content.tableSets.push(tableSet);
      } else {
        throw("Unrecognised item in table set");
      }
    }
    return content;
  }

  readTable() {
    var table = new Table();

    if (this.header.isTemplate) {
      table.templateProperties = this.readTemplateProperties();
    }

    table.name = this.reader.readString();
    table.tableLoc = this.reader.readRelativeAddress();
    table.tableNameLoc = this.reader.readRelativeAddress();
    table.validationText = this.reader.readStringArray();
    table.colNames = this.reader.readStringArray();
    table.showRowIndicies = this.reader.readBoolean();
    table.rowIndexMultiplier = this.reader.readDouble();

    table.numRows = this.reader.readInt32();
    table.numWildKeys = this.reader.readInt32();
    table.numNonWildKeys = this.reader.readInt32();
    table.numKeys = table.numWildKeys + table.numNonWildKeys;
    table.numKeyCols = this.reader.readInt32();
    table.numValueCols = this.reader.readInt32();
    table.numColsExcel = table.numKeyCols + table.numValueCols;
    table.numCols = table.numKeys + table.numValueCols;
    table.keys = this.readKeys(table.numKeys);
    table.valueCols = this.readValueCols(table.numValueCols);

    return table;
  }

  readRelativeAddress() {
    var relativeAddress = new RelativeAddress();
    relativeAddress.sheetName = this.reader.readString();
    relativeAddress.baseRangeName = this.reader.readString();
    relativeAddress.rowOffset = this.reader.readInt32();
    relativeAddress.colOffset = this.reader.readInt32();
    return relativeAddress
  }

  readTemplateProperties() {
    templateProperties = new TemplateProperties();
    templateProperties.numProps = this.reader.readInt32();
    templateProperties.name = this.reader.readString();
    templateProperties.description = this.reader.readString();
    templateProperties.num = this.reader.readInt32();
    templateProperties.isList = this.reader.readBoolean();
    templateProperties.explicitBlanks = this.reader.readBoolean();
    templateProperties.numFixedCols = this.reader.readInt32();
    templateProperties.sameCols = this.reader.readBoolean();
    templateProperties.minNumVariableCosl = this.reader.readInt32();
    templateProperties.variablePrefix = this.reader.readString();
    templateProperties.variableNumFormat = this.reader.readString();
    templateProperties.variableValiationText = this.reader.readString();
    templateProperties.variableValidation = this.reader.readTemplateVariableValidation();
    templateProperties.rowIndexMult = this.reader.readDouble();
    templateProperties.isFixed = this.reader.readBoolean();
    templateProperties.emptyOk = this.reader.readBoolean();
    templateProperties.transpose = this.reader.readBoolean();
    templateProperties.prophetDimensions = this.reader.readInt32();
    templateProperties.fileCols = this.reader.readString();
    templateProperties.numSheetProperties = this.reader.readInt32();
    templateProperties.fileType = this.reader.readString();
    templateProperties.tableCount = this.reader.readInt32();
    templateProperties.numberFormats = this.reader.readStringArray();

    return templateProperties;
  }

  readTemplateVariableValidation() {
    templateVariableValidation = new TemplateVariableValidation();

    templateVariableValidation.variableType = this.reader.readInt32();
    templateVariableValidation.naOk = this.reader.readBoolean();
    templateVariableValidation.blanksOk = this.reader.readBoolean();
    templateVariableValidation.interval = this.reader.readDoubleArray();
    templateVariableValidation.lowOpen = this.reader.readBoolean();
    templateVariableValidation.highOpen = this.reader.readBoolean();
    templateVariableValidation.validationList = this.reader.readString();

    return templateVariableValidation;
  }

  readKeys(n) {
    var keys = [];
    for (let i = 0; i < n; i++) keys.push(this.readKey());
    return keys;
  }

  readKey() {
    var key = new Key();
    key.type = this.readInt32();
    key.name = this.readString();
    key.colNum = this.readInt32();
    key.fieldNum = this.readInt32();

    if (key.type == KeyType.interval) {
      key.interval = this.reader.readDoubleArray(2);
      key.lowOpen = this.reader.readBoolean();
      key.highOpen = this.reader.readBoolean();
      key.vals = this.reader.readDoubleArray();
      key.blockEnds = this.reader.readInt32Array();
      key.compressedVals = this.reader.readDoubleArray();
      key.dataType = VarType.vDouble();
      key.listName = "";
    } else if (key.type == KeyType.ascending) {
      key.blockEnds = this.reader.readInt32Array();
      key.changeToLeft = this.reader.readBooleanArray();
      key.dataType = this.reader.readInt32();
      key.listName = "";
      if (key.dataType == VarType.vInteger || key.dataType == VarType.vDouble) {
        key.interval = this.reader.readDoubleArray(2);
        key.lowOpen = this.reader.readBoolean();
        key.highOpen = this.reader.readBoolean();
      } else if (key.dataType == VarType.vString) {
        key.listName = this.reader.readString();
        if (key.listName != "") key.listVals = this.reader.readStringArray();
        key.blanksOk = this.reader.readBoolean();
      }

      switch (key.dataType) {
        case VarType.vBoolean:
          key.vals = this.reader.readBooleanArray();
          key.compressedVals = this.reader.readBooleanArray();
          break;
        case VarType.vDouble:
          key.vals = this.reader.readDoubleArray();
          key.compressedVals = this.reader.readDoubleArray();
          break;
        case VarType.vString:
          key.vals = this.reader.readStringArray();
          key.compressedVals = this.reader.readStringArray();
          break;
        case VarType.vInteger:
          key.vals = this.reader.readInt32Array();
          key.compressedVals = this.reader.readInt32();
          break;
        case VarType.vDate:
          key.vals = this.reader.readDateArray();
          key.compressedVals = this.reader.readDateArray();
          break;
        case VarType.vTenor:
          key.vals = this.reader.readStringArray();
          key.compressedVals = this.reader.readStringArray();
          break;
        default:
          break;
      }
    } else {

      // If we are here, then the key type is either wild or cyclical
      key.listName = this.reader.readString();
      key.listVals = this.reader.readStringArray();
      // Flul list of values
      key.vals = this.reader.readStringArray();
      key.dataType = VarType.vString;
      if (key.type == KeyType.wild) key.compressedVals = this.reader.readStringArray();
      if (key.type == KeyType.cyclical) key.blockEnds == this.reader.readInt32Array();

    }

    return key;
  }

  readValueCols(n) {
    var valueCols = [];
    for (let i = 0; i < n; i++) valueCols.push(this.readValueCol());
    return valueCols;
  }

  readValueCol() {

    var validationText = "";

    var valueCol = new ValueCol();
    valueCol.validationListName = validationText.startsWith("Value:List:") ? validationText.substring(12) : "";

    valueCol.name = this.readString();
    valueCol.colNum = this.readInt32();
    valueCol.fieldNum = this.readInt32();
    valueCol.dataType = this.readInt32();
    valueCol.naOk = this.readBoolean();
    valueCol.blanksOk = this.readBoolean();
    valueCol.interval = this.readDoubleArray();
    valueCol.lowOpen = this.readBoolean();
    valueCol.highOpen = this.readBoolean();
    valueCol.hasValidationList = this.readBoolean();
    if (valueCol.hasValidationList && !this.header.isTemplate) {
      valueCol.validationList = this.reader.readStringArray();
    }

      switch (valueCols.dataType) {
        case VarType.vBoolean:
          valueCols.vals = this.reader.readBooleanArray();
          break;
        case VarType.vDouble:
          valueCols.vals = this.reader.readDoubleArray();
          break;
        case VarType.vString:
          valueCols.vals = this.reader.readStringArray();
          break;
        case VarType.vInteger:
          valueCols.vals = this.reader.readInt32Array();
          break;
        case VarType.vDate:
          valueCols.vals = this.reader.readDateArray();
          break;
        case VarType.vTenor:
          valueCols.vals = this.reader.readStringArray();
          break;
        default:
          break;
      }
    
      // TODO: Fill in for functionality below
      if (this.header.isTemplate) {
        valueCol.fileType = this.reader.readString();
        valueCol.multiFile = this.reader.readBoolean();
      } else { /* should be else if template is null */
        valueCol.fileType = "";
        valueCol.multiFile = false;
      } 
      /* } else {
        valueCol.fileType = template.fileType;
        valueCol.multiFile = template.multiFile;
        id (valueCol.fileType != "") valueCol.readFiles(info);
      } */
     
    return valueCol;
  }




}