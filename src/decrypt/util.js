const ID3Writer = require("browser-id3-writer");
export const FLAC_HEADER = [0x66, 0x4C, 0x61, 0x43];
export const MP3_HEADER = [0x49, 0x44, 0x33];
export const OGG_HEADER = [0x4F, 0x67, 0x67, 0x53];
export const M4A_HEADER = [0x66, 0x74, 0x79, 0x70];
export const WMA_HEADER = [
    0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11,
    0xA6, 0xD9, 0x00, 0xAA, 0x00, 0x62, 0xCE, 0x6C,
]
export const WAV_HEADER = [0x52, 0x49, 0x46, 0x46]
export const AudioMimeType = {
    mp3: "audio/mpeg",
    flac: "audio/flac",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    wma: "audio/x-ms-wma",
    wav: "audio/x-wav"
};
export const IXAREA_API_ENDPOINT = "https://stats.ixarea.com/apis"

// Also a new draft API: blob.arrayBuffer()
export async function GetArrayBuffer(blobObject) {
    return await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        reader.readAsArrayBuffer(blobObject);
    });
}

export function GetFileInfo(artist, title, filenameNoExt, separator = "-") {
    let newArtist = "", newTitle = "";
    let filenameArray = filenameNoExt.split(separator);
    if (filenameArray.length > 1) {
        newArtist = filenameArray[0].trim();
        newTitle = filenameArray[1].trim();
    } else if (filenameArray.length === 1) {
        newTitle = filenameArray[0].trim();
    }

    if (typeof artist == "string" && artist !== "") newArtist = artist;
    if (typeof title == "string" && title !== "") newTitle = title;
    return {artist: newArtist, title: newTitle};
}

/**
 * @return {string}
 */
export function GetMetaCoverURL(metadata) {
    let pic_url = "";
    if (metadata.common.picture !== undefined && metadata.common.picture.length > 0) {
        let pic = new Blob([metadata.common.picture[0].data], {type: metadata.common.picture[0].format});
        pic_url = URL.createObjectURL(pic);
    }
    return pic_url;
}

export function IsBytesEqual(first, second) {
    // if want wholly check, should length first>=second
    return first.every((val, idx) => {
        return val === second[idx];
    })
}

/**
 * @return {string}
 */
export function DetectAudioExt(data, fallbackExt) {
    if (IsBytesEqual(MP3_HEADER, data.slice(0, MP3_HEADER.length))) return "mp3";
    if (IsBytesEqual(FLAC_HEADER, data.slice(0, FLAC_HEADER.length))) return "flac";
    if (IsBytesEqual(OGG_HEADER, data.slice(0, OGG_HEADER.length))) return "ogg";
    if (IsBytesEqual(M4A_HEADER, data.slice(4, 4 + M4A_HEADER.length))) return "m4a";
    if (IsBytesEqual(WMA_HEADER, data.slice(0, WMA_HEADER.length))) return "wma";
    if (IsBytesEqual(WAV_HEADER, data.slice(0, WAV_HEADER.length))) return "wav";
    return fallbackExt;
}


export async function GetWebImage(pic_url) {
    try {
        let resp = await fetch(pic_url);
        let mime = resp.headers.get("Content-Type");
        if (mime.startsWith("image/")) {
            let buf = await resp.arrayBuffer();
            let objBlob = new Blob([buf], {type: mime});
            let objUrl = URL.createObjectURL(objBlob);
            return {"buffer": buf, "src": pic_url, "url": objUrl, "type": mime};
        }
    } catch (e) {
    }
    return {"buffer": null, "src": pic_url, "url": "", "type": ""}
}

export function WriteMp3Meta(audioData, artistList, title, album, pictureData = null, pictureDesc = "Cover") {
    const writer = new ID3Writer(audioData);
    writer.setFrame("TPE1", artistList)
        .setFrame("TIT2", title)
        .setFrame("TALB", album);
    if (pictureData !== null) {
        writer.setFrame('APIC', {
            type: 3,
            data: pictureData,
            description: pictureDesc,
        })
    }
    writer.addTag();
    return writer.arrayBuffer;
}

