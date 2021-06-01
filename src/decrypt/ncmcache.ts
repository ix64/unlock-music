import {AudioMimeType, GetArrayBuffer, GetCoverFromFile, GetMetaFromFile, SniffAudioExt} from "@/decrypt/utils.ts";

import {DecryptResult} from "@/decrypt/entity";

import {parseBlob as metaParseBlob} from "music-metadata-browser";

export async function Decrypt(file: Blob, raw_filename: string, raw_ext: string, detect: boolean = true)
    : Promise<DecryptResult> {
    let ext = raw_ext;
    if (detect) {
        const buffer = new Uint8Array(await GetArrayBuffer(file));
        let length = buffer.length
        for (let i = 0; i < length; i++) {
             buffer[i] ^= 163
        }
        ext = SniffAudioExt(buffer, raw_ext);
        if (ext !== raw_ext) file = new Blob([buffer], {type: AudioMimeType[ext]})
    }
    const tag = await metaParseBlob(file);
    const {title, artist} = GetMetaFromFile(raw_filename, tag.common.title, tag.common.artist)

    return {
        title,
        artist,
        ext,
        album: tag.common.album,
        picture: GetCoverFromFile(tag),
        file: URL.createObjectURL(file),
        blob: file,
        mime: AudioMimeType[ext]
    }
}
