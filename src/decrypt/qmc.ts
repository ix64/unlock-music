import {QmcMask, QmcMaskDetectMflac, QmcMaskDetectMgg, QmcMaskGetDefault} from "./qmcMask";
import {toByteArray as Base64Decode} from 'base64-js'
import {
    AudioMimeType,
    GetArrayBuffer,
    GetCoverFromFile,
    GetImageFromURL,
    GetMetaFromFile,
    SniffAudioExt, WriteMetaToFlac, WriteMetaToMp3
} from "@/decrypt/utils.ts";
import {parseBlob as metaParseBlob} from "music-metadata-browser";


import iconv from "iconv-lite";
import {DecryptResult} from "@/decrypt/entity";
import {queryAlbumCover, queryKeyInfo, reportKeyUsage} from "@/utils/api";

interface Handler {
    ext: string
    detect: boolean

    handler(data?: Uint8Array): QmcMask | undefined
}

const HandlerMap: { [key: string]: Handler } = {
    "mgg": {handler: QmcMaskDetectMgg, ext: "ogg", detect: true},
    "mflac": {handler: QmcMaskDetectMflac, ext: "flac", detect: true},
    "mgg.cache": {handler: QmcMaskDetectMgg, ext: "ogg", detect: false},
    "mflac.cache": {handler: QmcMaskDetectMflac, ext: "flac", detect: false},
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

export async function Decrypt(file: File, raw_filename: string, raw_ext: string): Promise<DecryptResult> {
    if (!(raw_ext in HandlerMap)) throw "File type is incorrect!";
    const handler = HandlerMap[raw_ext];

    const fileData = new Uint8Array(await GetArrayBuffer(file));
    let audioData, seed, keyData;
    if (handler.detect) {
        const keyLen = new DataView(fileData.slice(fileData.length - 4).buffer).getUint32(0, true)
        const keyPos = fileData.length - 4 - keyLen;
        audioData = fileData.slice(0, keyPos);
        seed = handler.handler(audioData);
        keyData = fileData.slice(keyPos, keyPos + keyLen);
        if (!seed) seed = await queryKey(keyData, raw_filename, raw_ext);
        if (!seed) throw raw_ext + "格式仅提供实验性支持";
    } else {
        audioData = fileData;
        seed = handler.handler(audioData) as QmcMask;
        if (!seed) throw raw_ext + "格式仅提供实验性支持";
    }
    let musicDecoded = seed.Decrypt(audioData);

    const ext = SniffAudioExt(musicDecoded, handler.ext);
    const mime = AudioMimeType[ext];

    let musicBlob = new Blob([musicDecoded], {type: mime});

    const musicMeta = await metaParseBlob(musicBlob);
    for (let metaIdx in musicMeta.native) {
        if (!musicMeta.native.hasOwnProperty(metaIdx)) continue
        if (musicMeta.native[metaIdx].some(item => item.id === "TCON" && item.value === "(12)")) {
            console.warn("try using gbk encoding to decode meta")
            musicMeta.common.artist = iconv.decode(new Buffer(musicMeta.common.artist ?? ""), "gbk");
            musicMeta.common.title = iconv.decode(new Buffer(musicMeta.common.title ?? ""), "gbk");
            musicMeta.common.album = iconv.decode(new Buffer(musicMeta.common.album ?? ""), "gbk");
        }
    }

    const info = GetMetaFromFile(raw_filename, musicMeta.common.title, musicMeta.common.artist)
    if (keyData) reportKeyUsage(keyData, seed.getMatrix128(),
        raw_filename, raw_ext, info.title, info.artist, musicMeta.common.album).then().catch();

    let imgUrl = GetCoverFromFile(musicMeta);
    if (!imgUrl) {
        imgUrl = await getCoverImage(info.title, info.artist, musicMeta.common.album);
        if (imgUrl) {
            const imageInfo = await GetImageFromURL(imgUrl);
            if (imageInfo) {
                imgUrl = imageInfo.url
                try {
                    const newMeta = {picture: imageInfo.buffer, title: info.title, artists: info.artist?.split(" _ ")}
                    if (ext === "mp3") {
                        musicDecoded = WriteMetaToMp3(Buffer.from(musicDecoded), newMeta, musicMeta)
                        musicBlob = new Blob([musicDecoded], {type: mime});
                    } else if (ext === 'flac') {
                        musicDecoded = WriteMetaToFlac(Buffer.from(musicDecoded), newMeta, musicMeta)
                        musicBlob = new Blob([musicDecoded], {type: mime});
                    } else {
                        console.info("writing metadata for " + ext + " is not being supported for now")
                    }
                } catch (e) {
                    console.warn("Error while appending cover image to file " + e)
                }
            }
        }
    }
    return {
        title: info.title,
        artist: info.artist,
        ext: ext,
        album: musicMeta.common.album,
        picture: imgUrl,
        file: URL.createObjectURL(musicBlob),
        blob: musicBlob,
        mime: mime
    }
}


async function queryKey(keyData: Uint8Array, filename: string, format: string): Promise<QmcMask | undefined> {
    try {
        const data = await queryKeyInfo(keyData, filename, format)
        return new QmcMask(Base64Decode(data.Matrix44));
    } catch (e) {
        console.warn(e);
    }
}

async function getCoverImage(title: string, artist?: string, album?: string): Promise<string> {
    const song_query_url = "https://stats.ixarea.com/apis" + "/music/qq-cover"
    try {
        const data = await queryAlbumCover(title, artist, album)
        return `${song_query_url}/${data.Type}/${data.Id}`
    } catch (e) {
        console.warn(e);
    }
    return ""
}
