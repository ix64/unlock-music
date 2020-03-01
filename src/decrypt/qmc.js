import {AudioMimeType, DetectAudioExt, GetArrayBuffer, GetCoverURL, GetFileInfo} from "./util";
import {QmcMaskCreate58, QmcMaskGetDefault, QmcMaskDetectMgg, QmcMaskDetectMflac} from "./qmcMask";

const musicMetadata = require("music-metadata-browser");

const HandlerMap = {
    "mgg": {handler: QmcMaskDetectMgg, ext: "ogg", detect: true},
    "mflac": {handler: QmcMaskDetectMflac, ext: "flac", detect: true},
    "qmc0": {handler: QmcMaskGetDefault, ext: "mp3", detect: false},
    "qmc3": {handler: QmcMaskGetDefault, ext: "mp3", detect: false},
    "qmcogg": {handler: QmcMaskGetDefault, ext: "ogg", detect: false},
    "qmcflac": {handler: QmcMaskGetDefault, ext: "flac", detect: false},
    "bkcmp3": {handler: QmcMaskGetDefault, ext: "mp3", detect: false},
    "bkcflac": {handler: QmcMaskGetDefault, ext: "flac", detect: false},
    "tkm": {handler: QmcMaskGetDefault, ext: "m4a", detect: false}
};

export async function Decrypt(file, raw_filename, raw_ext) {
    if (!(raw_ext in HandlerMap)) return {status: false, message: "File type is incorrect!"};
    const handler = HandlerMap[raw_ext];

    const fileData = new Uint8Array(await GetArrayBuffer(file));
    let audioData, seed, keyData;
    if (handler.detect) {
        audioData = fileData.slice(0, -0x170);
        seed = handler.handler(audioData);
        keyData = fileData.slice(-0x170);
        if (seed === undefined) seed = await queryKeyInfo(keyData, raw_filename, raw_ext);
        if (seed === undefined) return {status: false, message: raw_ext + "格式仅提供实验性支持！"};
    } else {
        audioData = fileData;
        seed = handler.handler(audioData);
    }
    const dec = seed.Decrypt(audioData);

    const ext = DetectAudioExt(dec, handler.ext);
    const mime = AudioMimeType[ext];

    const musicData = new Blob([dec], {type: mime});

    const tag = await musicMetadata.parseBlob(musicData);
    const info = GetFileInfo(tag.common.artist, tag.common.title, raw_filename);
    if (handler.detect) reportKeyUsage(keyData, seed.Matrix128,
        info.artist, info.title, tag.common.album, raw_filename, raw_ext);
    return {
        status: true,
        title: info.title,
        artist: info.artist,
        ext: ext,
        album: tag.common.album,
        picture: GetCoverURL(tag),
        file: URL.createObjectURL(musicData),
        mime: mime
    }
}

function reportKeyUsage(keyData, maskData, artist, title, album, filename, format) {
    fetch("https://stats.ixarea.com/collect/qmcmask/usage", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            Mask: Array.from(maskData), Key: Array.from(keyData),
            Artist: artist, Title: title, Album: album, Filename: filename, Format: format
        }),
    }).then().catch()
}

async function queryKeyInfo(keyData, filename, format) {
    try {
        const resp = await fetch("https://stats.ixarea.com/collect/qmcmask/query", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({Format: format, Key: Array.from(keyData), Filename: filename}),
        });
        let data = await resp.json();
        return QmcMaskCreate58(data.Matrix58, data.Super58A, data.Super58B);
    } catch (e) {
    }
}
