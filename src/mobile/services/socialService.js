"use strict";
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
exports.SocialServiceClient = exports.SocialServiceToken = void 0;
var apiClient_1 = require("./apiClient");
exports.SocialServiceToken = Symbol('SocialServiceToken');
var SocialServiceClient = /** @class */ (function () {
    function SocialServiceClient() {
    }
    SocialServiceClient.prototype.followUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, apiClient_1.authenticatedFetchApi)("/social/follow/".concat(encodeURIComponent(userId)), {
                            method: 'POST',
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    SocialServiceClient.prototype.unfollowUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, apiClient_1.authenticatedFetchApi)("/social/follow/".concat(encodeURIComponent(userId)), {
                            method: 'DELETE',
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    SocialServiceClient.prototype.isFollowing = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, apiClient_1.authenticatedFetchApi)("/social/follow/".concat(encodeURIComponent(userId), "/is-following"), {
                            method: 'GET',
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    SocialServiceClient.prototype.getFollowers = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, apiClient_1.authenticatedFetchApi)("/social/followers/".concat(encodeURIComponent(userId)))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    SocialServiceClient.prototype.getFollowing = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, apiClient_1.authenticatedFetchApi)("/social/following/".concat(encodeURIComponent(userId)))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    SocialServiceClient.prototype.sendFriendRequest = function (toProfileId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)('/social/friend-requests', {
                        method: 'POST',
                        body: JSON.stringify({ toProfileId: toProfileId }),
                    })];
            });
        });
    };
    SocialServiceClient.prototype.approveFriendRequest = function (requestId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/friend-requests/".concat(encodeURIComponent(requestId), "/approve"), {
                        method: 'PATCH',
                    })];
            });
        });
    };
    SocialServiceClient.prototype.cancelFriendRequest = function (toProfileId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/friend-requests/".concat(encodeURIComponent(toProfileId)), {
                        method: 'DELETE',
                    })];
            });
        });
    };
    SocialServiceClient.prototype.rejectFriendRequest = function (requestId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/friend-requests/".concat(encodeURIComponent(requestId), "/reject"), {
                        method: 'PATCH',
                    })];
            });
        });
    };
    SocialServiceClient.prototype.getPendingFriendRequests = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)('/social/friend-requests/pending')];
            });
        });
    };
    SocialServiceClient.prototype.getFriends = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)('/social/friends')];
            });
        });
    };
    SocialServiceClient.prototype.removeFriend = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/friends/".concat(encodeURIComponent(userId)), {
                        method: 'DELETE',
                    })];
            });
        });
    };
    SocialServiceClient.prototype.getComments = function (postId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/posts/".concat(encodeURIComponent(postId), "/comments"))];
            });
        });
    };
    SocialServiceClient.prototype.createComment = function (postId, content, parentCommentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/posts/".concat(encodeURIComponent(postId), "/comments"), {
                        method: 'POST',
                        body: JSON.stringify({ postId: postId, content: content, parentCommentId: parentCommentId }),
                    })];
            });
        });
    };
    SocialServiceClient.prototype.deleteComment = function (postId, commentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/posts/".concat(encodeURIComponent(postId), "/comments/").concat(encodeURIComponent(commentId)), {
                        method: 'DELETE',
                    })];
            });
        });
    };
    SocialServiceClient.prototype.getPosts = function (page, pageSize) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/posts?list=feed&page=".concat(page, "&pageSize=").concat(pageSize))];
            });
        });
    };
    SocialServiceClient.prototype.getPostsByUser = function (userId, page, pageSize) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/posts?list=profile&userId=".concat(encodeURIComponent(userId), "&page=").concat(page, "&pageSize=").concat(pageSize))];
            });
        });
    };
    SocialServiceClient.prototype.createPost = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)('/social/posts', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                    })];
            });
        });
    };
    SocialServiceClient.prototype.uploadPostMedia = function (postId, file) {
        return __awaiter(this, void 0, void 0, function () {
            var formData;
            return __generator(this, function (_a) {
                formData = new FormData();
                formData.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.type,
                });
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/posts/".concat(encodeURIComponent(postId), "/media"), {
                        method: 'POST',
                        body: formData,
                    })];
            });
        });
    };
    SocialServiceClient.prototype.uploadProfileCoverPhoto = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var formData;
            return __generator(this, function (_a) {
                formData = new FormData();
                formData.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.type,
                });
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)('/social/profiles/cover-photo', {
                        method: 'POST',
                        body: formData,
                    })];
            });
        });
    };
    SocialServiceClient.prototype.uploadProfilePhoto = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var formData;
            return __generator(this, function (_a) {
                formData = new FormData();
                formData.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.type,
                });
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)('/social/profiles/profile-photo', {
                        method: 'POST',
                        body: formData,
                    })];
            });
        });
    };
    SocialServiceClient.prototype.getPostById = function (postId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/posts/".concat(encodeURIComponent(postId)))];
            });
        });
    };
    SocialServiceClient.prototype.toggleLove = function (postId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.debug('Toggling love for post:', postId);
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/posts/".concat(encodeURIComponent(postId), "/love"), {
                        method: 'PATCH'
                    })];
            });
        });
    };
    SocialServiceClient.prototype.getProfileById = function (profileId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/profiles/".concat(encodeURIComponent(profileId)))];
            });
        });
    };
    SocialServiceClient.prototype.updateSocialLinks = function (socialLinks) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)('/social/profiles/social-links', {
                        method: 'PATCH',
                        body: JSON.stringify({ socialLinks: socialLinks }),
                    })];
            });
        });
    };
    SocialServiceClient.prototype.searchProfiles = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, apiClient_1.authenticatedFetchApi)("/social/profiles/search?query=".concat(encodeURIComponent(query)))];
            });
        });
    };
    return SocialServiceClient;
}());
exports.SocialServiceClient = SocialServiceClient;
