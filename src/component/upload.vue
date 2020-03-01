<template>
    <el-upload
            :auto-upload="false"
            :on-change="handleFile"
            :show-file-list="false"
            action=""
            drag
            multiple>
        <i class="el-icon-upload"/>
        <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
        <div class="el-upload__tip" slot="tip">本工具仅在浏览器内对文件进行解锁，无需消耗流量</div>
    </el-upload>
</template>

<script>
    "use strict";// 严格模式 用于尾调用优化

    export default {
        name: "upload",
        data() {
            return {
                cacheQueue: [],
                workers: [],
                idle_workers: [],
                thread_num: 1
            }
        },
        mounted() {
            if (document.location.host !== "" && process.env.NODE_ENV === 'production') {
                this.thread_num = navigator.hardwareConcurrency || 1;
                const worker = require("workerize-loader!../decrypt/common");
                // noinspection JSValidateTypes,JSUnresolvedVariable
                this.workers.push(worker().CommonDecrypt);
                this.idle_workers.push(0);
                // delay to optimize for first loading
                setTimeout(() => {
                    for (let i = 1; i < this.thread_num; i++) {
                        // noinspection JSValidateTypes,JSUnresolvedVariable
                        this.workers.push(worker().CommonDecrypt);
                        this.idle_workers.push(i);
                    }
                }, 1000);
            } else {
                const dec = require('../decrypt/common');
                this.workers.push(dec.CommonDecrypt);
                this.idle_workers.push(0)
            }
        },
        methods: {
            handleFile(file) {
                // 有空闲worker 立刻处理文件
                if (this.idle_workers.length > 0) {
                    this.handleDoFile(file, this.idle_workers.shift());
                }
                // 无空闲worker 则放入缓存队列
                else {
                    this.cacheQueue.push(file);
                }
            },
            handleCacheQueue(worker_id) {
                // 调用方法消费缓存队列中的数据
                if (this.cacheQueue.length === 0) {
                    this.idle_workers.push(worker_id);
                    return
                }
                this.handleDoFile(this.cacheQueue.shift(), worker_id);
            },
            handleDoFile(file, worker_id) {
                this.workers[worker_id](file).then(data => {
                    this.$emit("handle_finish", data);
                    // 完成之后 执行新任务 todo: 可能导致call stack过长
                    this.handleCacheQueue(worker_id);
                }).catch(err => {
                    this.$emit("handle_error", err, file.name);
                    this.handleCacheQueue(worker_id);
                })
            },
        }
    }
</script>

<style scoped>
    /*noinspection CssUnusedSymbol*/
    .el-upload-dragger {
        width: 80vw !important;
    }
</style>
