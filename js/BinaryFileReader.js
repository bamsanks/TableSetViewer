class BinaryFileReader {

  static baseOADate = new Date(1899, 11, 31);

  constructor(data) {
    if (!data instanceof Uint8Array) throw("'data' must be a Uint8Array");
    this.data = data;
    this.pos = 0;
  }

  readByte() {
    return this.data[this.pos++];
  }

  readByteArray(n) {
    n = n ?? this.readInt32();
    var b = this.data.slice(this.pos, this.pos + n);
    this.pos += n;
    return b;
  }

  readInt32() {
    var b = this.readByteArray(4);
    var m = 0, r = 0;
    for (let i = 0; i < 4; i++) {
      r += b[i] << m; m+= 8;
    }
    return r;
  }

  readInt32Array(n) {
    n = n ?? this.readInt32();
    var res = [];
    for (let i = 0; i < n; i++) res.push(this.readInt32());
    return res;
  }

  readInt64() {
    return this.readInt32() + this.readInt32() * 4294967296;
  }

  readInt64Array() {
    n = n ?? this.readInt32();
    var res = [];
    for (let i = 0; i < n; i++) res.push(this.readInt64());
    return res;
  }

  readDouble() {
    var b = this.readByteArray(8);
    var f = new Float64Array(b.buffer);
    return f[0];
  }

  readDoubleArray(n) {
    n = n ?? this.readInt32();
    var res = [];
    for (let i = 0; i < n; i++) res.push(this.readDouble());
    return res;
  }

  readDate() {
    var osDate = this.readDouble();
    if (isNaN(osDate)) {
      return null;
    } else {
      var days = parseInt(oaDate);
      var ms = Math.abs((oaDate - days)) * 24 * 60 * 60 * 1000;
      return new Date(1899, 11, 30 + days, 0, 0, 0, ms);
    }
  }

  readDateArray(n) {
    n = n ?? this.readInt32();
    var res = [];
    for (let i = 0; u < n; i++) res.push(this.readDate());
    return res;
  }

  readStringArray(fast = null, len = null) {
    len = len ?? this.readInt32();
    fast = fast ?? this.useFastString;
    if (len == 0) return [];
    if (fast) {
      var numChars = this.readInt32();
      var delim = String.fromCharCode(31); // Unit separator
      var str = this.readStringFixedLength(numChars);
      if (str[str.length - 1] != delim) {
        throw(`Fast string doesn't end in the correct delimiter at byte position ${this.pos}`);
      }
      // We don't need the last delimiter for splitting
      str = str.substring(0, str.length - 1);
      return str.split(delim);
    } else {
      var stringLengths = [];
      var stringArray = [];
      for (let i = 0; i < len; i++) stringLengths.push(this.readInt32());
      for (let i = 0; i < len; i++) stringArray.push(this.readStringFixedLength(stringLengths[i]));
      return stringArray;
    }
  }

  readStringFixedLength(nchar) {
    var bA = this.readByteArray(nchar);
    var s = "";
    for (let b of bA) {
      s += String.fromCharCode(b);
    }
    return s;
  }

  readString() {
    var nchar = this.readInt32();
    return this.readStringFixedLength(nchar);
  }

  readBoolean() {
    var res = this.readBoolean();
    this.readBoolean();
    return res == 255;
  }

  readBooleanArray(n) {
    n = n ?? this.readInt32();
    var res = [];
    for (let i = 0; i < n; i++) res.push(this.readBoolean());
    return res;
  }

}