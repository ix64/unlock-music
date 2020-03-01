const musicMetadata = require("music-metadata-browser");
import {GetCoverURL, GetFileInfo, AudioMimeType, DetectAudioExt, GetArrayBuffer} from "./util";

export async function Decrypt(file, raw_filename, raw_ext, detect = true) {
    let ext = raw_ext;
    if (detect) {
        const buffer = new Uint8Array(await GetArrayBuffer(file));
        ext = DetectAudioExt(buffer, raw_ext);
        if (ext !== raw_ext) file = new Blob([buffer], {type: AudioMimeType[ext]})
    }
    const tag = await musicMetadata.parseBlob(file);
    const info = GetFileInfo(tag.common.artist, tag.common.title, raw_filename);
    return {
        status: true,
        title: info.title,
        artist: info.artist,
        ext: ext,
        album: tag.common.album,
        picture: GetCoverURL(tag),
        file: URL.createObjectURL(file),
        mime: AudioMimeType[ext]
    }
}
