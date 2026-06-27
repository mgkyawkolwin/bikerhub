"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_BASE_URL = void 0;
exports.fetchJson = fetchJson;
exports.authenticatedFetchJson = authenticatedFetchJson;
exports.fetchApi = fetchApi;
exports.authenticatedFetchApi = authenticatedFetchApi;
var SecureStore = require("expo-secure-store");
var expo_router_1 = require("expo-router");
var DEFAULT_API_BASE_URL = 'http://192.168.50.131:5264/api';
// const DEFAULT_API_BASE_URL = 'https://bikerhubapi.preview.software/api';
exports.API_BASE_URL = DEFAULT_API_BASE_URL;
var AUTH_USER_STORAGE_KEY = 'auth_user';
function fetchJson(path_1) {
    return __awaiter(this, arguments, void 0, function (path, options) {
        var headers, response;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('API Request:', { API_BASE_URL: exports.API_BASE_URL, path: path, options: options });
                    headers = __assign({}, options.headers);
                    if (!(options.body instanceof FormData)) {
                        headers['Content-Type'] = 'application/json';
                    }
                    return [4 /*yield*/, fetch("".concat(exports.API_BASE_URL).concat(path), __assign({ headers: headers }, options))];
                case 1:
                    response = _a.sent();
                    console.log('API Response:', { path: path, status: response.status });
                    return [2 /*return*/, response];
            }
        });
    });
}
function authenticatedFetchJson(path_1) {
    return __awaiter(this, arguments, void 0, function (path, options) {
        var authUserJson, token, headers, response;
        var _a;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, SecureStore.getItemAsync(AUTH_USER_STORAGE_KEY)];
                case 1:
                    authUserJson = _b.sent();
                    token = authUserJson ? (_a = JSON.parse(authUserJson)) === null || _a === void 0 ? void 0 : _a.token : undefined;
                    headers = __assign({}, options.headers);
                    if (!(options.body instanceof FormData)) {
                        headers['Content-Type'] = 'application/json';
                    }
                    if (token) {
                        headers.Authorization = "Bearer ".concat(token);
                    }
                    return [4 /*yield*/, fetchJson(path, __assign(__assign({}, options), { headers: headers }))];
                case 2:
                    response = _b.sent();
                    if (!(response.status === 401)) return [3 /*break*/, 4];
                    // Clear stored auth user
                    return [4 /*yield*/, SecureStore.deleteItemAsync(AUTH_USER_STORAGE_KEY)];
                case 3:
                    // Clear stored auth user
                    _b.sent();
                    // Redirect to sign in page
                    expo_router_1.router.replace('/auth/signIn');
                    _b.label = 4;
                case 4: return [2 /*return*/, response];
            }
        });
    });
}
function fetchApi(path_1) {
    return __awaiter(this, arguments, void 0, function (path, options) {
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            return [2 /*return*/, fetchJson(path, options)];
        });
    });
}
function authenticatedFetchApi(path_1) {
    return __awaiter(this, arguments, void 0, function (path, options) {
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            console.log('Authenticated API Request:', { path: path, options: options });
            return [2 /*return*/, authenticatedFetchJson(path, options)];
        });
    });
}
