import {
    AudioMimeType,
    DetectAudioExt,
    GetArrayBuffer,
    GetFileInfo,
    GetMetaCoverURL,
    GetWebImage,
    IXAREA_API_ENDPOINT
} from "./util";
import {QmcMaskCreate58, QmcMaskDetectMflac, QmcMaskDetectMgg, QmcMaskGetDefault} from "./qmcMask";
import {fromByteArray as Base64Encode, toByteArray as Base64Decode} from 'base64-js'

const MetaFlac = require('metaflac-js');

const ID3Writer = require("browser-id3-writer");

const iconv = require('iconv-lite');
const decode = iconv.decode

const musicMetadata = require("music-metadata-browser");

const HandlerMap = {
    "mgg": {handler: QmcMaskDetectMgg, ext: "ogg", detect: true},
    "mflac": {handler: QmcMaskDetectMflac, ext: "flac", detect: true},
    "qmc0": {handler: QmcMaskGetDefault, ext: "mp3", detect: false},
    "qmc2": {handler: QmcMaskGetDefault, ext: "ogg", detect: false},
    "qmc3": {handler: QmcMaskGetDefault, ext: "mp3", detect: false},
    "qmcogg": {handler: QmcMaskGetDefault, ext: "ogg", detect: false},
    "qmcflac": {handler: QmcMaskGetDefault, ext: "flac", detect: false},
    "bkcmp3": {handler: QmcMaskGetDefault, ext: "mp3", detect: false},
    "bkcflac": {handler: QmcMaskGetDefault, ext: "flac", detect: false},
    "tkm": {handler: QmcMaskGetDefault, ext: "m4a", detect: false},
    "666c6163": {handler: QmcMaskGetDefault, ext: "flac", detect: false},
    "6d7033": {handler: QmcMaskGetDefault, ext: "mp3", detect: false},
    "6f6767": {handler: QmcMaskGetDefault, ext: "ogg", detect: false},
    "6d3461": {handler: QmcMaskGetDefault, ext: "m4a", detect: false},
    "776176": {handler: QmcMaskGetDefault, ext: "wav", detect: false}
};

export async function Decrypt(file, raw_filename, raw_ext) {
    if (!(raw_ext in HandlerMap)) return {status: false, message: "File type is incorrect!"};
    const handler = HandlerMap[raw_ext];

    const fileData = new Uint8Array(await GetArrayBuffer(file));
    let audioData, seed, keyData;
    if (handler.detect) {
        const keyLen = new DataView(fileData.slice(fileData.length - 4).buffer).getUint32(0, true)
        const keyPos = fileData.length - 4 - keyLen;
        audioData = fileData.slice(0, keyPos);
        seed = handler.handler(audioData);
        keyData = fileData.slice(keyPos, keyPos + keyLen);
        if (seed === undefined) seed = await queryKeyInfo(keyData, raw_filename, raw_ext);
        if (seed === undefined) return {status: false, message: raw_ext + "格式仅提供实验性支持"};
    } else {
        audioData = fileData;
        seed = handler.handler(audioData);
    }
    let musicDecoded = seed.Decrypt(audioData);

    const ext = DetectAudioExt(musicDecoded, handler.ext);
    const mime = AudioMimeType[ext];

    let musicBlob = new Blob([musicDecoded], {type: mime});

    const musicMeta = await musicMetadata.parseBlob(musicBlob);
    for (let metaIdx in musicMeta.native) {
        if (musicMeta.native[metaIdx].some(item => item.id === "TCON" && item.value === "(12)")) {
            console.warn("The metadata is using gbk encoding")
            musicMeta.common.artist = decode(musicMeta.common.artist, "gbk");
            musicMeta.common.title = decode(musicMeta.common.title, "gbk");
            musicMeta.common.album = decode(musicMeta.common.album, "gbk");
        }
    }

    const info = GetFileInfo(musicMeta.common.artist, musicMeta.common.title, raw_filename);
    if (handler.detect) reportKeyUsage(keyData, seed.Matrix128,
        info.artist, info.title, musicMeta.common.album, raw_filename, raw_ext);

    let imgUrl = GetMetaCoverURL(musicMeta);
    if (imgUrl === "") {
        imgUrl = await queryAlbumCoverImage(info.artist, info.title, musicMeta.common.album);
        if (imgUrl !== "") {
            const imageInfo = await GetWebImage(imgUrl);
            if (imageInfo.url !== "") {
                imgUrl = imageInfo.url
                try {
                    if (ext === "mp3") {
                        let writer = new ID3Writer(musicDecoded)
                        writer.setFrame('APIC', {
                            type: 3,
                            data: imageInfo.buffer,
                            description: "Cover",
                        })
                        writer.addTag();
                        musicDecoded = writer.arrayBuffer
                        musicBlob = new Blob([musicDecoded], {type: mime});
                    } else if (ext === 'flac') {
                        const writer = new MetaFlac(Buffer.from(musicDecoded))
                        writer.importPictureFromBuffer(Buffer.from(imageInfo.buffer))
                        musicDecoded = writer.save()
                        musicBlob = new Blob([musicDecoded], {type: mime});
                    }
                } catch (e) {
                    console.warn("Error while appending cover image to file " + e)
                }
            }
        }
    }
    return {
        status: true,
        title: info.title,
        artist: info.artist,
        ext: ext,
        album: musicMeta.common.album,
        picture: imgUrl,
        file: URL.createObjectURL(musicBlob),
        mime: mime
    }
}

function reportKeyUsage(keyData, maskData, artist, title, album, filename, format) {
    fetch(IXAREA_API_ENDPOINT + "/qmcmask/usage", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            Mask: Base64Encode(new Uint8Array(maskData)), Key: Base64Encode(keyData),
            Artist: artist, Title: title, Album: album, Filename: filename, Format: format
        }),
    }).then().catch()
}

async function queryKeyInfo(keyData, filename, format) {
    try {
        const resp = await fetch(IXAREA_API_ENDPOINT + "/qmcmask/query", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({Format: format, Key: Base64Encode(keyData), Filename: filename, Type: 44}),
        });
        let data = await resp.json();
        return QmcMaskCreate58(Base64Decode(data.Matrix44));
    } catch (e) {
        console.log(e);
    }
}

async function queryAlbumCoverImage(artist, title, album) {
    const song_query_url = IXAREA_API_ENDPOINT + "/music/qq-cover"
    try {
        const params = {Artist: artist, Title: title, Album: album};
        let _url = song_query_url + "?";
        for (let pKey in params) {
            _url += pKey + "=" + encodeURIComponent(params[pKey]) + "&"
        }
        const resp = await fetch(_url)
        if (resp.ok) {
            let data = await resp.json();
            return song_query_url + "/" + data.Type + "/" + data.Id
        }

    } catch (e) {
        console.log(e);
    }
    return "";
}
