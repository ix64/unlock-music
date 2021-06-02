import {AudioMimeType, GetArrayBuffer, GetCoverFromFile, GetMetaFromFile, SniffAudioExt} from "@/decrypt/utils.ts";

import {Decrypt as QmcDecrypt} from "@/decrypt/qmc";

import {DecryptResult} from "@/decrypt/entity";

import {parseBlob as metaParseBlob} from "music-metadata-browser";

export async function Decrypt(file: Blob, raw_filename: string, raw_ext: string, detect: boolean = true)
    : Promise<DecryptResult> {
    let ext = raw_ext;
    if (detect) {
        const buffer = new Uint8Array(await GetArrayBuffer(file));
        let length = buffer.length
        for (let i = 0; i < length; i++) {
             buffer[i] ^= 0xf4
             if(buffer[i] <= 0x3f)buffer[i] = buffer[i] * 4;
             else if(buffer[i] <= 0x7f)buffer[i] = (buffer[i] - 0x40) * 4 + 1;
             else if(buffer[i] <= 0xbf)buffer[i] = (buffer[i] - 0x80) * 4 + 2;
             else buffer[i] = (buffer[i] - 0xc0) * 4 + 3;
        }
        ext = SniffAudioExt(buffer, raw_ext);
        if (ext !== raw_ext) file = new Blob([buffer], {type: AudioMimeType[ext]})
        else {
            file = new Blob([buffer], {type: "application/octet-stream"})
            let ext = raw_filename.substring(file.name.lastIndexOf(".") + 1, file.name.length).toLowerCase();
            if (ext !== "mgg" && ext !== "mflac") throw "不支持的QQ音乐缓存格式：" + raw_filename + ".cache";
            return QmcDecrypt(file, raw_filename, ext+".cache");
        }
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
