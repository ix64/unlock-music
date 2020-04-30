import {FLAC_HEADER, IsBytesEqual, OGG_HEADER} from "./util"

const QMOggPublicHeader1 = [
    0x4f, 0x67, 0x67, 0x53, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff,
    0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0x01, 0x1e, 0x01, 0x76, 0x6f, 0x72,
    0x62, 0x69, 0x73, 0x00, 0x00, 0x00, 0x00, 0x02, 0x44, 0xac, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0xee, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xb8, 0x01, 0x4f, 0x67, 0x67, 0x53, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0x01, 0x00, 0x00, 0x00,
    0xff, 0xff, 0xff, 0xff];
const QMOggPublicHeader2 = [
    0x03, 0x76, 0x6f, 0x72, 0x62, 0x69, 0x73, 0x2c, 0x00, 0x00, 0x00, 0x58, 0x69, 0x70, 0x68, 0x2e,
    0x4f, 0x72, 0x67, 0x20, 0x6c, 0x69, 0x62, 0x56, 0x6f, 0x72, 0x62, 0x69, 0x73, 0x20, 0x49, 0x20,
    0x32, 0x30, 0x31, 0x35, 0x30, 0x31, 0x30, 0x35, 0x20, 0x28, 0xe2, 0x9b, 0x84, 0xe2, 0x9b, 0x84,
    0xe2, 0x9b, 0x84, 0xe2, 0x9b, 0x84, 0x29, 0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00, 0x54,
    0x49, 0x54, 0x4c, 0x45, 0x3d];
const QMOggPublicConf1 = [
    9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0,
    0, 0, 9, 9, 9, 9, 0, 0, 0, 0, 9, 9, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 6, 3, 3, 3, 3, 6, 6, 6, 6,
    3, 3, 3, 3, 6, 6, 6, 6, 6, 9, 9, 9, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 9, 9, 9, 9,
    0, 0, 0, 0];
const QMOggPublicConf2 = [
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 0, 1, 3, 3, 0, 1, 3, 3, 3,
    3, 3, 3, 3, 3];
const QMCDefaultMaskMatrix = [
    0xde, 0x51, 0xfa, 0xc3, 0x4a, 0xd6, 0xca, 0x90,
    0x7e, 0x67, 0x5e, 0xf7, 0xd5, 0x52, 0x84, 0xd8,
    0x47, 0x95, 0xbb, 0xa1, 0xaa, 0xc6, 0x66, 0x23,
    0x92, 0x62, 0xf3, 0x74, 0xa1, 0x9f, 0xf4, 0xa0,
    0x1d, 0x3f, 0x5b, 0xf0, 0x13, 0x0e, 0x09, 0x3d,
    0xf9, 0xbc, 0x00, 0x11];


class QmcMask {
    constructor(matrix, superA, superB) {
        if (superA === undefined || superB === undefined) {
            if (matrix.length === 44) {
                this.Matrix44 = matrix
                this.generateMask128from44()
            } else {
                this.Matrix128 = matrix
                this.generateMask44from128()
            }
            this.generateMask58from128()
        } else {
            this.Matrix58 = matrix;
            this.Super58A = superA;
            this.Super58B = superB;
            this.generateMask128from58();
            this.generateMask44from128()
        }
    }

    generateMask128from58() {
        if (this.Matrix58.length !== 56) throw "incorrect mask58 matrix length";

        let matrix128 = [];
        for (let rowIdx = 0; rowIdx < 8; rowIdx += 1) {
            matrix128 = matrix128.concat(
                [this.Super58A],
                this.Matrix58.slice(7 * rowIdx, 7 * rowIdx + 7),
                [this.Super58B],
                this.Matrix58.slice(56 - 7 - 7 * rowIdx, 56 - 7 * rowIdx).reverse()
            );
        }
        this.Matrix128 = matrix128;
    }

    generateMask58from128() {
        if (this.Matrix128.length !== 128) throw "incorrect mask128 length";

        const superA = this.Matrix128[0], superB = this.Matrix128[8];
        let matrix58 = [];

        for (let rowIdx = 0; rowIdx < 8; rowIdx += 1) {
            let lenStart = 16 * rowIdx;
            let lenRightStart = 120 - lenStart;
            if (this.Matrix128[lenStart] !== superA || this.Matrix128[lenStart + 8] !== superB) {
                throw "decode mask-128 to mask-58 failed"
            }
            let rowLeft = this.Matrix128.slice(lenStart + 1, lenStart + 8);
            let rowRight = this.Matrix128.slice(lenRightStart + 1, lenRightStart + 8).reverse();
            if (IsBytesEqual(rowLeft, rowRight)) {
                matrix58 = matrix58.concat(rowLeft);
            } else {
                throw "decode mask-128 to mask-58 failed"
            }
        }
        this.Matrix58 = matrix58;
        this.Super58A = superA;
        this.Super58B = superB;
    }

    generateMask44from128() {
        if (this.Matrix128.length !== 128) throw "incorrect mask128 matrix length";
        let mapping = GetConvertMapping()
        this.Matrix44 = []
        let idxI44 = 0
        mapping.forEach(it256 => {
            let it256Len = it256.length
            for (let i = 1; i < it256Len; i++) {
                if (this.Matrix128[it256[0]] !== this.Matrix128[it256[i]]) {
                    throw "decode mask-128 to mask-44 failed"
                }
            }
            this.Matrix44[idxI44] = this.Matrix128[it256[0]]
            idxI44++
        })
    }

    generateMask128from44() {
        if (this.Matrix44.length !== 44) throw "incorrect mask length"
        this.Matrix128 = []
        let idx44 = 0
        GetConvertMapping().forEach(it256 => {
            it256.forEach(m => {
                this.Matrix128[m] = this.Matrix44[idx44]
            })
            idx44++
        })
    }

    Decrypt(data) {
        let dst = data.slice(0);
        let index = -1;
        let maskIdx = -1;
        for (let cur = 0; cur < data.length; cur++) {
            index++;
            maskIdx++;
            if (index === 0x8000 || (index > 0x8000 && (index + 1) % 0x8000 === 0)) {
                index++;
                maskIdx++;
            }
            if (maskIdx >= 128) maskIdx -= 128;
            dst[cur] ^= this.Matrix128[maskIdx];
        }
        return dst;
    }
}

export function QmcMaskGetDefault() {
    return new QmcMask(QMCDefaultMaskMatrix)
}

export function QmcMaskDetectMflac(data) {
    let search_len = Math.min(0x8000, data.length), mask;
    for (let block_idx = 0; block_idx < search_len; block_idx += 128) {
        try {
            mask = new QmcMask(data.slice(block_idx, block_idx + 128));
            if (IsBytesEqual(FLAC_HEADER, mask.Decrypt(data.slice(0, FLAC_HEADER.length)))) break;
        } catch (e) {
        }
    }
    return mask;
}

export function QmcMaskDetectMgg(data) {
    if (data.length < 0x100) return
    let matrixConfidence = {};
    for (let i = 0; i < 44; i++) matrixConfidence[i] = {};

    const page2 = data[0x54] ^ data[0xC] ^ QMOggPublicHeader1[0xC];
    const spHeader = QmcGenerateOggHeader(page2)
    const spConf = QmcGenerateOggConf(page2)

    for (let idx128 = 0; idx128 < spHeader.length; idx128++) {
        if (spConf[idx128] === 0) continue;
        let idx44 = GetMask44Index(idx128);
        let _m = data[idx128] ^ spHeader[idx128]
        let confidence = spConf[idx128];
        if (_m in matrixConfidence[idx44]) {
            matrixConfidence[idx44][_m] += confidence
        } else {
            matrixConfidence[idx44][_m] = confidence
        }
    }
    let matrix = [];
    try {
        for (let i = 0; i < 44; i++)
            matrix[i] = getMaskConfidenceResult(matrixConfidence[i]);
    } catch (e) {
        return;
    }
    const mask = new QmcMask(matrix);
    let dx = mask.Decrypt(data.slice(0, OGG_HEADER.length));
    if (!IsBytesEqual(OGG_HEADER, dx)) {
        return;
    }

    return mask;
}

export function QmcMaskCreate128(mask128) {
    return new QmcMask(mask128)
}

export function QmcMaskCreate58(matrix, superA, superB) {
    return new QmcMask(matrix, superA, superB)
}

export function QmcMaskCreate44(mask44) {
    return new QmcMask(mask44)
}

/**
 * @param confidence {{}}
 * @returns {number}
 */
function getMaskConfidenceResult(confidence) {
    if (confidence.length === 0) throw "can not match at least one key";
    if (confidence.length > 1) console.warn("There are 2 potential value for the mask!")
    let result, conf = 0;
    for (let idx in confidence) {
        if (confidence[idx] > conf) {
            result = idx;
            conf = confidence[idx];
        }
    }
    return parseInt(result)
}

/**
 * @return {number}
 */


const allMapping = [];
const mask128to44 = [];

(function () {
    for (let i = 0; i < 128; i++) {
        let realIdx = (i * i + 27) % 256
        if (realIdx in allMapping) {
            allMapping[realIdx].push(i)
        } else {
            allMapping[realIdx] = [i]
        }
    }

    let idx44 = 0
    allMapping.forEach(all128 => {
        all128.forEach(_i128 => {
            mask128to44[_i128] = idx44
        })
        idx44++
    })
})();

function GetConvertMapping() {
    return allMapping;
}

function GetMask44Index(idx128) {
    return mask128to44[idx128 % 128]
}

function QmcGenerateOggHeader(page2) {
    let spec = [page2, 0xFF]
    for (let i = 2; i < page2; i++) spec.push(0xFF)
    spec.push(0xFF)
    return QMOggPublicHeader1.concat(spec, QMOggPublicHeader2)
}

function QmcGenerateOggConf(page2) {
    let specConf = [6, 0]
    for (let i = 2; i < page2; i++) specConf.push(4)
    specConf.push(0)
    return QMOggPublicConf1.concat(specConf, QMOggPublicConf2)
}