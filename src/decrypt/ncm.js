const CryptoJS = require("crypto-js");
const MetaFlac = require('metaflac-js');
const CORE_KEY = CryptoJS.enc.Hex.parse("687a4852416d736f356b496e62617857");
const META_KEY = CryptoJS.enc.Hex.parse("2331346C6A6B5F215C5D2630553C2728");
const MagicHeader = [0x43, 0x54, 0x45, 0x4E, 0x46, 0x44, 0x41, 0x4D];
import jimp from 'jimp';

import {
    AudioMimeType,
    DetectAudioExt,
    GetArrayBuffer,
    GetFileInfo,
    GetWebImage,
    IsBytesEqual,
    WriteMp3Meta
} from "./util"

export async function Decrypt(file, raw_filename, raw_ext) {
    const fileBuffer = await GetArrayBuffer(file);
    const dataView = new DataView(fileBuffer);

    if (!IsBytesEqual(MagicHeader, new Uint8Array(fileBuffer, 0, 8)))
        return {status: false, message: "此ncm文件已损坏"};

    const keyDataObj = getKeyData(dataView, fileBuffer, 10);
    const keyBox = getKeyBox(keyDataObj.data);

    const musicMetaObj = getMetaData(dataView, fileBuffer, keyDataObj.offset);
    const musicMeta = musicMetaObj.data;
    let audioOffset = musicMetaObj.offset + dataView.getUint32(musicMetaObj.offset + 5, true) + 13;
    let audioData = new Uint8Array(fileBuffer, audioOffset);

    let lenAudioData = audioData.length;
    for (let cur = 0; cur < lenAudioData; ++cur) audioData[cur] ^= keyBox[cur & 0xff];

    if (musicMeta.album === undefined) musicMeta.album = "";

    const artists = [];
    if (!!musicMeta.artist) musicMeta.artist.forEach(arr => artists.push(arr[0]));
    const info = GetFileInfo(artists.join("; "), musicMeta.musicName, raw_filename);
    if (artists.length === 0) artists.push(info.artist);

    if (musicMeta.format === undefined) musicMeta.format = DetectAudioExt(audioData, "mp3");
    console.log(musicMeta)

    const imageInfo = await GetWebImage(musicMeta.albumPic);
    while (!!imageInfo.buffer && imageInfo.buffer.byteLength >= 16 * 1024 * 1024) {
        let img = await jimp.read(imageInfo.buffer)
        await img.resize(Math.round(img.getHeight() / 2), jimp.AUTO)
        imageInfo.buffer = await img.getBufferAsync("image/jpeg")
    }
    console.log(imageInfo)
    try {
        if (musicMeta.format === "mp3") {
            audioData = await WriteMp3Meta(
                audioData, artists, info.title, musicMeta.album, imageInfo.buffer, musicMeta.albumPic);
        } else if (musicMeta.format === "flac") {
            const writer = new MetaFlac(Buffer.from(audioData))
            if (writer.getTag("TITLE") === "") writer.setTag("TITLE=" + info.title)
            if (writer.getTag("ALBUM") === "") writer.setTag("ALBUM=" + musicMeta.album)
            writer.removeTag("ARTIST")
            artists.forEach(artist => writer.setTag("ARTIST=" + artist))
            writer.importPictureFromBuffer(Buffer.from(imageInfo.buffer))
            audioData = writer.save()
        }
    } catch (e) {
        console.warn("Error while appending cover image to file " + e)
    }

    const mime = AudioMimeType[musicMeta.format];
    const musicData = new Blob([audioData], {type: mime});

    return {
        status: true,
        title: info.title,
        artist: info.artist,
        ext: musicMeta.format,
        album: musicMeta.album,
        picture: imageInfo.url,
        file: URL.createObjectURL(musicData),
        mime: mime
    };
}


function getKeyData(dataView, fileBuffer, offset) {
    const keyLen = dataView.getUint32(offset, true);
    offset += 4;
    const cipherText = new Uint8Array(fileBuffer, offset, keyLen).map(
        uint8 => uint8 ^ 0x64
    );
    offset += keyLen;

    const plainText = CryptoJS.AES.decrypt(
        {ciphertext: CryptoJS.lib.WordArray.create(cipherText)},
        CORE_KEY,
        {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }
    );

    const result = new Uint8Array(plainText.sigBytes);

    const words = plainText.words;
    const sigBytes = plainText.sigBytes;
    for (let i = 0; i < sigBytes; i++) {
        result[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }

    return {offset: offset, data: result.slice(17)};
}

function getKeyBox(keyData) {
    const box = new Uint8Array(Array(256).keys());

    const keyDataLen = keyData.length;

    let j = 0;

    for (let i = 0; i < 256; i++) {
        j = (box[i] + j + keyData[i % keyDataLen]) & 0xff;
        [box[i], box[j]] = [box[j], box[i]];
    }

    return box.map((_, i, arr) => {
        i = (i + 1) & 0xff;
        const si = arr[i];
        const sj = arr[(i + si) & 0xff];
        return arr[(si + sj) & 0xff];
    });
}

/**
 * @typedef {Object} MusicMetaType
 * @property {Number} musicId
 * @property {String} musicName
 * @property {[[String, Number]]} artist
 * @property {String} album
 * @property {"flac"|"mp3"} format
 * @property {String} albumPic
 */

function getMetaData(dataView, fileBuffer, offset) {
    const metaDataLen = dataView.getUint32(offset, true);
    offset += 4;
    if (metaDataLen === 0) return {data: {}, offset: offset};

    const cipherText = new Uint8Array(fileBuffer, offset, metaDataLen).map(
        data => data ^ 0x63
    );
    offset += metaDataLen;

    const plainText = CryptoJS.AES.decrypt({
            ciphertext: CryptoJS.enc.Base64.parse(
                CryptoJS.lib.WordArray.create(cipherText.slice(22)).toString(CryptoJS.enc.Utf8)
            )
        },
        META_KEY,
        {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7}
    ).toString(CryptoJS.enc.Utf8);
    const labelIndex = plainText.indexOf(":");
    let result = JSON.parse(plainText.slice(labelIndex + 1));
    if (plainText.slice(0, labelIndex) === "dj") {
        result = result.mainMusic;
    }
    if (!!result.albumPic && result.albumPic !== "")
        result.albumPic = result.albumPic.replace("http://", "https://") + "?param=500y500";

    return {data: result, offset: offset};
}


