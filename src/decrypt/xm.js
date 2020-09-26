import {AudioMimeType, GetArrayBuffer, GetFileInfo, GetMetaCoverURL, IsBytesEqual} from "./util";

import {Decrypt as RawDecrypt} from "./raw";

const musicMetadata = require("music-metadata-browser");
const MagicHeader = [0x69, 0x66, 0x6D, 0x74]
const MagicHeader2 = [0xfe, 0xfe, 0xfe, 0xfe]
const FileTypeMap = {
    " WAV": ".wav",
    "FLAC": ".flac",
    " MP3": ".mp3",
    " A4M": ".m4a",
}

export async function Decrypt(file, raw_filename, raw_ext) {
    const oriData = new Uint8Array(await GetArrayBuffer(file));
    if (!IsBytesEqual(MagicHeader, oriData.slice(0, 4)) ||
        !IsBytesEqual(MagicHeader2, oriData.slice(8, 12))) {
        if (raw_ext === "xm") {
            return {status: false, message: "此xm文件已损坏"}
        } else {
            return await RawDecrypt(file, raw_filename, raw_ext, true)
        }
    }

    let typeText = (new TextDecoder()).decode(oriData.slice(4, 8))
    if (!FileTypeMap.hasOwnProperty(typeText)) {
        return {status: false, message: "未知的xm文件类型"}
    }

    let key = oriData[0xf]
    let dataOffset = oriData[0xc] | oriData[0xd] << 8 | oriData[0xe] << 16
    let audioData = oriData.slice(0x10);
    let lenAudioData = audioData.length;
    for (let cur = dataOffset; cur < lenAudioData; ++cur)
        audioData[cur] = (audioData[cur] - key) ^ 0xff;

    const ext = FileTypeMap[typeText];
    const mime = AudioMimeType[ext];
    let musicBlob = new Blob([audioData], {type: mime});

    const musicMeta = await musicMetadata.parseBlob(musicBlob);
    if (ext === "wav") {
        //todo:未知的编码方式
        console.log(musicMeta.common)
        musicMeta.common.album = "";
        musicMeta.common.artist = "";
        musicMeta.common.title = "";
    }
    let _sep = raw_filename.indexOf("_") === -1 ? "-" : "_"
    const info = GetFileInfo(musicMeta.common.artist, musicMeta.common.title, raw_filename, _sep);

    const imgUrl = GetMetaCoverURL(musicMeta);

    return {
        status: true,
        title: info.title,
        artist: info.artist,
        ext: ext,
        album: musicMeta.common.album,
        picture: imgUrl,
        file: URL.createObjectURL(musicBlob),
        mime: mime,
        rawExt: "xm"
    }
}

