const NcmDecrypt = require("./ncm");
const KwmDecrypt = require("./kwm");
const XmDecrypt = require("./xm");
const QmcDecrypt = require("./qmc");
const RawDecrypt = require("./raw");
const TmDecrypt = require("./tm");
const KgmDecrypt = require("./kgm");

export async function CommonDecrypt(file) {
    let raw_ext = file.name.substring(file.name.lastIndexOf(".") + 1, file.name.length).toLowerCase();
    let raw_filename = file.name.substring(0, file.name.lastIndexOf("."));
    let rt_data;
    switch (raw_ext) {
        case "ncm":// Netease Mp3/Flac
            rt_data = await NcmDecrypt.Decrypt(file.raw, raw_filename, raw_ext);
            break;
        case "kwm":// Kuwo Mp3/Flac
            rt_data = await KwmDecrypt.Decrypt(file.raw, raw_filename, raw_ext);
            break
        case "xm": // Xiami Wav/M4a/Mp3/Flac
        case "wav":// Xiami/Raw Wav
        case "mp3":// Xiami/Raw Mp3
        case "flac":// Xiami/Raw Flac
        case "m4a":// Xiami/Raw M4a
            rt_data = await XmDecrypt.Decrypt(file.raw, raw_filename, raw_ext);
            break;
        case "ogg":// Raw Ogg
            rt_data = await RawDecrypt.Decrypt(file.raw, raw_filename, raw_ext);
            break;
        case "tm0":// QQ Music IOS Mp3
        case "tm3":// QQ Music IOS Mp3
            rt_data = await RawDecrypt.Decrypt(file.raw, raw_filename, "mp3");
            break;
        case "qmc3"://QQ Music Android Mp3
        case "qmc2"://QQ Music Android Ogg
        case "qmc0"://QQ Music Android Mp3
        case "qmcflac"://QQ Music Android Flac
        case "qmcogg"://QQ Music Android Ogg
        case "tkm"://QQ Music Accompaniment M4a
        case "bkcmp3"://Moo Music Mp3
        case "bkcflac"://Moo Music Flac
        case "mflac"://QQ Music Desktop Flac
        case "mgg": //QQ Music Desktop Ogg
        case "666c6163"://QQ Music Weiyun Flac
        case "6d7033"://QQ Music Weiyun Mp3
        case "6f6767"://QQ Music Weiyun Ogg
        case "6d3461"://QQ Music Weiyun M4a
        case "776176"://QQ Music Weiyun Wav
            rt_data = await QmcDecrypt.Decrypt(file.raw, raw_filename, raw_ext);
            break;
        case "tm2":// QQ Music IOS M4a
        case "tm6":// QQ Music IOS M4a
            rt_data = await TmDecrypt.Decrypt(file.raw, raw_filename);
            break;
        case "vpr":
        case "kgm":
        case "kgma":
            rt_data = await KgmDecrypt.Decrypt(file.raw, raw_filename, raw_ext);
            break
        default:
            rt_data = {status: false, message: "不支持此文件格式",}
    }

    if (!rt_data.rawExt) rt_data.rawExt = raw_ext;
    if (!rt_data.rawFilename) rt_data.rawFilename = raw_filename;
    console.log(rt_data);
    return rt_data;
}
