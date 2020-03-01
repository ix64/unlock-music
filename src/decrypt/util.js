export const FLAC_HEADER = [0x66, 0x4C, 0x61, 0x43];
export const MP3_HEADER = [0x49, 0x44, 0x33];
export const OGG_HEADER = [0x4F, 0x67, 0x67, 0x53];
export const M4A_HEADER = [0x66, 0x74, 0x79, 0x70];
export const AudioMimeType = {
    mp3: "audio/mpeg",
    flac: "audio/flac",
    m4a: "audio/mp4",
    ogg: "audio/ogg"
};

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

export function GetFileInfo(artist, title, filenameNoExt) {
    let newArtist = "", newTitle = "";
    let filenameArray = filenameNoExt.split("-");
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
export function GetCoverURL(metadata) {
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
    if (IsBytesEqual(M4A_HEADER, data.slice(4, 8))) return "m4a";
    return fallbackExt;
}
