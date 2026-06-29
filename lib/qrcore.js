const QRErrorCorrectLevel = Object.freeze({ L: 1, M: 0, Q: 3, H: 2 }),
  QRMode = Object.freeze({
    MODE_NUMBER: 1,
    MODE_ALPHA_NUM: 2,
    MODE_8BIT_BYTE: 4,
    MODE_KANJI: 8,
  }),
  QRMaskPattern = Object.freeze({
    PATTERN000: 0,
    PATTERN001: 1,
    PATTERN010: 2,
    PATTERN011: 3,
    PATTERN100: 4,
    PATTERN101: 5,
    PATTERN110: 6,
    PATTERN111: 7,
  });

/**
 * Returns an SVG polygon points string for a regular N-pointed star.
 * @param {number} cx      - center X in SVG viewBox units
 * @param {number} cy      - center Y in SVG viewBox units
 * @param {number} outerR  - outer (tip) radius
 * @param {number} innerR  - inner (notch) radius
 * @param {number} n       - number of points
 */
function _getStarPoints(cx, cy, outerR, innerR, n) {
  const pts = [];
  const step = Math.PI / n;
  for (let i = 0; i < 2 * n; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    pts.push(
      `${(cx + r * Math.cos(angle)).toFixed(4)},${(cy + r * Math.sin(angle)).toFixed(4)}`,
    );
  }
  return pts.join(" ");
}

class QR8bitByte {
  constructor(t) {
    ((this.mode = QRMode.MODE_8BIT_BYTE),
      (this.data = this.sanitizeInput(t)),
      (this._encodedData = null));
  }
  get parsedData() {
    return (this._encodedData ??= new TextEncoder().encode(this.data));
  }
  sanitizeInput(t) {
    if (null == t) return "";
    return String(t)
      .replace(
        /\0|<script[^>]*>[\s\S]*?<\/script>|javascript:[^'"\s]*|(data|vbscript|moz-extension|chrome-extension):/gi,
        "",
      )
      .trim();
  }
  getLength() {
    return this.parsedData.length;
  }
  write(t) {
    const e = this.parsedData;
    for (let o = 0; o < e.length; o++) t.put(e[o], 8);
  }
}
class QRCodeModel {
  static PAD0 = 236;
  static PAD1 = 17;
  constructor(t, e) {
    ((this.typeNumber = t),
      (this.errorCorrectLevel = e),
      (this.modules = null),
      (this.moduleCount = 0),
      (this.dataCache = null),
      (this.dataList = []));
  }
  addData(t) {
    (this.dataList.push(new QR8bitByte(t)), (this.dataCache = null));
  }
  isDark(t, e) {
    if (t < 0 || this.moduleCount <= t || e < 0 || this.moduleCount <= e)
      throw new Error(`${t},${e}`);
    return this.modules[t][e];
  }
  getModuleCount() {
    return this.moduleCount;
  }
  make() {
    const e = this.getBestMaskPattern();
    ((this.maskPattern = e), this.makeImpl(!1, e));
  }
  makeImpl(t, e) {
    ((this.moduleCount = 4 * this.typeNumber + 17),
      (this.modules = Array(this.moduleCount)
        .fill(null)
        .map(() => Array(this.moduleCount).fill(null))),
      this.setupPositionProbePattern(0, 0),
      this.setupPositionProbePattern(this.moduleCount - 7, 0),
      this.setupPositionProbePattern(0, this.moduleCount - 7),
      this.setupPositionAdjustPattern(),
      this.setupTimingPattern(),
      this.setupTypeInfo(t, e),
      this.typeNumber >= 7 && this.setupTypeNumber(t),
      QRUtil.clearMaskCache(),
      null === this.dataCache &&
        (this.dataCache = QRCodeModel.createData(
          this.typeNumber,
          this.errorCorrectLevel,
          this.dataList,
        )),
      this.mapData(this.dataCache, e));
  }
  setupPositionProbePattern(t, e) {
    for (let o = -1; o <= 7; o++)
      if (!(t + o < 0 || t + o >= this.moduleCount))
        for (let r = -1; r <= 7; r++)
          e + r < 0 ||
            e + r >= this.moduleCount ||
            (this.modules[t + o][e + r] =
              (0 <= o && o <= 6 && (0 === r || 6 === r)) ||
              (0 <= r && r <= 6 && (0 === o || 6 === o)) ||
              (2 <= o && o <= 4 && 2 <= r && r <= 4));
  }
  getBestMaskPattern() {
    let t = 1 / 0,
      e = 0;
    for (let o = 0; o < 8; o++) {
      this.makeImpl(!0, o);
      const r = QRUtil.getLostPoint(this);
      r < t && ((t = r), (e = o));
    }
    return e;
  }
  setupTimingPattern() {
    for (let t = 8; t < this.moduleCount - 8; t++)
      null === this.modules[t][6] && (this.modules[t][6] = t % 2 == 0);
    for (let t = 8; t < this.moduleCount - 8; t++)
      null === this.modules[6][t] && (this.modules[6][t] = t % 2 == 0);
  }
  setupPositionAdjustPattern() {
    const t = QRUtil.getPatternPosition(this.typeNumber),
      e = t.length;
    for (let o = 0; o < e; o++)
      for (let r = 0; r < e; r++) {
        const e = t[o],
          i = t[r];
        if (null === this.modules[e][i])
          for (let t = -2; t <= 2; t++)
            for (let o = -2; o <= 2; o++)
              this.modules[e + t][i + o] =
                -2 === t ||
                2 === t ||
                -2 === o ||
                2 === o ||
                (0 === t && 0 === o);
      }
  }
  setupTypeNumber(t) {
    const e = QRUtil.getBCHTypeNumber(this.typeNumber);
    for (let o = 0; o < 18; o++) {
      const r = !t && 1 == ((e >> o) & 1),
        i = Math.floor(o / 3),
        s = o % 3;
      ((this.modules[i][s + this.moduleCount - 8 - 3] = r),
        (this.modules[s + this.moduleCount - 8 - 3][i] = r));
    }
  }
  setupTypeInfo(t, e) {
    const o = (this.errorCorrectLevel << 3) | e,
      r = QRUtil.getBCHTypeInfo(o);
    for (let e = 0; e < 15; e++) {
      const o = !t && 1 == ((r >> e) & 1);
      e < 6
        ? (this.modules[e][8] = o)
        : e < 8
          ? (this.modules[e + 1][8] = o)
          : (this.modules[this.moduleCount - 15 + e][8] = o);
    }
    for (let e = 0; e < 15; e++) {
      const o = !t && 1 == ((r >> e) & 1);
      e < 8
        ? (this.modules[8][this.moduleCount - e - 1] = o)
        : e < 9
          ? (this.modules[8][15 - e + 1] = o)
          : (this.modules[8][15 - e - 1] = o);
    }
    this.modules[this.moduleCount - 8][8] = !t;
  }
  mapData(t, e) {
    let o = -1,
      r = this.moduleCount - 1,
      i = 7,
      s = 0;
    const n = t.length;
    for (let h = this.moduleCount - 1; h > 0; h -= 2)
      for (6 === h && h--; ; ) {
        for (let o = 0; o < 2; o++) {
          const l = h - o;
          if (null === this.modules[r][l]) {
            let o = !1;
            (s < n && (o = 1 == ((t[s] >>> i) & 1)),
              QRUtil.getMask(e, r, l) && (o = !o),
              (this.modules[r][l] = o),
              -1 == --i && (s++, (i = 7)));
          }
        }
        if (((r += o), r < 0 || this.moduleCount <= r)) {
          ((r -= o), (o = -o));
          break;
        }
      }
  }
  static createData(t, e, o) {
    const r = QRRSBlock.getRSBlocks(t, e),
      i = new QRBitBuffer(),
      s = o.length;
    for (let e = 0; e < s; e++) {
      const r = o[e];
      (i.put(r.mode, 4),
        i.put(r.getLength(), QRUtil.getLengthInBits(r.mode, t)),
        r.write(i));
    }
    let n = 0;
    const h = r.length;
    for (let t = 0; t < h; t++) n += r[t].dataCount;
    const l = 8 * n;
    if (i.getLengthInBits() > l)
      throw new Error(`Code length overflow. (${i.getLengthInBits()} > ${l})`);
    for (
      i.getLengthInBits() + 4 <= l && i.put(0, 4);
      i.getLengthInBits() % 8 != 0;
    )
      i.putBit(!1);
    for (
      ;
      i.getLengthInBits() < l &&
      (i.put(QRCodeModel.PAD0, 8), !(i.getLengthInBits() >= l));
    )
      i.put(QRCodeModel.PAD1, 8);
    return QRCodeModel.createBytes(i, r);
  }
  static createBytes(t, e) {
    let o = 0,
      r = 0,
      i = 0;
    const s = e.length,
      n = new Array(s),
      h = new Array(s);
    for (let l = 0; l < s; l++) {
      const s = e[l].dataCount,
        a = e[l].totalCount - s;
      ((r = Math.max(r, s)), (i = Math.max(i, a)), (n[l] = new Array(s)));
      for (let e = 0; e < s; e++) n[l][e] = 255 & t.buffer[e + o];
      o += s;
      const c = QRUtil.getErrorCorrectPolynomial(a),
        u = new QRPolynomial(n[l], c.getLength() - 1).mod(c),
        d = u.getLength();
      h[l] = new Array(c.getLength() - 1);
      for (let t = 0; t < h[l].length; t++) {
        const e = t + d - h[l].length;
        h[l][t] = e >= 0 ? u.get(e) : 0;
      }
    }
    let l = 0;
    for (let t = 0; t < s; t++) l += e[t].totalCount;
    const a = new Array(l);
    let c = 0;
    for (let t = 0; t < r; t++)
      for (let e = 0; e < s; e++) t < n[e].length && (a[c++] = n[e][t]);
    for (let t = 0; t < i; t++)
      for (let e = 0; e < s; e++) t < h[e].length && (a[c++] = h[e][t]);
    return a;
  }
}
class QRUtil {
  static _maskCache = new Map();
  static PATTERN_POSITION_TABLE = [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170],
  ];
  static G15 = 1335;
  static G18 = 7973;
  static G15_MASK = 21522;
  static getBCHTypeInfo(t) {
    let e = t << 10;
    const o = QRUtil.getBCHDigit(QRUtil.G15);
    for (; QRUtil.getBCHDigit(e) - o >= 0; )
      e ^= QRUtil.G15 << (QRUtil.getBCHDigit(e) - o);
    return ((t << 10) | e) ^ QRUtil.G15_MASK;
  }
  static getBCHTypeNumber(t) {
    let e = t << 12;
    const o = QRUtil.getBCHDigit(QRUtil.G18);
    for (; QRUtil.getBCHDigit(e) - o >= 0; )
      e ^= QRUtil.G18 << (QRUtil.getBCHDigit(e) - o);
    return (t << 12) | e;
  }
  static getBCHDigit(t) {
    let e = 0;
    for (; 0 !== t; ) (e++, (t >>>= 1));
    return e;
  }
  static getPatternPosition(t) {
    return QRUtil.PATTERN_POSITION_TABLE[t - 1];
  }
  static getMask(t, e, o) {
    const r = (e << 16) | (o << 8) | t;
    if (QRUtil._maskCache.has(r)) return QRUtil._maskCache.get(r);
    let i;
    const s = e * o;
    switch (t) {
      case 0:
        i = (e + o) % 2 == 0;
        break;
      case 1:
        i = e % 2 == 0;
        break;
      case 2:
        i = o % 3 == 0;
        break;
      case 3:
        i = (e + o) % 3 == 0;
        break;
      case 4:
        i = (Math.floor(e / 2) + Math.floor(o / 3)) % 2 == 0;
        break;
      case 5:
        i = (s % 2) + (s % 3) == 0;
        break;
      case 6:
        i = ((s % 2) + (s % 3)) % 2 == 0;
        break;
      case 7:
        i = ((s % 3) + ((e + o) % 2)) % 2 == 0;
        break;
      default:
        throw new Error(`bad maskPattern: ${t}`);
    }
    return (QRUtil._maskCache.set(r, i), i);
  }
  static clearMaskCache() {
    QRUtil._maskCache.clear();
  }
  static getErrorCorrectPolynomial(t) {
    let e = new QRPolynomial([1], 0);
    for (let o = 0; o < t; o++)
      e = e.multiply(new QRPolynomial([1, QRMath.gexp(o)], 0));
    return e;
  }
  static getLengthInBits(t, e) {
    if (e < 1 || e > 40) throw new Error(`type: ${e}`);
    if (e < 10)
      switch (t) {
        case 1:
          return 10;
        case 2:
          return 9;
        case 4:
        case 8:
          return 8;
        default:
          throw new Error(`mode: ${t}`);
      }
    else if (e < 27)
      switch (t) {
        case 1:
          return 12;
        case 2:
          return 11;
        case 4:
          return 16;
        case 8:
          return 10;
        default:
          throw new Error(`mode: ${t}`);
      }
    else
      switch (t) {
        case 1:
          return 14;
        case 2:
          return 13;
        case 4:
          return 16;
        case 8:
          return 12;
        default:
          throw new Error(`mode: ${t}`);
      }
  }
  static getLostPoint(t) {
    const e = t.getModuleCount();
    let o = 0;
    for (let r = 0; r < e; r++)
      for (let i = 0; i < e; i++) {
        let s = 0;
        const n = t.isDark(r, i);
        for (let o = -1; o <= 1; o++) {
          const h = r + o;
          if (!(h < 0 || e <= h))
            for (let r = -1; r <= 1; r++) {
              const l = i + r;
              l < 0 ||
                e <= l ||
                (0 === o && 0 === r) ||
                (n === t.isDark(h, l) && s++);
            }
        }
        s > 5 && (o += 3 + s - 5);
      }
    for (let r = 0; r < e - 1; r++)
      for (let i = 0; i < e - 1; i++) {
        let e = 0;
        (t.isDark(r, i) && e++,
          t.isDark(r + 1, i) && e++,
          t.isDark(r, i + 1) && e++,
          t.isDark(r + 1, i + 1) && e++,
          (0 !== e && 4 !== e) || (o += 3));
      }
    for (let r = 0; r < e; r++)
      for (let i = 0; i < e - 6; i++)
        t.isDark(r, i) &&
          !t.isDark(r, i + 1) &&
          t.isDark(r, i + 2) &&
          t.isDark(r, i + 3) &&
          t.isDark(r, i + 4) &&
          !t.isDark(r, i + 5) &&
          t.isDark(r, i + 6) &&
          (o += 40);
    for (let r = 0; r < e; r++)
      for (let i = 0; i < e - 6; i++)
        t.isDark(i, r) &&
          !t.isDark(i + 1, r) &&
          t.isDark(i + 2, r) &&
          t.isDark(i + 3, r) &&
          t.isDark(i + 4, r) &&
          !t.isDark(i + 5, r) &&
          t.isDark(i + 6, r) &&
          (o += 40);
    let r = 0;
    const i = e * e;
    for (let o = 0; o < e; o++)
      for (let i = 0; i < e; i++) t.isDark(i, o) && r++;
    return ((o += 10 * (Math.abs((100 * r) / i - 50) / 5)), o);
  }
}
class QRMath {
  static EXP_TABLE = new Array(256);
  static LOG_TABLE = new Array(256);
  static init() {
    for (let t = 0; t < 8; t++) QRMath.EXP_TABLE[t] = 1 << t;
    for (let t = 8; t < 256; t++)
      QRMath.EXP_TABLE[t] =
        QRMath.EXP_TABLE[t - 4] ^
        QRMath.EXP_TABLE[t - 5] ^
        QRMath.EXP_TABLE[t - 6] ^
        QRMath.EXP_TABLE[t - 8];
    for (let t = 0; t < 255; t++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[t]] = t;
  }
  static glog(t) {
    if (t < 1) throw new Error(`glog(${t})`);
    return QRMath.LOG_TABLE[t];
  }
  static gexp(t) {
    return ((t %= 255) < 0 && (t += 255), QRMath.EXP_TABLE[t]);
  }
}
QRMath.init();
class QRPolynomial {
  constructor(t, e) {
    if (!Array.isArray(t)) throw new Error(`${t.length}/${e}`);
    let o = 0;
    for (; o < t.length && 0 === t[o]; ) o++;
    this.num = new Array(t.length - o + e);
    for (let e = 0; e < t.length - o; e++) this.num[e] = t[e + o];
  }
  get(t) {
    return this.num[t];
  }
  getLength() {
    return this.num.length;
  }
  multiply(t) {
    const e = new Array(this.getLength() + t.getLength() - 1).fill(0);
    for (let o = 0; o < this.getLength(); o++) {
      const r = QRMath.glog(this.get(o));
      for (let i = 0; i < t.getLength(); i++)
        e[o + i] ^= QRMath.gexp(r + QRMath.glog(t.get(i)));
    }
    return new QRPolynomial(e, 0);
  }
  mod(t) {
    if (this.getLength() - t.getLength() < 0) return this;
    const e = QRMath.glog(this.get(0)) - QRMath.glog(t.get(0)),
      o = [...this.num];
    for (let r = 0; r < t.getLength(); r++)
      o[r] ^= QRMath.gexp(QRMath.glog(t.get(r)) + e);
    return new QRPolynomial(o, 0).mod(t);
  }
}
class QRRSBlock {
  constructor(t, e) {
    ((this.totalCount = t), (this.dataCount = e));
  }
  static RS_BLOCK_TABLE = [
    [1, 26, 19],
    [1, 26, 16],
    [1, 26, 13],
    [1, 26, 9],
    [1, 44, 34],
    [1, 44, 28],
    [1, 44, 22],
    [1, 44, 16],
    [1, 70, 55],
    [1, 70, 44],
    [2, 35, 17],
    [2, 35, 13],
    [1, 100, 80],
    [2, 50, 32],
    [2, 50, 24],
    [4, 25, 9],
    [1, 134, 108],
    [2, 67, 43],
    [2, 33, 15, 2, 34, 16],
    [2, 33, 11, 2, 34, 12],
    [2, 86, 68],
    [4, 43, 27],
    [4, 43, 19],
    [4, 43, 15],
    [2, 98, 78],
    [4, 49, 31],
    [2, 32, 14, 4, 33, 15],
    [4, 39, 13, 1, 40, 14],
    [2, 121, 97],
    [2, 60, 38, 2, 61, 39],
    [4, 40, 18, 2, 41, 19],
    [4, 40, 14, 2, 41, 15],
    [2, 146, 116],
    [3, 58, 36, 2, 59, 37],
    [4, 36, 16, 4, 37, 17],
    [4, 36, 12, 4, 37, 13],
    [2, 86, 68, 2, 87, 69],
    [4, 69, 43, 1, 70, 44],
    [6, 43, 19, 2, 44, 20],
    [6, 43, 15, 2, 44, 16],
    [4, 101, 81],
    [1, 80, 50, 4, 81, 51],
    [4, 50, 22, 4, 51, 23],
    [3, 36, 12, 8, 37, 13],
    [2, 116, 92, 2, 117, 93],
    [6, 58, 36, 2, 59, 37],
    [4, 46, 20, 6, 47, 21],
    [7, 42, 14, 4, 43, 15],
    [4, 133, 107],
    [8, 59, 37, 1, 60, 38],
    [8, 44, 20, 4, 45, 21],
    [12, 33, 11, 4, 34, 12],
    [3, 145, 115, 1, 146, 116],
    [4, 64, 40, 5, 65, 41],
    [11, 36, 16, 5, 37, 17],
    [11, 36, 12, 5, 37, 13],
    [5, 109, 87, 1, 110, 88],
    [5, 65, 41, 5, 66, 42],
    [5, 54, 24, 7, 55, 25],
    [11, 36, 12],
    [5, 122, 98, 1, 123, 99],
    [7, 73, 45, 3, 74, 46],
    [15, 43, 19, 2, 44, 20],
    [3, 45, 15, 13, 46, 16],
    [1, 135, 107, 5, 136, 108],
    [10, 74, 46, 1, 75, 47],
    [1, 50, 22, 15, 51, 23],
    [2, 42, 14, 17, 43, 15],
    [5, 150, 120, 1, 151, 121],
    [9, 69, 43, 4, 70, 44],
    [17, 50, 22, 1, 51, 23],
    [2, 42, 14, 19, 43, 15],
    [3, 141, 113, 4, 142, 114],
    [3, 70, 44, 11, 71, 45],
    [17, 47, 21, 4, 48, 22],
    [9, 39, 13, 16, 40, 14],
    [3, 135, 107, 5, 136, 108],
    [3, 67, 41, 13, 68, 42],
    [15, 54, 24, 5, 55, 25],
    [15, 43, 15, 10, 44, 16],
    [4, 144, 116, 4, 145, 117],
    [17, 68, 42],
    [17, 50, 22, 6, 51, 23],
    [19, 46, 16, 6, 47, 17],
    [2, 139, 111, 7, 140, 112],
    [17, 74, 46],
    [7, 54, 24, 16, 55, 25],
    [34, 37, 13],
    [4, 151, 121, 5, 152, 122],
    [4, 75, 47, 14, 76, 48],
    [11, 54, 24, 14, 55, 25],
    [16, 45, 15, 14, 46, 16],
    [6, 147, 117, 4, 148, 118],
    [6, 73, 45, 14, 74, 46],
    [11, 54, 24, 16, 55, 25],
    [30, 46, 16, 2, 47, 17],
    [8, 132, 106, 4, 133, 107],
    [8, 75, 47, 13, 76, 48],
    [7, 54, 24, 22, 55, 25],
    [22, 45, 15, 13, 46, 16],
    [10, 142, 114, 2, 143, 115],
    [19, 74, 46, 4, 75, 47],
    [28, 50, 22, 6, 51, 23],
    [33, 46, 16, 4, 47, 17],
    [8, 152, 122, 4, 153, 123],
    [22, 73, 45, 3, 74, 46],
    [8, 53, 23, 26, 54, 24],
    [12, 45, 15, 28, 46, 16],
    [3, 147, 117, 10, 148, 118],
    [3, 73, 45, 23, 74, 46],
    [4, 54, 24, 31, 55, 25],
    [11, 45, 15, 31, 46, 16],
    [7, 146, 116, 7, 147, 117],
    [21, 73, 45, 7, 74, 46],
    [1, 53, 23, 37, 54, 24],
    [19, 45, 15, 26, 46, 16],
    [5, 145, 115, 10, 146, 116],
    [19, 75, 47, 10, 76, 48],
    [15, 54, 24, 25, 55, 25],
    [23, 45, 15, 25, 46, 16],
    [13, 145, 115, 3, 146, 116],
    [14, 74, 46, 21, 75, 47],
    [29, 54, 24, 19, 55, 25],
    [11, 45, 15, 46, 46, 16],
    [13, 145, 115, 6, 146, 116],
    [14, 74, 46, 23, 75, 47],
    [44, 54, 24, 7, 55, 25],
    [59, 46, 16, 1, 47, 17],
    [12, 151, 121, 7, 152, 122],
    [12, 75, 47, 26, 76, 48],
    [39, 54, 24, 14, 55, 25],
    [22, 45, 15, 41, 46, 16],
    [6, 151, 121, 14, 152, 122],
    [6, 75, 47, 34, 76, 48],
    [46, 54, 24, 10, 55, 25],
    [2, 45, 15, 64, 46, 16],
    [17, 152, 122, 4, 153, 123],
    [29, 74, 46, 14, 75, 47],
    [49, 54, 24, 10, 55, 25],
    [24, 45, 15, 46, 46, 16],
    [4, 152, 122, 18, 153, 123],
    [13, 74, 46, 32, 75, 47],
    [48, 54, 24, 14, 55, 25],
    [42, 45, 15, 32, 46, 16],
    [20, 147, 117, 4, 148, 118],
    [40, 75, 47, 7, 76, 48],
    [43, 54, 24, 22, 55, 25],
    [10, 45, 15, 67, 46, 16],
    [19, 148, 118, 6, 149, 119],
    [18, 75, 47, 31, 76, 48],
    [34, 54, 24, 34, 55, 25],
    [20, 45, 15, 61, 46, 16],
  ];
  static getRSBlocks(t, e) {
    const o = QRRSBlock.getRsBlockTable(t, e);
    if (!o)
      throw new Error(
        `bad rs block @ typeNumber: ${t}/errorCorrectLevel: ${e}`,
      );
    const r = o.length / 3,
      i = [];
    for (let t = 0; t < r; t++) {
      const e = o[3 * t],
        r = o[3 * t + 1],
        s = o[3 * t + 2];
      for (let t = 0; t < e; t++) i.push(new QRRSBlock(r, s));
    }
    return i;
  }
  static getRsBlockTable(t, e) {
    const o = 4 * (t - 1);
    switch (e) {
      case QRErrorCorrectLevel.L:
        return QRRSBlock.RS_BLOCK_TABLE[o];
      case QRErrorCorrectLevel.M:
        return QRRSBlock.RS_BLOCK_TABLE[o + 1];
      case QRErrorCorrectLevel.Q:
        return QRRSBlock.RS_BLOCK_TABLE[o + 2];
      case QRErrorCorrectLevel.H:
        return QRRSBlock.RS_BLOCK_TABLE[o + 3];
      default:
        return undefined;
    }
  }
}
class QRBitBuffer {
  constructor() {
    ((this.buffer = []), (this.length = 0));
  }
  get(t) {
    const e = Math.floor(t / 8);
    return 1 == ((this.buffer[e] >>> (7 - (t % 8))) & 1);
  }
  put(t, e) {
    const o = this.length,
      r = this.length + e,
      i = Math.floor((r - 1) / 8);
    for (; this.buffer.length <= i; ) this.buffer.push(0);
    for (let r = 0; r < e; r++) {
      const i = 1 == ((t >>> (e - r - 1)) & 1),
        s = o + r,
        n = Math.floor(s / 8);
      i && (this.buffer[n] |= 128 >>> (s % 8));
    }
    this.length = r;
  }
  getLengthInBits() {
    return this.length;
  }
  putBit(t) {
    const e = Math.floor(this.length / 8);
    (this.buffer.length <= e && this.buffer.push(0),
      t && (this.buffer[e] |= 128 >>> (this.length % 8)),
      this.length++);
  }
}
const QRCodeLimitLength = [
  [17, 14, 11, 7],
  [32, 26, 20, 14],
  [53, 42, 32, 24],
  [78, 62, 46, 34],
  [106, 84, 60, 44],
  [134, 106, 74, 58],
  [154, 122, 86, 64],
  [192, 152, 108, 84],
  [230, 180, 130, 98],
  [271, 213, 151, 119],
  [321, 251, 177, 137],
  [367, 287, 203, 155],
  [425, 331, 241, 177],
  [458, 362, 258, 194],
  [520, 412, 292, 220],
  [586, 450, 322, 250],
  [644, 504, 364, 280],
  [718, 560, 394, 310],
  [792, 624, 442, 338],
  [858, 666, 482, 382],
  [929, 711, 509, 403],
  [1003, 779, 565, 439],
  [1091, 857, 611, 461],
  [1171, 911, 661, 511],
  [1273, 997, 715, 535],
  [1367, 1059, 751, 593],
  [1465, 1125, 805, 625],
  [1528, 1190, 868, 658],
  [1628, 1264, 908, 698],
  [1732, 1370, 982, 742],
  [1840, 1452, 1030, 790],
  [1952, 1538, 1112, 842],
  [2068, 1628, 1168, 898],
  [2188, 1722, 1228, 958],
  [2303, 1809, 1283, 983],
  [2431, 1911, 1351, 1051],
  [2563, 1989, 1423, 1093],
  [2699, 2099, 1499, 1139],
  [2809, 2213, 1579, 1219],
  [2953, 2331, 1663, 1273],
];
function _getUTF8Length(t) {
  const e = encodeURI(t).replace(/%[0-9a-fA-F]{2}/g, "a");
  return e.length + (e.length !== t.length ? 3 : 0);
}
function _getTypeNumber(t, e) {
  const o = _getUTF8Length(t);
  let r = 1;
  for (let t = 0, i = QRCodeLimitLength.length; t < i; t++) {
    if (o <= QRCodeLimitLength[t][e]) break;
    r++;
  }
  if (r > QRCodeLimitLength.length) throw new Error("Too long data");
  return r;
}
function _getAndroid() {
  const t = navigator.userAgent.toLowerCase();
  if (!/android/i.test(t)) return !1;
  const e = t.match(/android ([0-9]\.[0-9])/i);
  return !e || !e[1] || parseFloat(e[1]);
}
class Drawing {
  constructor(t, e) {
    ((this._el = t), (this._htOption = e));
  }
  draw(t) {
    const e = t.getModuleCount(),
      o = Math.floor(this._htOption.width / e),
      r = Math.floor(this._htOption.height / e);
    (this.clear(),
      this._htOption.useSVG
        ? this._drawSVG(t, e, o, r)
        : "undefined" != typeof CanvasRenderingContext2D
          ? this._drawCanvas(t, e, o, r)
          : this._drawTable(t, e, o, r));
  }

  _drawSVG(t, e, o, r) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    const n = this._htOption.borderSize || 0;
    const h = this._htOption.borderRadius || 0;
    const l = e + 2 * n;
    const shape = this._htOption.moduleShape || "square";
    const logoSrc = this._htOption.logoSrc || null;
    // logoSizeRatio is expressed as a fraction of the module count (e),
    // so 0.25 means the logo spans 25% of the QR module grid width.
    // Logo ratio capped at 0.30 — beyond that even H-level error correction
    // cannot reliably recover the erased center modules.
    const logoSizeRatio = Math.max(
      0.1,
      Math.min(0.3, this._htOption.logoSizeRatio || 0.2),
    );

    // Logo bounding box in SVG viewBox units.
    // Dark modules whose cell overlaps this box are not drawn — the scanner
    // sees clean background-color (erasures), which error correction handles
    // far better than partially-painted pixels from a white-rect overlay.
    const _logoSize = logoSrc ? e * logoSizeRatio : 0;
    const _logoZone = logoSrc
      ? {
          x1: l / 2 - _logoSize / 2,
          y1: l / 2 - _logoSize / 2,
          x2: l / 2 + _logoSize / 2,
          y2: l / 2 + _logoSize / 2,
        }
      : null;

    svg.setAttribute("viewBox", `0 0 ${l} ${l}`);
    svg.setAttribute("width", this._htOption.width);
    svg.setAttribute("height", this._htOption.height);
    svg.setAttribute(
      "shape-rendering",
      shape === "square" ? "crispEdges" : "geometricPrecision",
    );

    // Background
    const bgRect = document.createElementNS(ns, "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", this._htOption.colorLight);
    if (h > 0) {
      const rx = h / (this._htOption.width / l);
      bgRect.setAttribute("rx", rx);
      bgRect.setAttribute("ry", rx);
    }
    svg.appendChild(bgRect);

    const darkColor = this._htOption.colorDark;
    const lightColor = this._htOption.colorLight;

    // ── Finder patterns ──────────────────────────────────────────
    // Every QR scanner locates the code by finding the three nested-square
    // finder patterns.  When a custom module shape is selected those cells
    // must STILL be drawn as classic squares — circles/stars/diamonds in the
    // corner squares confuse or outright break scanner detection.
    //
    // Strategy:
    //   • For non-square shapes: pre-draw each finder as three stacked rects,
    //     then SKIP those module cells in the regular rendering loop below.
    //   • For square shape: the regular 1×1 rect loop already produces the
    //     correct result, so no special handling is needed.
    const _isCustomShape = shape !== "square";

    // Returns true when (row, col) falls inside one of the three 7×7 finder
    // pattern zones (not counting the 1-wide separator — those cells are always
    // light and are never dark, so they never reach this check).
    const _inFinder = (row, col) =>
      (row < 7 && col < 7) ||
      (row < 7 && col >= e - 7) ||
      (row >= e - 7 && col < 7);

    if (_isCustomShape) {
      // Helper — appends a plain <rect> to the SVG.
      const _rect = (x, y, w, h, fill) => {
        const el = document.createElementNS(ns, "rect");
        el.setAttribute("x", x);
        el.setAttribute("y", y);
        el.setAttribute("width", w);
        el.setAttribute("height", h);
        el.setAttribute("fill", fill);
        svg.appendChild(el);
      };

      // Draw one 7×7 finder pattern centred at module (r0, c0).
      const _drawFinder = (r0, c0) => {
        const fx = c0 + n,
          fy = r0 + n;
        _rect(fx, fy, 7, 7, darkColor); // outer dark border
        _rect(fx + 1, fy + 1, 5, 5, lightColor); // inner white area
        _rect(fx + 2, fy + 2, 3, 3, darkColor); // centre dark square
      };

      _drawFinder(0, 0); // top-left
      _drawFinder(0, e - 7); // top-right
      _drawFinder(e - 7, 0); // bottom-left
    }

    // ── Data / timing / format-info modules ──────────────────────
    for (let row = 0; row < e; row++) {
      for (let col = 0; col < e; col++) {
        if (!t.isDark(row, col)) continue;

        // Finder zones are already painted above; skip to avoid overdraw.
        if (_isCustomShape && _inFinder(row, col)) continue;

        const x = col + n;
        const y = row + n;

        // Skip modules under the logo — leave them as background color so
        // the scanner treats them as known erasures (not random errors).
        if (
          _logoZone &&
          x + 1 > _logoZone.x1 &&
          x < _logoZone.x2 &&
          y + 1 > _logoZone.y1 &&
          y < _logoZone.y2
        )
          continue;

        const cx = x + 0.5;
        const cy = y + 0.5;
        let el;

        switch (shape) {
          case "circle": {
            el = document.createElementNS(ns, "circle");
            el.setAttribute("cx", cx);
            el.setAttribute("cy", cy);
            el.setAttribute("r", "0.47");
            break;
          }
          case "diamond": {
            el = document.createElementNS(ns, "polygon");
            el.setAttribute(
              "points",
              `${cx},${(y + 0.05).toFixed(3)} ${(x + 0.95).toFixed(3)},${cy}` +
                ` ${cx},${(y + 0.95).toFixed(3)} ${(x + 0.05).toFixed(3)},${cy}`,
            );
            break;
          }
          case "star": {
            el = document.createElementNS(ns, "polygon");
            el.setAttribute("points", _getStarPoints(cx, cy, 0.47, 0.19, 5));
            break;
          }
          case "rounded": {
            el = document.createElementNS(ns, "rect");
            el.setAttribute("x", (x + 0.1).toFixed(3));
            el.setAttribute("y", (y + 0.1).toFixed(3));
            el.setAttribute("width", "0.8");
            el.setAttribute("height", "0.8");
            el.setAttribute("rx", "0.22");
            el.setAttribute("ry", "0.22");
            break;
          }
          default: {
            // "square"
            el = document.createElementNS(ns, "rect");
            el.setAttribute("x", x);
            el.setAttribute("y", y);
            el.setAttribute("width", "1");
            el.setAttribute("height", "1");
            break;
          }
        }

        el.setAttribute("fill", darkColor);
        svg.appendChild(el);
      }
    }

    // ── Center logo overlay ───────────────────────────────────────
    if (logoSrc) {
      // logoSize is in module-grid units so the ratio maps directly to
      // what percentage of the QR module grid the logo occupies.
      const logoSize = e * logoSizeRatio;
      // Center inside the full viewBox (border included).
      const logoX = l / 2 - logoSize / 2;
      const logoY = l / 2 - logoSize / 2;
      const pad = logoSize * 0.1; // small white padding around the logo

      // White background rect — ensures logo is readable regardless of module color.
      const logoBg = document.createElementNS(ns, "rect");
      logoBg.setAttribute("x", (logoX - pad).toFixed(4));
      logoBg.setAttribute("y", (logoY - pad).toFixed(4));
      logoBg.setAttribute("width", (logoSize + pad * 2).toFixed(4));
      logoBg.setAttribute("height", (logoSize + pad * 2).toFixed(4));
      logoBg.setAttribute("fill", this._htOption.colorLight);
      logoBg.setAttribute("rx", (pad * 1.5).toFixed(4));
      svg.appendChild(logoBg);

      // Logo <image> element — data URL is preserved in outerHTML serialization.
      const imgEl = document.createElementNS(ns, "image");
      imgEl.setAttribute("x", logoX.toFixed(4));
      imgEl.setAttribute("y", logoY.toFixed(4));
      imgEl.setAttribute("width", logoSize.toFixed(4));
      imgEl.setAttribute("height", logoSize.toFixed(4));
      imgEl.setAttribute("href", logoSrc);
      imgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.appendChild(imgEl);
    }

    this._el.appendChild(svg);
  }

  _drawCanvas(t, e, o, r) {
    const canvas = document.createElement("canvas");
    canvas.width = this._htOption.width;
    canvas.height = this._htOption.height;
    this._el.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const n = this._htOption.borderSize || 0;
    const total = e + 2 * n;
    const pw = this._htOption.width / total; // pixel width per module
    const ph = this._htOption.height / total; // pixel height per module
    const shape = this._htOption.moduleShape || "square";
    const logoSrc = this._htOption.logoSrc || null;
    const logoSizeRatio = Math.max(
      0.1,
      Math.min(0.3, this._htOption.logoSizeRatio || 0.2),
    );

    // Logo zone in module-grid coordinates (col/row, not pixels).
    const _cLogoModW = logoSrc ? e * logoSizeRatio : 0;
    const _cLogoZone = logoSrc
      ? {
          c1: (e - _cLogoModW) / 2,
          r1: (e - _cLogoModW) / 2,
          c2: (e + _cLogoModW) / 2,
          r2: (e + _cLogoModW) / 2,
        }
      : null;

    // Background
    ctx.fillStyle = this._htOption.colorLight;
    ctx.fillRect(0, 0, this._htOption.width, this._htOption.height);

    const borderRad = this._htOption.borderRadius || 0;
    if (borderRad > 0) {
      ctx.beginPath();
      ctx.roundRect(n * pw, n * ph, e * pw, e * ph, borderRad);
      ctx.fillStyle = this._htOption.colorLight;
      ctx.fill();
    }

    const _cIsCustom = shape !== "square";
    const _cInFinder = (row, col) =>
      (row < 7 && col < 7) ||
      (row < 7 && col >= e - 7) ||
      (row >= e - 7 && col < 7);

    // Pre-draw finder patterns as classic nested squares for custom shapes.
    if (_cIsCustom) {
      const _cDrawFinder = (r0, c0) => {
        const fx = (c0 + n) * pw,
          fy = (r0 + n) * ph;
        ctx.fillStyle = this._htOption.colorDark;
        ctx.fillRect(fx, fy, 7 * pw, 7 * ph);
        ctx.fillStyle = this._htOption.colorLight;
        ctx.fillRect(fx + pw, fy + ph, 5 * pw, 5 * ph);
        ctx.fillStyle = this._htOption.colorDark;
        ctx.fillRect(fx + 2 * pw, fy + 2 * ph, 3 * pw, 3 * ph);
      };
      _cDrawFinder(0, 0);
      _cDrawFinder(0, e - 7);
      _cDrawFinder(e - 7, 0);
    }

    // ── Module rendering ─────────────────────────────────────────
    for (let row = 0; row < e; row++) {
      for (let col = 0; col < e; col++) {
        if (!t.isDark(row, col)) continue;

        // Skip finder zones — already painted above as classic squares.
        if (_cIsCustom && _cInFinder(row, col)) continue;

        // Skip modules that overlap the logo zone.
        if (
          _cLogoZone &&
          col + 1 > _cLogoZone.c1 &&
          col < _cLogoZone.c2 &&
          row + 1 > _cLogoZone.r1 &&
          row < _cLogoZone.r2
        )
          continue;

        const x = (col + n) * pw;
        const y = (row + n) * ph;
        const cx = x + pw / 2;
        const cy = y + ph / 2;

        ctx.fillStyle = this._htOption.colorDark;
        ctx.beginPath();

        switch (shape) {
          case "circle":
            ctx.arc(cx, cy, pw * 0.47, 0, 2 * Math.PI);
            break;

          case "diamond":
            ctx.moveTo(cx, y + ph * 0.05);
            ctx.lineTo(x + pw * 0.95, cy);
            ctx.lineTo(cx, y + ph * 0.95);
            ctx.lineTo(x + pw * 0.05, cy);
            ctx.closePath();
            break;

          case "star": {
            const outerR = pw * 0.47;
            const innerR = pw * 0.19;
            const numPts = 5;
            const step = Math.PI / numPts;
            for (let i = 0; i < 2 * numPts; i++) {
              const rr = i % 2 === 0 ? outerR : innerR;
              const angle = i * step - Math.PI / 2;
              const px = cx + rr * Math.cos(angle);
              const py = cy + rr * Math.sin(angle);
              i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            break;
          }

          case "rounded":
            ctx.roundRect(
              x + pw * 0.1,
              y + ph * 0.1,
              pw * 0.8,
              ph * 0.8,
              pw * 0.22,
            );
            break;

          default: // "square"
            ctx.rect(x, y, pw, ph);
            break;
        }

        ctx.fill();
      }
    }

    // ── Center logo overlay (async image draw) ────────────────────
    if (logoSrc) {
      const totalW = this._htOption.width;
      const totalH = this._htOption.height;
      const logoW = e * logoSizeRatio * pw; // pixel width of logo
      const logoH = e * logoSizeRatio * ph; // pixel height of logo
      const logoX = (totalW - logoW) / 2;
      const logoY = (totalH - logoH) / 2;
      const pad = logoW * 0.1;

      // Draw white background rect synchronously.
      ctx.fillStyle = this._htOption.colorLight;
      ctx.beginPath();
      ctx.roundRect(
        logoX - pad,
        logoY - pad,
        logoW + pad * 2,
        logoH + pad * 2,
        pad * 1.5,
      );
      ctx.fill();

      // Draw logo image once loaded.
      const imgEl = new Image();
      imgEl.onload = () => {
        ctx.drawImage(imgEl, logoX, logoY, logoW, logoH);
      };
      imgEl.src = logoSrc;
    }
  }

  _drawTable(t, e, o, r) {
    const i = this._htOption.borderSize || 0,
      s = e + 2 * i,
      n =
        (Math.floor(this._htOption.width / s),
        Math.floor(this._htOption.height / s)),
      h = document.createElement("table"),
      l = {
        border: "0",
        borderCollapse: "collapse",
        padding: "0",
        margin: "0",
        width: `${this._htOption.width}px`,
        height: `${this._htOption.height}px`,
        backgroundColor: this._htOption.colorLight,
      };
    Object.assign(h.style, l);
    const a = (t) => {
      const e = document.createElement("td");
      return (
        (e.style.backgroundColor = t
          ? this._htOption.colorLight
          : this._htOption.colorDark),
        e
      );
    };
    for (let t = 0; t < i; t++) {
      const t = document.createElement("tr");
      t.style.height = `${n}px`;
      for (let e = 0; e < s; e++) t.appendChild(a(!0));
      h.appendChild(t);
    }
    for (let o = 0; o < e; o++) {
      const r = document.createElement("tr");
      r.style.height = `${n}px`;
      for (let t = 0; t < i; t++) r.appendChild(a(!0));
      for (let i = 0; i < e; i++) r.appendChild(a(!t.isDark(o, i)));
      for (let t = 0; t < i; t++) r.appendChild(a(!0));
      h.appendChild(r);
    }
    for (let t = 0; t < i; t++) {
      const t = document.createElement("tr");
      t.style.height = `${n}px`;
      for (let e = 0; e < s; e++) t.appendChild(a(!0));
      h.appendChild(t);
    }
    this._el.appendChild(h);
  }
  clear() {
    for (; this._el.firstChild; ) this._el.removeChild(this._el.firstChild);
  }
}
class QRCode {
  constructor(t, e) {
    if (
      ((this._htOption = {
        width: 256,
        height: 256,
        typeNumber: 1,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRErrorCorrectLevel.H,
        borderSize: 0,
        borderRadius: 0,
        moduleShape: "square", // "square" | "rounded" | "circle" | "diamond" | "star"
        logoSrc: null, // data URL string or null
        logoSizeRatio: 0.2, // fraction of module-grid width (0.10–0.35 recommended)
      }),
      "string" == typeof e && (e = { text: e }),
      e)
    )
      for (const t in e) this._htOption[t] = e[t];
    ("string" == typeof t && (t = document.getElementById(t)),
      (this._android = _getAndroid()),
      (this._el = t),
      (this._oQRCode = null),
      (this._oDrawing = new Drawing(this._el, this._htOption)),
      this._htOption.text && this.makeCode(this._htOption.text));
  }
  makeCode(t) {
    if (null == t || "" === t) throw new Error("Input cannot be empty");
    if ("string" == typeof t && t.length > 1e4)
      throw new Error("Input is too long");
    try {
      new QR8bitByte(t);
    } catch (t) {
      throw new Error("Invalid input: " + t.message);
    }
    let e = this._htOption.typeNumber;
    for (;;)
      try {
        ((this._oQRCode = new QRCodeModel(e, this._htOption.correctLevel)),
          this._oQRCode.addData(t),
          this._oQRCode.make());
        break;
      } catch (t) {
        if (!t.message.startsWith("Code length overflow")) throw t;
        if ((e++, e > 40)) throw new Error("Data too long for a QR code");
      }
    ((this._el.title = t),
      this._oDrawing.draw(this._oQRCode),
      this.makeImage());
  }
  makeImage() {
    "function" == typeof this._oDrawing.makeImage &&
      (!this._android || this._android >= 3) &&
      this._oDrawing.makeImage();
  }
  clear() {
    this._oDrawing.clear();
  }
}
((QRCode.CorrectLevel = QRErrorCorrectLevel), (window.QRCode = QRCode));
