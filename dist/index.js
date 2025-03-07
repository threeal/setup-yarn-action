import fs, { mkdirSync } from 'node:fs';
import fsPromises from 'node:fs/promises';
import os, { homedir } from 'node:os';
import path from 'node:path';
import https from 'node:https';
import { spawn } from 'node:child_process';
import 'node:crypto';
import require$$0$3 from 'string_decoder';
import require$$0$2 from 'os';
import require$$1$1 from 'events';
import require$$2 from 'child_process';
import require$$1 from 'path';
import require$$0$1 from 'assert';
import require$$0 from 'fs';
import require$$6 from 'timers';

/**
 * @internal
 * Retrieves the value of an environment variable.
 *
 * @param name - The name of the environment variable.
 * @returns The value of the environment variable.
 * @throws Error if the environment variable is not defined.
 */
function mustGetEnvironment(name) {
    const value = process.env[name];
    if (value === undefined) {
        throw new Error(`the ${name} environment variable must be defined`);
    }
    return value;
}
/**
 * Retrieves the value of a GitHub Actions input.
 *
 * @param name - The name of the GitHub Actions input.
 * @returns The value of the GitHub Actions input, or an empty string if not found.
 */
function getInput(name) {
    const value = process.env[`INPUT_${name.toUpperCase()}`] ?? "";
    return value.trim();
}
/**
 * Adds a system path to the environment in GitHub Actions.
 *
 * @param sysPath - The system path to add to the environment.
 * @returns A promise that resolves when the system path is successfully added.
 */
async function addPath(sysPath) {
    process.env.PATH =
        process.env.PATH !== undefined
            ? `${sysPath}${path.delimiter}${process.env.PATH}`
            : sysPath;
    const filePath = mustGetEnvironment("GITHUB_PATH");
    await fsPromises.appendFile(filePath, `${sysPath}${os.EOL}`);
}

/**
 * Logs an information message in GitHub Actions.
 *
 * @param message - The information message to log.
 */
function logInfo(message) {
    process.stdout.write(`${message}${os.EOL}`);
}
/**
 * Logs a warning message in GitHub Actions.
 *
 * @param message - The warning message to log.
 */
function logWarning(message) {
    process.stdout.write(`::warning::${message}${os.EOL}`);
}
/**
 * Logs an error message in GitHub Actions.
 *
 * @param err - The error, which can be of any type.
 */
function logError(err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stdout.write(`::error::${message}${os.EOL}`);
}
/**
 * Begins a log group in GitHub Actions.
 *
 * @param name - The name of the log group.
 */
function beginLogGroup(name) {
    process.stdout.write(`::group::${name}${os.EOL}`);
}
/**
 * Ends the current log group in GitHub Actions.
 */
function endLogGroup() {
    process.stdout.write(`::endgroup::${os.EOL}`);
}

/**
 * Sends an HTTP request containing raw data.
 *
 * @param req - The HTTP request object.
 * @param data - The raw data to be sent in the request body.
 * @returns A promise that resolves to an HTTP response object.
 */
async function sendRequest(req, data) {
    return new Promise((resolve, reject) => {
        req.on("response", (res) => resolve(res));
        req.on("error", reject);
        if (data !== undefined)
            req.write(data);
        req.end();
    });
}
/**
 * Sends an HTTP request containing JSON data.
 *
 * @param req - The HTTP request object.
 * @param data - The JSON data to be sent in the request body.
 * @returns A promise that resolves to an HTTP response object.
 */
async function sendJsonRequest(req, data) {
    req.setHeader("Content-Type", "application/json");
    return sendRequest(req, JSON.stringify(data));
}
/**
 * Sends an HTTP request containing a binary stream.
 *
 * @param req - The HTTP request object.
 * @param bin - The binary stream to be sent in the request body.
 * @param start - The starting byte of the binary stream.
 * @param end - The ending byte of the binary stream.
 * @returns A promise that resolves to an HTTP response object.
 */
async function sendStreamRequest(req, bin, start, end) {
    return new Promise((resolve, reject) => {
        req.setHeader("Content-Type", "application/octet-stream");
        req.setHeader("Content-Range", `bytes ${start}-${end}/*`);
        req.on("response", (res) => resolve(res));
        req.on("error", reject);
        bin.pipe(req);
    });
}
/**
 * Asserts whether the content type of the given HTTP incoming message matches
 * the expected type.
 *
 * @param msg - The HTTP incoming message.
 * @param expectedType - The expected content type of the message.
 * @throws {Error} Throws an error if the content type does not match the
 * expected type.
 */
function assertIncomingMessageContentType(msg, expectedType) {
    const actualType = msg.headers["content-type"] ?? "undefined";
    if (!actualType.includes(expectedType)) {
        throw new Error(`expected content type to be '${expectedType}', but instead got '${actualType}'`);
    }
}
/**
 * Waits until an HTTP incoming message has ended.
 *
 * @param msg - The HTTP incoming message.
 * @returns A promise that resolves when the incoming message ends.
 */
async function waitIncomingMessage(msg) {
    return new Promise((resolve, reject) => {
        msg.on("data", () => {
            /** discarded **/
        });
        msg.on("end", resolve);
        msg.on("error", reject);
    });
}
/**
 * Reads the data from an HTTP incoming message.
 *
 * @param msg - The HTTP incoming message.
 * @returns A promise that resolves to the buffered data from the message.
 */
async function readIncomingMessage(msg) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        msg.on("data", (chunk) => chunks.push(chunk));
        msg.on("end", () => resolve(Buffer.concat(chunks)));
        msg.on("error", reject);
    });
}
/**
 * Reads the JSON data from an HTTP incoming message.
 *
 * @typeParam T - The expected type of the parsed JSON data.
 * @param msg - The HTTP incoming message.
 * @returns A promise that resolves to the parsed JSON data from the message.
 */
async function readJsonIncomingMessage(msg) {
    assertIncomingMessageContentType(msg, "application/json");
    const buffer = await readIncomingMessage(msg);
    return JSON.parse(buffer.toString());
}
/**
 * Reads the error data from an HTTP incoming message.
 *
 * @param msg - The HTTP incoming message.
 * @returns A promise that resolves to an `Error` object based on the error
 * data from the message.
 */
async function readErrorIncomingMessage(msg) {
    const buffer = await readIncomingMessage(msg);
    const contentType = msg.headers["content-type"];
    if (contentType !== undefined) {
        if (contentType.includes("application/json")) {
            const data = JSON.parse(buffer.toString());
            if (typeof data === "object" && "message" in data) {
                return new Error(`${data["message"]} (${msg.statusCode})`);
            }
        }
        else if (contentType.includes("application/xml")) {
            const data = buffer.toString().match(/<Message>(.*?)<\/Message>/s);
            if (data !== null && data.length > 1) {
                return new Error(`${data[1]} (${msg.statusCode})`);
            }
        }
    }
    return new Error(`${buffer.toString()} (${msg.statusCode})`);
}

function createCacheRequest(resourcePath, options) {
    const url = `${process.env["ACTIONS_CACHE_URL"]}_apis/artifactcache/${resourcePath}`;
    const req = https.request(url, options);
    req.setHeader("Accept", "application/json;api-version=6.0-preview");
    const bearer = `Bearer ${process.env["ACTIONS_RUNTIME_TOKEN"]}`;
    req.setHeader("Authorization", bearer);
    return req;
}
/**
 * Sends a request to retrieve cache information for the specified key and version.
 *
 * @param key - The cache key.
 * @param version - The cache version.
 * @returns A promise that resolves with the cache information or null if not found.
 */
async function requestGetCache(key, version) {
    const resourcePath = `cache?keys=${key}&version=${version}`;
    const req = createCacheRequest(resourcePath, { method: "GET" });
    const res = await sendRequest(req);
    switch (res.statusCode) {
        case 200:
            return await readJsonIncomingMessage(res);
        // Cache not found, return null.
        case 204:
            await waitIncomingMessage(res);
            return null;
        default:
            throw await readErrorIncomingMessage(res);
    }
}
/**
 * Sends a request to reserve a cache with the specified key, version, and size.
 *
 * @param key - The key of the cache to reserve.
 * @param version - The version of the cache to reserve.
 * @param size - The size of the cache to reserve, in bytes.
 * @returns A promise that resolves to the reserved cache ID, or null if the
 * cache is already reserved.
 */
async function requestReserveCache(key, version, size) {
    const req = createCacheRequest("caches", { method: "POST" });
    const res = await sendJsonRequest(req, { key, version, cacheSize: size });
    switch (res.statusCode) {
        case 201: {
            const { cacheId } = await readJsonIncomingMessage(res);
            return cacheId;
        }
        // Cache already reserved, return null.
        case 409:
            await waitIncomingMessage(res);
            return null;
        default:
            throw await readErrorIncomingMessage(res);
    }
}
/**
 * Sends multiple requests to upload a file to the cache with the specified ID.
 *
 * @param id - The cache ID.
 * @param filePath - The path of the file to upload.
 * @param fileSize - The size of the file to upload, in bytes.
 * @param options - The upload options.
 * @param options.maxChunkSize - The maximum size of each chunk to be uploaded,
 * in bytes. Defaults to 4 MB.
 * @returns A promise that resolves when the file has been uploaded.
 */
async function requestUploadCache(id, filePath, fileSize, options) {
    const { maxChunkSize } = {
        maxChunkSize: 4 * 1024 * 1024,
        ...options,
    };
    const proms = [];
    for (let start = 0; start < fileSize; start += maxChunkSize) {
        proms.push((async () => {
            const end = Math.min(start + maxChunkSize - 1, fileSize);
            const bin = fs.createReadStream(filePath, { start, end });
            const req = createCacheRequest(`caches/${id}`, { method: "PATCH" });
            const res = await sendStreamRequest(req, bin, start, end);
            switch (res.statusCode) {
                case 204:
                    await waitIncomingMessage(res);
                    break;
                default:
                    throw await readErrorIncomingMessage(res);
            }
        })());
    }
    await Promise.all(proms);
}
/**
 * Sends a request to commit a cache with the specified ID.
 *
 * @param id - The cache ID.
 * @param size - The size of the cache to be committed, in bytes.
 * @returns A promise that resolves when the cache has been committed.
 */
async function requestCommitCache(id, size) {
    const req = createCacheRequest(`caches/${id}`, { method: "POST" });
    const res = await sendJsonRequest(req, { size });
    if (res.statusCode !== 204) {
        throw await readErrorIncomingMessage(res);
    }
    await waitIncomingMessage(res);
}

/**
 * Waits for a child process to exit.
 *
 * @param proc - The child process to wait for.
 * @returns A promise that resolves when the child process exits successfully,
 * or rejects if the process fails.
 */
async function waitChildProcess(proc) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        proc.stderr?.on("data", (chunk) => chunks.push(chunk));
        proc.on("error", reject);
        proc.on("close", (code) => {
            if (code === 0) {
                resolve(undefined);
            }
            else {
                reject(new Error([
                    `Process failed: ${proc.spawnargs.join(" ")}`,
                    Buffer.concat(chunks).toString(),
                ].join("\n")));
            }
        });
    });
}
/**
 * Creates a compressed archive from files using Tar and Zstandard.
 *
 * @param archivePath - The output path for the compressed archive.
 * @param filePaths - The paths of the files to be archived.
 * @returns A promise that resolves when the compressed archive is created.
 */
async function createArchive(archivePath, filePaths) {
    const tar = spawn("tar", ["-cf", "-", "-P", ...filePaths]);
    const zstd = spawn("zstd", ["-T0", "-o", archivePath]);
    tar.stdout.pipe(zstd.stdin);
    await Promise.all([waitChildProcess(tar), waitChildProcess(zstd)]);
}
/**
 * Extracts files from a compressed archive using Tar and Zstandard.
 *
 * @param archivePath - The path to the compressed archive to be extracted.
 * @returns A promise that resolves when the files have been successfully extracted.
 */
async function extractArchive(archivePath) {
    const zstd = spawn("zstd", ["-d", "-T0", "-c", archivePath]);
    const tar = spawn("tar", ["-xf", "-", "-P"]);
    zstd.stdout.pipe(tar.stdin);
    await Promise.all([waitChildProcess(zstd), waitChildProcess(tar)]);
}

/**
 * Retrieves the file size of a file to be downloaded from the specified URL.
 *
 * @param url - The URL of the file to be downloaded.
 * @returns A promise that resolves to the size of the file to be downloaded, in bytes.
 */
async function getDownloadFileSize(url) {
    const req = https.request(url, { method: "HEAD" });
    const res = await sendRequest(req);
    switch (res.statusCode) {
        case 200: {
            await readIncomingMessage(res);
            return Number.parseInt(res.headers["content-length"]);
        }
        default:
            throw await readErrorIncomingMessage(res);
    }
}
/**
 * Downloads a file from the specified URL and saves it to the provided path.
 *
 * @param url - The URL of the file to be downloaded.
 * @param savePath - The path where the downloaded file will be saved.
 * @param options - The download options.
 * @param options.maxChunkSize - The maximum size of each chunk to be downloaded
 * in bytes. Defaults to 4 MB.
 * @returns A promise that resolves when the download is complete.
 */
async function downloadFile(url, savePath, options) {
    const { maxChunkSize } = {
        maxChunkSize: 4 * 1024 * 1024,
        ...options,
    };
    const [file, fileSize] = await Promise.all([
        fsPromises.open(savePath, "w"),
        getDownloadFileSize(url),
    ]);
    const proms = [];
    for (let start = 0; start < fileSize; start += maxChunkSize) {
        proms.push((async () => {
            const end = Math.min(start + maxChunkSize - 1, fileSize);
            const req = https.request(url, { method: "GET" });
            req.setHeader("range", `bytes=${start}-${end}`);
            const res = await sendRequest(req);
            if (res.statusCode === 206) {
                assertIncomingMessageContentType(res, "application/octet-stream");
                const buffer = await readIncomingMessage(res);
                await file.write(buffer, 0, buffer.length, start);
            }
            else {
                throw await readErrorIncomingMessage(res);
            }
        })());
    }
    await Promise.all(proms);
    await file.close();
}

/**
 * Restores files from the cache using the specified key and version.
 *
 * @param key - The cache key.
 * @param version - The cache version.
 * @returns A promise that resolves to a boolean value indicating whether the
 * file was restored successfully.
 */
async function restoreCache(key, version) {
    const cache = await requestGetCache(key, version);
    if (cache === null)
        return false;
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "temp-"));
    const archivePath = path.join(tempDir, "cache.tar.zst");
    await downloadFile(cache.archiveLocation, archivePath);
    await extractArchive(archivePath);
    await fsPromises.rm(tempDir, { recursive: true });
    return true;
}
/**
 * Saves files to the cache using the specified key and version.
 *
 * @param key - The cache key.
 * @param version - The cache version.
 * @param filePaths - The paths of the files to be saved.
 * @returns A promise that resolves to a boolean value indicating whether the
 * file was saved successfully.
 */
async function saveCache(key, version, filePaths) {
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "temp-"));
    const archivePath = path.join(tempDir, "cache.tar.zst");
    await createArchive(archivePath, filePaths);
    const archiveStat = await fsPromises.stat(archivePath);
    const cacheId = await requestReserveCache(key, version, archiveStat.size);
    if (cacheId === null) {
        await fsPromises.rm(tempDir, { recursive: true });
        return false;
    }
    await requestUploadCache(cacheId, archivePath, archiveStat.size);
    await requestCommitCache(cacheId, archiveStat.size);
    await fsPromises.rm(tempDir, { recursive: true });
    return true;
}

function r(r){return function(r){if("object"==typeof(e=r)&&null!==e&&"message"in e&&"string"==typeof e.message)return r;var e;try{return new Error(JSON.stringify(r))}catch(e){return new Error(String(r))}}(r).message}

const {Worker} = await (async () => {
	try {
		return await import('node:worker_threads');
	} catch {
		return {};
	}
})();

let worker; // Lazy
let taskIdCounter = 0;
const tasks = new Map();

const recreateWorkerError = sourceError => {
	const error = new Error(sourceError.message);

	for (const [key, value] of Object.entries(sourceError)) {
		if (key !== 'message') {
			error[key] = value;
		}
	}

	return error;
};

const createWorker = () => {
	worker = new Worker(new URL('thread.js', import.meta.url));

	worker.on('message', message => {
		const task = tasks.get(message.id);
		tasks.delete(message.id);

		if (tasks.size === 0) {
			worker.unref();
		}

		if (message.error === undefined) {
			task.resolve(message.value);
		} else {
			task.reject(recreateWorkerError(message.error));
		}
	});

	worker.on('error', error => {
		// Any error here is effectively an equivalent of segfault, and have no scope, so we just throw it on callback level
		throw error;
	});
};

const taskWorker = (method, arguments_, transferList) => new Promise((resolve, reject) => {
	const id = taskIdCounter++;
	tasks.set(id, {resolve, reject});

	if (worker === undefined) {
		createWorker();
	}

	worker.ref();
	worker.postMessage({id, method, arguments_}, transferList);
});

async function hashFile(filePath, options = {}) {
	if (Worker === undefined) {
		return hash(fs.createReadStream(filePath), options);
	}

	const {
		encoding = 'hex',
		algorithm = 'sha512',
	} = options;

	const hash = await taskWorker('hashFile', [algorithm, filePath]);

	if (encoding === 'buffer') {
		return Buffer.from(hash);
	}

	return Buffer.from(hash).toString(encoding);
}

var exec = {};

var toolrunner = {};

var io = {};

var ioUtil = {};

var hasRequiredIoUtil;

function requireIoUtil () {
	if (hasRequiredIoUtil) return ioUtil;
	hasRequiredIoUtil = 1;
	(function (exports) {
		var __createBinding = (ioUtil && ioUtil.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __setModuleDefault = (ioUtil && ioUtil.__setModuleDefault) || (Object.create ? (function(o, v) {
		    Object.defineProperty(o, "default", { enumerable: true, value: v });
		}) : function(o, v) {
		    o["default"] = v;
		});
		var __importStar = (ioUtil && ioUtil.__importStar) || function (mod) {
		    if (mod && mod.__esModule) return mod;
		    var result = {};
		    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		    __setModuleDefault(result, mod);
		    return result;
		};
		var __awaiter = (ioUtil && ioUtil.__awaiter) || function (thisArg, _arguments, P, generator) {
		    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
		    return new (P || (P = Promise))(function (resolve, reject) {
		        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		        step((generator = generator.apply(thisArg, _arguments || [])).next());
		    });
		};
		var _a;
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.getCmdPath = exports.tryGetExecutablePath = exports.isRooted = exports.isDirectory = exports.exists = exports.READONLY = exports.UV_FS_O_EXLOCK = exports.IS_WINDOWS = exports.unlink = exports.symlink = exports.stat = exports.rmdir = exports.rm = exports.rename = exports.readlink = exports.readdir = exports.open = exports.mkdir = exports.lstat = exports.copyFile = exports.chmod = void 0;
		const fs = __importStar(require$$0);
		const path = __importStar(require$$1);
		_a = fs.promises
		// export const {open} = 'fs'
		, exports.chmod = _a.chmod, exports.copyFile = _a.copyFile, exports.lstat = _a.lstat, exports.mkdir = _a.mkdir, exports.open = _a.open, exports.readdir = _a.readdir, exports.readlink = _a.readlink, exports.rename = _a.rename, exports.rm = _a.rm, exports.rmdir = _a.rmdir, exports.stat = _a.stat, exports.symlink = _a.symlink, exports.unlink = _a.unlink;
		// export const {open} = 'fs'
		exports.IS_WINDOWS = process.platform === 'win32';
		// See https://github.com/nodejs/node/blob/d0153aee367422d0858105abec186da4dff0a0c5/deps/uv/include/uv/win.h#L691
		exports.UV_FS_O_EXLOCK = 0x10000000;
		exports.READONLY = fs.constants.O_RDONLY;
		function exists(fsPath) {
		    return __awaiter(this, void 0, void 0, function* () {
		        try {
		            yield exports.stat(fsPath);
		        }
		        catch (err) {
		            if (err.code === 'ENOENT') {
		                return false;
		            }
		            throw err;
		        }
		        return true;
		    });
		}
		exports.exists = exists;
		function isDirectory(fsPath, useStat = false) {
		    return __awaiter(this, void 0, void 0, function* () {
		        const stats = useStat ? yield exports.stat(fsPath) : yield exports.lstat(fsPath);
		        return stats.isDirectory();
		    });
		}
		exports.isDirectory = isDirectory;
		/**
		 * On OSX/Linux, true if path starts with '/'. On Windows, true for paths like:
		 * \, \hello, \\hello\share, C:, and C:\hello (and corresponding alternate separator cases).
		 */
		function isRooted(p) {
		    p = normalizeSeparators(p);
		    if (!p) {
		        throw new Error('isRooted() parameter "p" cannot be empty');
		    }
		    if (exports.IS_WINDOWS) {
		        return (p.startsWith('\\') || /^[A-Z]:/i.test(p) // e.g. \ or \hello or \\hello
		        ); // e.g. C: or C:\hello
		    }
		    return p.startsWith('/');
		}
		exports.isRooted = isRooted;
		/**
		 * Best effort attempt to determine whether a file exists and is executable.
		 * @param filePath    file path to check
		 * @param extensions  additional file extensions to try
		 * @return if file exists and is executable, returns the file path. otherwise empty string.
		 */
		function tryGetExecutablePath(filePath, extensions) {
		    return __awaiter(this, void 0, void 0, function* () {
		        let stats = undefined;
		        try {
		            // test file exists
		            stats = yield exports.stat(filePath);
		        }
		        catch (err) {
		            if (err.code !== 'ENOENT') {
		                // eslint-disable-next-line no-console
		                console.log(`Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`);
		            }
		        }
		        if (stats && stats.isFile()) {
		            if (exports.IS_WINDOWS) {
		                // on Windows, test for valid extension
		                const upperExt = path.extname(filePath).toUpperCase();
		                if (extensions.some(validExt => validExt.toUpperCase() === upperExt)) {
		                    return filePath;
		                }
		            }
		            else {
		                if (isUnixExecutable(stats)) {
		                    return filePath;
		                }
		            }
		        }
		        // try each extension
		        const originalFilePath = filePath;
		        for (const extension of extensions) {
		            filePath = originalFilePath + extension;
		            stats = undefined;
		            try {
		                stats = yield exports.stat(filePath);
		            }
		            catch (err) {
		                if (err.code !== 'ENOENT') {
		                    // eslint-disable-next-line no-console
		                    console.log(`Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`);
		                }
		            }
		            if (stats && stats.isFile()) {
		                if (exports.IS_WINDOWS) {
		                    // preserve the case of the actual file (since an extension was appended)
		                    try {
		                        const directory = path.dirname(filePath);
		                        const upperName = path.basename(filePath).toUpperCase();
		                        for (const actualName of yield exports.readdir(directory)) {
		                            if (upperName === actualName.toUpperCase()) {
		                                filePath = path.join(directory, actualName);
		                                break;
		                            }
		                        }
		                    }
		                    catch (err) {
		                        // eslint-disable-next-line no-console
		                        console.log(`Unexpected error attempting to determine the actual case of the file '${filePath}': ${err}`);
		                    }
		                    return filePath;
		                }
		                else {
		                    if (isUnixExecutable(stats)) {
		                        return filePath;
		                    }
		                }
		            }
		        }
		        return '';
		    });
		}
		exports.tryGetExecutablePath = tryGetExecutablePath;
		function normalizeSeparators(p) {
		    p = p || '';
		    if (exports.IS_WINDOWS) {
		        // convert slashes on Windows
		        p = p.replace(/\//g, '\\');
		        // remove redundant slashes
		        return p.replace(/\\\\+/g, '\\');
		    }
		    // remove redundant slashes
		    return p.replace(/\/\/+/g, '/');
		}
		// on Mac/Linux, test the execute bit
		//     R   W  X  R  W X R W X
		//   256 128 64 32 16 8 4 2 1
		function isUnixExecutable(stats) {
		    return ((stats.mode & 1) > 0 ||
		        ((stats.mode & 8) > 0 && stats.gid === process.getgid()) ||
		        ((stats.mode & 64) > 0 && stats.uid === process.getuid()));
		}
		// Get the path of cmd.exe in windows
		function getCmdPath() {
		    var _a;
		    return (_a = process.env['COMSPEC']) !== null && _a !== void 0 ? _a : `cmd.exe`;
		}
		exports.getCmdPath = getCmdPath;
		
	} (ioUtil));
	return ioUtil;
}

var hasRequiredIo;

function requireIo () {
	if (hasRequiredIo) return io;
	hasRequiredIo = 1;
	var __createBinding = (io && io.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (io && io.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (io && io.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
	    __setModuleDefault(result, mod);
	    return result;
	};
	var __awaiter = (io && io.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	Object.defineProperty(io, "__esModule", { value: true });
	io.findInPath = io.which = io.mkdirP = io.rmRF = io.mv = io.cp = void 0;
	const assert_1 = require$$0$1;
	const path = __importStar(require$$1);
	const ioUtil = __importStar(requireIoUtil());
	/**
	 * Copies a file or folder.
	 * Based off of shelljs - https://github.com/shelljs/shelljs/blob/9237f66c52e5daa40458f94f9565e18e8132f5a6/src/cp.js
	 *
	 * @param     source    source path
	 * @param     dest      destination path
	 * @param     options   optional. See CopyOptions.
	 */
	function cp(source, dest, options = {}) {
	    return __awaiter(this, void 0, void 0, function* () {
	        const { force, recursive, copySourceDirectory } = readCopyOptions(options);
	        const destStat = (yield ioUtil.exists(dest)) ? yield ioUtil.stat(dest) : null;
	        // Dest is an existing file, but not forcing
	        if (destStat && destStat.isFile() && !force) {
	            return;
	        }
	        // If dest is an existing directory, should copy inside.
	        const newDest = destStat && destStat.isDirectory() && copySourceDirectory
	            ? path.join(dest, path.basename(source))
	            : dest;
	        if (!(yield ioUtil.exists(source))) {
	            throw new Error(`no such file or directory: ${source}`);
	        }
	        const sourceStat = yield ioUtil.stat(source);
	        if (sourceStat.isDirectory()) {
	            if (!recursive) {
	                throw new Error(`Failed to copy. ${source} is a directory, but tried to copy without recursive flag.`);
	            }
	            else {
	                yield cpDirRecursive(source, newDest, 0, force);
	            }
	        }
	        else {
	            if (path.relative(source, newDest) === '') {
	                // a file cannot be copied to itself
	                throw new Error(`'${newDest}' and '${source}' are the same file`);
	            }
	            yield copyFile(source, newDest, force);
	        }
	    });
	}
	io.cp = cp;
	/**
	 * Moves a path.
	 *
	 * @param     source    source path
	 * @param     dest      destination path
	 * @param     options   optional. See MoveOptions.
	 */
	function mv(source, dest, options = {}) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if (yield ioUtil.exists(dest)) {
	            let destExists = true;
	            if (yield ioUtil.isDirectory(dest)) {
	                // If dest is directory copy src into dest
	                dest = path.join(dest, path.basename(source));
	                destExists = yield ioUtil.exists(dest);
	            }
	            if (destExists) {
	                if (options.force == null || options.force) {
	                    yield rmRF(dest);
	                }
	                else {
	                    throw new Error('Destination already exists');
	                }
	            }
	        }
	        yield mkdirP(path.dirname(dest));
	        yield ioUtil.rename(source, dest);
	    });
	}
	io.mv = mv;
	/**
	 * Remove a path recursively with force
	 *
	 * @param inputPath path to remove
	 */
	function rmRF(inputPath) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if (ioUtil.IS_WINDOWS) {
	            // Check for invalid characters
	            // https://docs.microsoft.com/en-us/windows/win32/fileio/naming-a-file
	            if (/[*"<>|]/.test(inputPath)) {
	                throw new Error('File path must not contain `*`, `"`, `<`, `>` or `|` on Windows');
	            }
	        }
	        try {
	            // note if path does not exist, error is silent
	            yield ioUtil.rm(inputPath, {
	                force: true,
	                maxRetries: 3,
	                recursive: true,
	                retryDelay: 300
	            });
	        }
	        catch (err) {
	            throw new Error(`File was unable to be removed ${err}`);
	        }
	    });
	}
	io.rmRF = rmRF;
	/**
	 * Make a directory.  Creates the full path with folders in between
	 * Will throw if it fails
	 *
	 * @param   fsPath        path to create
	 * @returns Promise<void>
	 */
	function mkdirP(fsPath) {
	    return __awaiter(this, void 0, void 0, function* () {
	        assert_1.ok(fsPath, 'a path argument must be provided');
	        yield ioUtil.mkdir(fsPath, { recursive: true });
	    });
	}
	io.mkdirP = mkdirP;
	/**
	 * Returns path of a tool had the tool actually been invoked.  Resolves via paths.
	 * If you check and the tool does not exist, it will throw.
	 *
	 * @param     tool              name of the tool
	 * @param     check             whether to check if tool exists
	 * @returns   Promise<string>   path to tool
	 */
	function which(tool, check) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if (!tool) {
	            throw new Error("parameter 'tool' is required");
	        }
	        // recursive when check=true
	        if (check) {
	            const result = yield which(tool, false);
	            if (!result) {
	                if (ioUtil.IS_WINDOWS) {
	                    throw new Error(`Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also verify the file has a valid extension for an executable file.`);
	                }
	                else {
	                    throw new Error(`Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.`);
	                }
	            }
	            return result;
	        }
	        const matches = yield findInPath(tool);
	        if (matches && matches.length > 0) {
	            return matches[0];
	        }
	        return '';
	    });
	}
	io.which = which;
	/**
	 * Returns a list of all occurrences of the given tool on the system path.
	 *
	 * @returns   Promise<string[]>  the paths of the tool
	 */
	function findInPath(tool) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if (!tool) {
	            throw new Error("parameter 'tool' is required");
	        }
	        // build the list of extensions to try
	        const extensions = [];
	        if (ioUtil.IS_WINDOWS && process.env['PATHEXT']) {
	            for (const extension of process.env['PATHEXT'].split(path.delimiter)) {
	                if (extension) {
	                    extensions.push(extension);
	                }
	            }
	        }
	        // if it's rooted, return it if exists. otherwise return empty.
	        if (ioUtil.isRooted(tool)) {
	            const filePath = yield ioUtil.tryGetExecutablePath(tool, extensions);
	            if (filePath) {
	                return [filePath];
	            }
	            return [];
	        }
	        // if any path separators, return empty
	        if (tool.includes(path.sep)) {
	            return [];
	        }
	        // build the list of directories
	        //
	        // Note, technically "where" checks the current directory on Windows. From a toolkit perspective,
	        // it feels like we should not do this. Checking the current directory seems like more of a use
	        // case of a shell, and the which() function exposed by the toolkit should strive for consistency
	        // across platforms.
	        const directories = [];
	        if (process.env.PATH) {
	            for (const p of process.env.PATH.split(path.delimiter)) {
	                if (p) {
	                    directories.push(p);
	                }
	            }
	        }
	        // find all matches
	        const matches = [];
	        for (const directory of directories) {
	            const filePath = yield ioUtil.tryGetExecutablePath(path.join(directory, tool), extensions);
	            if (filePath) {
	                matches.push(filePath);
	            }
	        }
	        return matches;
	    });
	}
	io.findInPath = findInPath;
	function readCopyOptions(options) {
	    const force = options.force == null ? true : options.force;
	    const recursive = Boolean(options.recursive);
	    const copySourceDirectory = options.copySourceDirectory == null
	        ? true
	        : Boolean(options.copySourceDirectory);
	    return { force, recursive, copySourceDirectory };
	}
	function cpDirRecursive(sourceDir, destDir, currentDepth, force) {
	    return __awaiter(this, void 0, void 0, function* () {
	        // Ensure there is not a run away recursive copy
	        if (currentDepth >= 255)
	            return;
	        currentDepth++;
	        yield mkdirP(destDir);
	        const files = yield ioUtil.readdir(sourceDir);
	        for (const fileName of files) {
	            const srcFile = `${sourceDir}/${fileName}`;
	            const destFile = `${destDir}/${fileName}`;
	            const srcFileStat = yield ioUtil.lstat(srcFile);
	            if (srcFileStat.isDirectory()) {
	                // Recurse
	                yield cpDirRecursive(srcFile, destFile, currentDepth, force);
	            }
	            else {
	                yield copyFile(srcFile, destFile, force);
	            }
	        }
	        // Change the mode for the newly created directory
	        yield ioUtil.chmod(destDir, (yield ioUtil.stat(sourceDir)).mode);
	    });
	}
	// Buffered file copy
	function copyFile(srcFile, destFile, force) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if ((yield ioUtil.lstat(srcFile)).isSymbolicLink()) {
	            // unlink/re-link it
	            try {
	                yield ioUtil.lstat(destFile);
	                yield ioUtil.unlink(destFile);
	            }
	            catch (e) {
	                // Try to override file permission
	                if (e.code === 'EPERM') {
	                    yield ioUtil.chmod(destFile, '0666');
	                    yield ioUtil.unlink(destFile);
	                }
	                // other errors = it doesn't exist, no work to do
	            }
	            // Copy over symlink
	            const symlinkFull = yield ioUtil.readlink(srcFile);
	            yield ioUtil.symlink(symlinkFull, destFile, ioUtil.IS_WINDOWS ? 'junction' : null);
	        }
	        else if (!(yield ioUtil.exists(destFile)) || force) {
	            yield ioUtil.copyFile(srcFile, destFile);
	        }
	    });
	}
	
	return io;
}

var hasRequiredToolrunner;

function requireToolrunner () {
	if (hasRequiredToolrunner) return toolrunner;
	hasRequiredToolrunner = 1;
	var __createBinding = (toolrunner && toolrunner.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (toolrunner && toolrunner.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (toolrunner && toolrunner.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
	    __setModuleDefault(result, mod);
	    return result;
	};
	var __awaiter = (toolrunner && toolrunner.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	Object.defineProperty(toolrunner, "__esModule", { value: true });
	toolrunner.argStringToArray = toolrunner.ToolRunner = void 0;
	const os = __importStar(require$$0$2);
	const events = __importStar(require$$1$1);
	const child = __importStar(require$$2);
	const path = __importStar(require$$1);
	const io = __importStar(requireIo());
	const ioUtil = __importStar(requireIoUtil());
	const timers_1 = require$$6;
	/* eslint-disable @typescript-eslint/unbound-method */
	const IS_WINDOWS = process.platform === 'win32';
	/*
	 * Class for running command line tools. Handles quoting and arg parsing in a platform agnostic way.
	 */
	class ToolRunner extends events.EventEmitter {
	    constructor(toolPath, args, options) {
	        super();
	        if (!toolPath) {
	            throw new Error("Parameter 'toolPath' cannot be null or empty.");
	        }
	        this.toolPath = toolPath;
	        this.args = args || [];
	        this.options = options || {};
	    }
	    _debug(message) {
	        if (this.options.listeners && this.options.listeners.debug) {
	            this.options.listeners.debug(message);
	        }
	    }
	    _getCommandString(options, noPrefix) {
	        const toolPath = this._getSpawnFileName();
	        const args = this._getSpawnArgs(options);
	        let cmd = noPrefix ? '' : '[command]'; // omit prefix when piped to a second tool
	        if (IS_WINDOWS) {
	            // Windows + cmd file
	            if (this._isCmdFile()) {
	                cmd += toolPath;
	                for (const a of args) {
	                    cmd += ` ${a}`;
	                }
	            }
	            // Windows + verbatim
	            else if (options.windowsVerbatimArguments) {
	                cmd += `"${toolPath}"`;
	                for (const a of args) {
	                    cmd += ` ${a}`;
	                }
	            }
	            // Windows (regular)
	            else {
	                cmd += this._windowsQuoteCmdArg(toolPath);
	                for (const a of args) {
	                    cmd += ` ${this._windowsQuoteCmdArg(a)}`;
	                }
	            }
	        }
	        else {
	            // OSX/Linux - this can likely be improved with some form of quoting.
	            // creating processes on Unix is fundamentally different than Windows.
	            // on Unix, execvp() takes an arg array.
	            cmd += toolPath;
	            for (const a of args) {
	                cmd += ` ${a}`;
	            }
	        }
	        return cmd;
	    }
	    _processLineBuffer(data, strBuffer, onLine) {
	        try {
	            let s = strBuffer + data.toString();
	            let n = s.indexOf(os.EOL);
	            while (n > -1) {
	                const line = s.substring(0, n);
	                onLine(line);
	                // the rest of the string ...
	                s = s.substring(n + os.EOL.length);
	                n = s.indexOf(os.EOL);
	            }
	            return s;
	        }
	        catch (err) {
	            // streaming lines to console is best effort.  Don't fail a build.
	            this._debug(`error processing line. Failed with error ${err}`);
	            return '';
	        }
	    }
	    _getSpawnFileName() {
	        if (IS_WINDOWS) {
	            if (this._isCmdFile()) {
	                return process.env['COMSPEC'] || 'cmd.exe';
	            }
	        }
	        return this.toolPath;
	    }
	    _getSpawnArgs(options) {
	        if (IS_WINDOWS) {
	            if (this._isCmdFile()) {
	                let argline = `/D /S /C "${this._windowsQuoteCmdArg(this.toolPath)}`;
	                for (const a of this.args) {
	                    argline += ' ';
	                    argline += options.windowsVerbatimArguments
	                        ? a
	                        : this._windowsQuoteCmdArg(a);
	                }
	                argline += '"';
	                return [argline];
	            }
	        }
	        return this.args;
	    }
	    _endsWith(str, end) {
	        return str.endsWith(end);
	    }
	    _isCmdFile() {
	        const upperToolPath = this.toolPath.toUpperCase();
	        return (this._endsWith(upperToolPath, '.CMD') ||
	            this._endsWith(upperToolPath, '.BAT'));
	    }
	    _windowsQuoteCmdArg(arg) {
	        // for .exe, apply the normal quoting rules that libuv applies
	        if (!this._isCmdFile()) {
	            return this._uvQuoteCmdArg(arg);
	        }
	        // otherwise apply quoting rules specific to the cmd.exe command line parser.
	        // the libuv rules are generic and are not designed specifically for cmd.exe
	        // command line parser.
	        //
	        // for a detailed description of the cmd.exe command line parser, refer to
	        // http://stackoverflow.com/questions/4094699/how-does-the-windows-command-interpreter-cmd-exe-parse-scripts/7970912#7970912
	        // need quotes for empty arg
	        if (!arg) {
	            return '""';
	        }
	        // determine whether the arg needs to be quoted
	        const cmdSpecialChars = [
	            ' ',
	            '\t',
	            '&',
	            '(',
	            ')',
	            '[',
	            ']',
	            '{',
	            '}',
	            '^',
	            '=',
	            ';',
	            '!',
	            "'",
	            '+',
	            ',',
	            '`',
	            '~',
	            '|',
	            '<',
	            '>',
	            '"'
	        ];
	        let needsQuotes = false;
	        for (const char of arg) {
	            if (cmdSpecialChars.some(x => x === char)) {
	                needsQuotes = true;
	                break;
	            }
	        }
	        // short-circuit if quotes not needed
	        if (!needsQuotes) {
	            return arg;
	        }
	        // the following quoting rules are very similar to the rules that by libuv applies.
	        //
	        // 1) wrap the string in quotes
	        //
	        // 2) double-up quotes - i.e. " => ""
	        //
	        //    this is different from the libuv quoting rules. libuv replaces " with \", which unfortunately
	        //    doesn't work well with a cmd.exe command line.
	        //
	        //    note, replacing " with "" also works well if the arg is passed to a downstream .NET console app.
	        //    for example, the command line:
	        //          foo.exe "myarg:""my val"""
	        //    is parsed by a .NET console app into an arg array:
	        //          [ "myarg:\"my val\"" ]
	        //    which is the same end result when applying libuv quoting rules. although the actual
	        //    command line from libuv quoting rules would look like:
	        //          foo.exe "myarg:\"my val\""
	        //
	        // 3) double-up slashes that precede a quote,
	        //    e.g.  hello \world    => "hello \world"
	        //          hello\"world    => "hello\\""world"
	        //          hello\\"world   => "hello\\\\""world"
	        //          hello world\    => "hello world\\"
	        //
	        //    technically this is not required for a cmd.exe command line, or the batch argument parser.
	        //    the reasons for including this as a .cmd quoting rule are:
	        //
	        //    a) this is optimized for the scenario where the argument is passed from the .cmd file to an
	        //       external program. many programs (e.g. .NET console apps) rely on the slash-doubling rule.
	        //
	        //    b) it's what we've been doing previously (by deferring to node default behavior) and we
	        //       haven't heard any complaints about that aspect.
	        //
	        // note, a weakness of the quoting rules chosen here, is that % is not escaped. in fact, % cannot be
	        // escaped when used on the command line directly - even though within a .cmd file % can be escaped
	        // by using %%.
	        //
	        // the saving grace is, on the command line, %var% is left as-is if var is not defined. this contrasts
	        // the line parsing rules within a .cmd file, where if var is not defined it is replaced with nothing.
	        //
	        // one option that was explored was replacing % with ^% - i.e. %var% => ^%var^%. this hack would
	        // often work, since it is unlikely that var^ would exist, and the ^ character is removed when the
	        // variable is used. the problem, however, is that ^ is not removed when %* is used to pass the args
	        // to an external program.
	        //
	        // an unexplored potential solution for the % escaping problem, is to create a wrapper .cmd file.
	        // % can be escaped within a .cmd file.
	        let reverse = '"';
	        let quoteHit = true;
	        for (let i = arg.length; i > 0; i--) {
	            // walk the string in reverse
	            reverse += arg[i - 1];
	            if (quoteHit && arg[i - 1] === '\\') {
	                reverse += '\\'; // double the slash
	            }
	            else if (arg[i - 1] === '"') {
	                quoteHit = true;
	                reverse += '"'; // double the quote
	            }
	            else {
	                quoteHit = false;
	            }
	        }
	        reverse += '"';
	        return reverse
	            .split('')
	            .reverse()
	            .join('');
	    }
	    _uvQuoteCmdArg(arg) {
	        // Tool runner wraps child_process.spawn() and needs to apply the same quoting as
	        // Node in certain cases where the undocumented spawn option windowsVerbatimArguments
	        // is used.
	        //
	        // Since this function is a port of quote_cmd_arg from Node 4.x (technically, lib UV,
	        // see https://github.com/nodejs/node/blob/v4.x/deps/uv/src/win/process.c for details),
	        // pasting copyright notice from Node within this function:
	        //
	        //      Copyright Joyent, Inc. and other Node contributors. All rights reserved.
	        //
	        //      Permission is hereby granted, free of charge, to any person obtaining a copy
	        //      of this software and associated documentation files (the "Software"), to
	        //      deal in the Software without restriction, including without limitation the
	        //      rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
	        //      sell copies of the Software, and to permit persons to whom the Software is
	        //      furnished to do so, subject to the following conditions:
	        //
	        //      The above copyright notice and this permission notice shall be included in
	        //      all copies or substantial portions of the Software.
	        //
	        //      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	        //      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	        //      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	        //      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	        //      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	        //      FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
	        //      IN THE SOFTWARE.
	        if (!arg) {
	            // Need double quotation for empty argument
	            return '""';
	        }
	        if (!arg.includes(' ') && !arg.includes('\t') && !arg.includes('"')) {
	            // No quotation needed
	            return arg;
	        }
	        if (!arg.includes('"') && !arg.includes('\\')) {
	            // No embedded double quotes or backslashes, so I can just wrap
	            // quote marks around the whole thing.
	            return `"${arg}"`;
	        }
	        // Expected input/output:
	        //   input : hello"world
	        //   output: "hello\"world"
	        //   input : hello""world
	        //   output: "hello\"\"world"
	        //   input : hello\world
	        //   output: hello\world
	        //   input : hello\\world
	        //   output: hello\\world
	        //   input : hello\"world
	        //   output: "hello\\\"world"
	        //   input : hello\\"world
	        //   output: "hello\\\\\"world"
	        //   input : hello world\
	        //   output: "hello world\\" - note the comment in libuv actually reads "hello world\"
	        //                             but it appears the comment is wrong, it should be "hello world\\"
	        let reverse = '"';
	        let quoteHit = true;
	        for (let i = arg.length; i > 0; i--) {
	            // walk the string in reverse
	            reverse += arg[i - 1];
	            if (quoteHit && arg[i - 1] === '\\') {
	                reverse += '\\';
	            }
	            else if (arg[i - 1] === '"') {
	                quoteHit = true;
	                reverse += '\\';
	            }
	            else {
	                quoteHit = false;
	            }
	        }
	        reverse += '"';
	        return reverse
	            .split('')
	            .reverse()
	            .join('');
	    }
	    _cloneExecOptions(options) {
	        options = options || {};
	        const result = {
	            cwd: options.cwd || process.cwd(),
	            env: options.env || process.env,
	            silent: options.silent || false,
	            windowsVerbatimArguments: options.windowsVerbatimArguments || false,
	            failOnStdErr: options.failOnStdErr || false,
	            ignoreReturnCode: options.ignoreReturnCode || false,
	            delay: options.delay || 10000
	        };
	        result.outStream = options.outStream || process.stdout;
	        result.errStream = options.errStream || process.stderr;
	        return result;
	    }
	    _getSpawnOptions(options, toolPath) {
	        options = options || {};
	        const result = {};
	        result.cwd = options.cwd;
	        result.env = options.env;
	        result['windowsVerbatimArguments'] =
	            options.windowsVerbatimArguments || this._isCmdFile();
	        if (options.windowsVerbatimArguments) {
	            result.argv0 = `"${toolPath}"`;
	        }
	        return result;
	    }
	    /**
	     * Exec a tool.
	     * Output will be streamed to the live console.
	     * Returns promise with return code
	     *
	     * @param     tool     path to tool to exec
	     * @param     options  optional exec options.  See ExecOptions
	     * @returns   number
	     */
	    exec() {
	        return __awaiter(this, void 0, void 0, function* () {
	            // root the tool path if it is unrooted and contains relative pathing
	            if (!ioUtil.isRooted(this.toolPath) &&
	                (this.toolPath.includes('/') ||
	                    (IS_WINDOWS && this.toolPath.includes('\\')))) {
	                // prefer options.cwd if it is specified, however options.cwd may also need to be rooted
	                this.toolPath = path.resolve(process.cwd(), this.options.cwd || process.cwd(), this.toolPath);
	            }
	            // if the tool is only a file name, then resolve it from the PATH
	            // otherwise verify it exists (add extension on Windows if necessary)
	            this.toolPath = yield io.which(this.toolPath, true);
	            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
	                this._debug(`exec tool: ${this.toolPath}`);
	                this._debug('arguments:');
	                for (const arg of this.args) {
	                    this._debug(`   ${arg}`);
	                }
	                const optionsNonNull = this._cloneExecOptions(this.options);
	                if (!optionsNonNull.silent && optionsNonNull.outStream) {
	                    optionsNonNull.outStream.write(this._getCommandString(optionsNonNull) + os.EOL);
	                }
	                const state = new ExecState(optionsNonNull, this.toolPath);
	                state.on('debug', (message) => {
	                    this._debug(message);
	                });
	                if (this.options.cwd && !(yield ioUtil.exists(this.options.cwd))) {
	                    return reject(new Error(`The cwd: ${this.options.cwd} does not exist!`));
	                }
	                const fileName = this._getSpawnFileName();
	                const cp = child.spawn(fileName, this._getSpawnArgs(optionsNonNull), this._getSpawnOptions(this.options, fileName));
	                let stdbuffer = '';
	                if (cp.stdout) {
	                    cp.stdout.on('data', (data) => {
	                        if (this.options.listeners && this.options.listeners.stdout) {
	                            this.options.listeners.stdout(data);
	                        }
	                        if (!optionsNonNull.silent && optionsNonNull.outStream) {
	                            optionsNonNull.outStream.write(data);
	                        }
	                        stdbuffer = this._processLineBuffer(data, stdbuffer, (line) => {
	                            if (this.options.listeners && this.options.listeners.stdline) {
	                                this.options.listeners.stdline(line);
	                            }
	                        });
	                    });
	                }
	                let errbuffer = '';
	                if (cp.stderr) {
	                    cp.stderr.on('data', (data) => {
	                        state.processStderr = true;
	                        if (this.options.listeners && this.options.listeners.stderr) {
	                            this.options.listeners.stderr(data);
	                        }
	                        if (!optionsNonNull.silent &&
	                            optionsNonNull.errStream &&
	                            optionsNonNull.outStream) {
	                            const s = optionsNonNull.failOnStdErr
	                                ? optionsNonNull.errStream
	                                : optionsNonNull.outStream;
	                            s.write(data);
	                        }
	                        errbuffer = this._processLineBuffer(data, errbuffer, (line) => {
	                            if (this.options.listeners && this.options.listeners.errline) {
	                                this.options.listeners.errline(line);
	                            }
	                        });
	                    });
	                }
	                cp.on('error', (err) => {
	                    state.processError = err.message;
	                    state.processExited = true;
	                    state.processClosed = true;
	                    state.CheckComplete();
	                });
	                cp.on('exit', (code) => {
	                    state.processExitCode = code;
	                    state.processExited = true;
	                    this._debug(`Exit code ${code} received from tool '${this.toolPath}'`);
	                    state.CheckComplete();
	                });
	                cp.on('close', (code) => {
	                    state.processExitCode = code;
	                    state.processExited = true;
	                    state.processClosed = true;
	                    this._debug(`STDIO streams have closed for tool '${this.toolPath}'`);
	                    state.CheckComplete();
	                });
	                state.on('done', (error, exitCode) => {
	                    if (stdbuffer.length > 0) {
	                        this.emit('stdline', stdbuffer);
	                    }
	                    if (errbuffer.length > 0) {
	                        this.emit('errline', errbuffer);
	                    }
	                    cp.removeAllListeners();
	                    if (error) {
	                        reject(error);
	                    }
	                    else {
	                        resolve(exitCode);
	                    }
	                });
	                if (this.options.input) {
	                    if (!cp.stdin) {
	                        throw new Error('child process missing stdin');
	                    }
	                    cp.stdin.end(this.options.input);
	                }
	            }));
	        });
	    }
	}
	toolrunner.ToolRunner = ToolRunner;
	/**
	 * Convert an arg string to an array of args. Handles escaping
	 *
	 * @param    argString   string of arguments
	 * @returns  string[]    array of arguments
	 */
	function argStringToArray(argString) {
	    const args = [];
	    let inQuotes = false;
	    let escaped = false;
	    let arg = '';
	    function append(c) {
	        // we only escape double quotes.
	        if (escaped && c !== '"') {
	            arg += '\\';
	        }
	        arg += c;
	        escaped = false;
	    }
	    for (let i = 0; i < argString.length; i++) {
	        const c = argString.charAt(i);
	        if (c === '"') {
	            if (!escaped) {
	                inQuotes = !inQuotes;
	            }
	            else {
	                append(c);
	            }
	            continue;
	        }
	        if (c === '\\' && escaped) {
	            append(c);
	            continue;
	        }
	        if (c === '\\' && inQuotes) {
	            escaped = true;
	            continue;
	        }
	        if (c === ' ' && !inQuotes) {
	            if (arg.length > 0) {
	                args.push(arg);
	                arg = '';
	            }
	            continue;
	        }
	        append(c);
	    }
	    if (arg.length > 0) {
	        args.push(arg.trim());
	    }
	    return args;
	}
	toolrunner.argStringToArray = argStringToArray;
	class ExecState extends events.EventEmitter {
	    constructor(options, toolPath) {
	        super();
	        this.processClosed = false; // tracks whether the process has exited and stdio is closed
	        this.processError = '';
	        this.processExitCode = 0;
	        this.processExited = false; // tracks whether the process has exited
	        this.processStderr = false; // tracks whether stderr was written to
	        this.delay = 10000; // 10 seconds
	        this.done = false;
	        this.timeout = null;
	        if (!toolPath) {
	            throw new Error('toolPath must not be empty');
	        }
	        this.options = options;
	        this.toolPath = toolPath;
	        if (options.delay) {
	            this.delay = options.delay;
	        }
	    }
	    CheckComplete() {
	        if (this.done) {
	            return;
	        }
	        if (this.processClosed) {
	            this._setResult();
	        }
	        else if (this.processExited) {
	            this.timeout = timers_1.setTimeout(ExecState.HandleTimeout, this.delay, this);
	        }
	    }
	    _debug(message) {
	        this.emit('debug', message);
	    }
	    _setResult() {
	        // determine whether there is an error
	        let error;
	        if (this.processExited) {
	            if (this.processError) {
	                error = new Error(`There was an error when attempting to execute the process '${this.toolPath}'. This may indicate the process failed to start. Error: ${this.processError}`);
	            }
	            else if (this.processExitCode !== 0 && !this.options.ignoreReturnCode) {
	                error = new Error(`The process '${this.toolPath}' failed with exit code ${this.processExitCode}`);
	            }
	            else if (this.processStderr && this.options.failOnStdErr) {
	                error = new Error(`The process '${this.toolPath}' failed because one or more lines were written to the STDERR stream`);
	            }
	        }
	        // clear the timeout
	        if (this.timeout) {
	            clearTimeout(this.timeout);
	            this.timeout = null;
	        }
	        this.done = true;
	        this.emit('done', error, this.processExitCode);
	    }
	    static HandleTimeout(state) {
	        if (state.done) {
	            return;
	        }
	        if (!state.processClosed && state.processExited) {
	            const message = `The STDIO streams did not close within ${state.delay /
	                1000} seconds of the exit event from process '${state.toolPath}'. This may indicate a child process inherited the STDIO streams and has not yet exited.`;
	            state._debug(message);
	        }
	        state._setResult();
	    }
	}
	
	return toolrunner;
}

var hasRequiredExec;

function requireExec () {
	if (hasRequiredExec) return exec;
	hasRequiredExec = 1;
	var __createBinding = (exec && exec.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (exec && exec.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (exec && exec.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
	    __setModuleDefault(result, mod);
	    return result;
	};
	var __awaiter = (exec && exec.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	Object.defineProperty(exec, "__esModule", { value: true });
	exec.getExecOutput = exec.exec = void 0;
	const string_decoder_1 = require$$0$3;
	const tr = __importStar(requireToolrunner());
	/**
	 * Exec a command.
	 * Output will be streamed to the live console.
	 * Returns promise with return code
	 *
	 * @param     commandLine        command to execute (can include additional args). Must be correctly escaped.
	 * @param     args               optional arguments for tool. Escaping is handled by the lib.
	 * @param     options            optional exec options.  See ExecOptions
	 * @returns   Promise<number>    exit code
	 */
	function exec$1(commandLine, args, options) {
	    return __awaiter(this, void 0, void 0, function* () {
	        const commandArgs = tr.argStringToArray(commandLine);
	        if (commandArgs.length === 0) {
	            throw new Error(`Parameter 'commandLine' cannot be null or empty.`);
	        }
	        // Path to tool to execute should be first arg
	        const toolPath = commandArgs[0];
	        args = commandArgs.slice(1).concat(args || []);
	        const runner = new tr.ToolRunner(toolPath, args, options);
	        return runner.exec();
	    });
	}
	exec.exec = exec$1;
	/**
	 * Exec a command and get the output.
	 * Output will be streamed to the live console.
	 * Returns promise with the exit code and collected stdout and stderr
	 *
	 * @param     commandLine           command to execute (can include additional args). Must be correctly escaped.
	 * @param     args                  optional arguments for tool. Escaping is handled by the lib.
	 * @param     options               optional exec options.  See ExecOptions
	 * @returns   Promise<ExecOutput>   exit code, stdout, and stderr
	 */
	function getExecOutput(commandLine, args, options) {
	    var _a, _b;
	    return __awaiter(this, void 0, void 0, function* () {
	        let stdout = '';
	        let stderr = '';
	        //Using string decoder covers the case where a mult-byte character is split
	        const stdoutDecoder = new string_decoder_1.StringDecoder('utf8');
	        const stderrDecoder = new string_decoder_1.StringDecoder('utf8');
	        const originalStdoutListener = (_a = options === null || options === void 0 ? void 0 : options.listeners) === null || _a === void 0 ? void 0 : _a.stdout;
	        const originalStdErrListener = (_b = options === null || options === void 0 ? void 0 : options.listeners) === null || _b === void 0 ? void 0 : _b.stderr;
	        const stdErrListener = (data) => {
	            stderr += stderrDecoder.write(data);
	            if (originalStdErrListener) {
	                originalStdErrListener(data);
	            }
	        };
	        const stdOutListener = (data) => {
	            stdout += stdoutDecoder.write(data);
	            if (originalStdoutListener) {
	                originalStdoutListener(data);
	            }
	        };
	        const listeners = Object.assign(Object.assign({}, options === null || options === void 0 ? void 0 : options.listeners), { stdout: stdOutListener, stderr: stdErrListener });
	        const exitCode = yield exec$1(commandLine, args, Object.assign(Object.assign({}, options), { listeners }));
	        //flush any remaining characters
	        stdout += stdoutDecoder.end();
	        stderr += stderrDecoder.end();
	        return {
	            exitCode,
	            stdout,
	            stderr
	        };
	    });
	}
	exec.getExecOutput = getExecOutput;
	
	return exec;
}

var execExports = requireExec();

/**
 * Retrieves the value of a Yarn configuration.
 *
 * @param name - The name of the Yarn configuration.
 * @returns A promise resolving to the value of the Yarn configuration.
 */
async function getYarnConfig(name) {
    const res = await execExports.getExecOutput("yarn", ["config", name, "--json"], {
        silent: true,
    });
    return JSON.parse(res.stdout).effective;
}

function printYarnInstallOutput(output) {
    switch (output.type) {
        case "info":
            logInfo(`${output.displayName}: ${output.indent}${output.data}`);
            break;
        case "warning":
            logWarning(`${output.data} (${output.displayName})`);
            break;
        case "error":
            logError(`${output.data} (${output.displayName})`);
            break;
    }
}
async function yarnInstall() {
    await execExports.exec("yarn", ["install", "--json"], {
        silent: true,
        listeners: {
            stdline: (data) => {
                const output = JSON.parse(data);
                printYarnInstallOutput(output);
            },
        },
    });
}

/**
 * Get the current Yarn version.
 *
 * @param options.corepack - Whether to get the current Yarn version using Corepack or not.
 * @returns A promise resolving to the current Yarn version.
 */
async function getYarnVersion(options) {
    const commandLine = options?.corepack ? "corepack" : "yarn";
    const args = options?.corepack ? ["yarn", "--version"] : ["--version"];
    const res = await execExports.getExecOutput(commandLine, args, {
        silent: true,
    });
    return res.stdout.trim();
}
/**
 * Set the Yarn version.
 *
 * @param version - The new Yarn version to set.
 * @returns A promise that resolves to nothing.
 */
async function setYarnVersion(version) {
    await execExports.exec("yarn", ["set", "version", version], { silent: true });
}

async function getCacheKey() {
    const key = `setup-yarn-action-${os.type()}`;
    let version = "";
    logInfo("Getting Yarn version...");
    try {
        version = await getYarnVersion({ corepack: true });
    }
    catch (err) {
        logError(`Failed to get Yarn version: ${r(err)}`);
        throw new Error("Failed to get Yarn version");
    }
    logInfo("Calculating lock file hash...");
    try {
        if (fs.existsSync("yarn.lock")) {
            const hash = await hashFile("yarn.lock", { algorithm: "md5" });
            version += `-${hash}`;
        }
        else {
            logWarning(`Lock file could not be found, using empty hash`);
        }
    }
    catch (err) {
        logError(`Failed to calculate lock file hash: ${r(err)}`);
        throw new Error("Failed to calculate lock file hash");
    }
    logInfo(`Using cache key: ${key}-${version}`);
    return { key, version };
}
async function getCachePaths() {
    const cachePaths = [".pnp.cjs", ".pnp.loader.mjs"];
    const yarnConfigs = [
        { name: "Yarn cache folder", config: "cacheFolder" },
        { name: "Yarn deferred version folder", config: "deferredVersionFolder" },
        { name: "Yarn install state path", config: "installStatePath" },
        { name: "Yarn patch folder", config: "patchFolder" },
        { name: "Yarn PnP unplugged folder", config: "pnpUnpluggedFolder" },
        { name: "Yarn virtual folder", config: "virtualFolder" },
    ];
    for (const { name, config } of yarnConfigs) {
        logInfo(`Getting ${name}...`);
        try {
            const cachePath = await getYarnConfig(config);
            if (fs.existsSync(cachePath)) {
                cachePaths.push(cachePath);
            }
        }
        catch (err) {
            logError(`Failed to get ${name}: ${r(err)}`);
            throw new Error(`Failed to get ${name}`);
        }
    }
    logInfo(`Using cache paths: ${JSON.stringify(cachePaths, null, 4)}`);
    return cachePaths;
}

/**
 * Assert Yarn version enabled by Corepack.
 *
 * This function asserts whether Yarn is updated to the correct version set by Corepack.
 * It asserts the Yarn version by checking if the `yarn` command is using the same version as the `corepack yarn` command.
 *
 * @returns A promise that resolves to nothing.
 * @throws If the `yarn` command is using a different version of Yarn.
 */
async function corepackAssertYarnVersion() {
    const version = await getYarnVersion();
    const corepackVersion = await getYarnVersion({ corepack: true });
    if (version !== corepackVersion) {
        throw new Error(`The \`yarn\` command is using a different version of Yarn, expected \`${corepackVersion}\` but got \`${version}\``);
    }
}
/**
 * Enable Yarn using Corepack.
 *
 * This function enables Yarn using Corepack in the `.corepack` directory.
 * After enabling Yarn, it also adds the `.corepack` directory to the path.
 *
 * @returns A promise that resolves to nothing.
 */
async function corepackEnableYarn() {
    const corepackDir = path.join(homedir(), ".corepack");
    mkdirSync(corepackDir, { recursive: true });
    await execExports.exec("corepack", ["enable", "--install-directory", corepackDir, "yarn"], { silent: true });
    await addPath(corepackDir);
}

function getInputs() {
    return {
        version: getInput("version"),
        cache: getInput("cache") === "true",
    };
}

async function main() {
    logInfo("Getting action inputs...");
    let inputs;
    try {
        inputs = getInputs();
    }
    catch (err) {
        logError(`Failed to get action inputs: ${r(err)}`);
        process.exitCode = 1;
        return;
    }
    logInfo("Enabling Yarn...");
    try {
        await corepackEnableYarn();
        await corepackAssertYarnVersion();
    }
    catch (err) {
        logError(`Failed to enable Yarn: ${r(err)}`);
        process.exitCode = 1;
        return;
    }
    if (inputs.version != "") {
        logInfo("Setting Yarn version...");
        try {
            await setYarnVersion(inputs.version);
            await corepackAssertYarnVersion();
        }
        catch (err) {
            logError(`Failed to set Yarn version: ${r(err)}`);
            process.exitCode = 1;
            return;
        }
    }
    let cacheKey = { key: "", version: "" };
    if (inputs.cache) {
        beginLogGroup("Getting cache key");
        try {
            cacheKey = await getCacheKey();
        }
        catch (err) {
            endLogGroup();
            logError(`Failed to get cache key: ${r(err)}`);
            process.exitCode = 1;
            return;
        }
        endLogGroup();
        logInfo("Restoring cache...");
        try {
            const cacheRestored = await restoreCache(cacheKey.key, cacheKey.version);
            if (cacheRestored) {
                logInfo("Cache restored successfully");
                return;
            }
            else {
                logWarning("Cache not found");
            }
        }
        catch (err) {
            logError(`Failed to restore cache: ${r(err)}`);
            process.exitCode = 1;
            return;
        }
    }
    beginLogGroup("Installing dependencies");
    try {
        await yarnInstall();
    }
    catch (err) {
        endLogGroup();
        logError(`Failed to install dependencies: ${r(err)}`);
        process.exitCode = 1;
        return;
    }
    endLogGroup();
    if (inputs.cache) {
        beginLogGroup("Getting cache paths");
        let cachePaths = [];
        try {
            cachePaths = await getCachePaths();
        }
        catch (err) {
            endLogGroup();
            logError(`Failed to get cache paths: ${r(err)}`);
            process.exitCode = 1;
            return;
        }
        endLogGroup();
        logInfo("Saving cache...");
        try {
            await saveCache(cacheKey.key, cacheKey.version, cachePaths);
        }
        catch (err) {
            logError(`Failed to save cache: ${r(err)}`);
            process.exitCode = 1;
            return;
        }
    }
}

main().catch((err) => {
    logError(err);
    process.exit(1);
});
