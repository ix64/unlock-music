import {Decrypt as RawDecrypt} from "./raw";
import {GetArrayBuffer} from "./util";

const TM_HEADER = [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70];

export async function Decrypt(file, raw_filename) {
    const fileBuffer = await GetArrayBuffer(file);
    const audioData = new Uint8Array(fileBuffer);
    for (let cur = 0; cur < 8; ++cur) {
        audioData[cur] = TM_HEADER[cur];
    }
    const musicData = new Blob([audioData], {type: "audio/mp4"});
    return await RawDecrypt(musicData, raw_filename, "m4a", false)
}
