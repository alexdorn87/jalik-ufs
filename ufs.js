/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Karl STEIN
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import {_} from 'meteor/underscore';
import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {MIME} from './ufs-mime';
import {Tokens} from './ufs-tokens';


let stores = {};

export const UploadFS = {

    /**
     * Contains all stores
     */
    store: {},

    /**
     * Collection of tokens
     */
    tokens: Tokens,

    /**
     * Adds the MIME type for an extension
     * @param extension
     * @param mime
     */
    addMimeType(extension, mime) {
        MIME[extension.toLowerCase()] = mime;
    },

    /**
     * Adds the path attribute to files
     * @param where
     */
    addPathAttributeToFiles(where) {
        _.each(UploadFS.getStores(), (store) => {
            let files = store.getCollection();

            // By default update only files with no path set
            files.find(where || {path: null}, {fields: {_id: 1}}).forEach((file) => {
                let path = store.getFileRelativeURL(file._id);
                files.update({_id: file._id}, {$set: {path: path}});
            });
        });
    },

    /**
     * Returns the MIME type of the extension
     * @param extension
     * @returns {*}
     */
    getMimeType(extension) {
        extension = extension.toLowerCase();
        return MIME[extension];
    },

    /**
     * Returns all MIME types
     */
    getMimeTypes() {
        return MIME;
    },

    /**
     * Returns the store by its name
     * @param name
     * @return {UploadFS.Store}
     */
    getStore(name) {
        return stores[name];
    },

    /**
     * Returns all stores
     * @return {object}
     */
    getStores() {
        return stores;
    },

    /**
     * Returns the temporary file path
     * @param fileId
     * @return {string}
     */
    getTempFilePath(fileId) {
        return `${this.config.tmpDir}/${fileId}`;
    },

    /**
     * Imports a file from a URL
     * @param url
     * @param file
     * @param store
     * @param callback
     */
    importFromURL(url, file, store, callback) {
        if (typeof store === 'string') {
            Meteor.call('ufsImportURL', url, file, store, callback);
        }
        else if (typeof store === 'object') {
            store.importFromURL(url, file, callback);
        }
    },

    /**
     * Returns file and data as ArrayBuffer for each files in the event
     * @deprecated
     * @param event
     * @param callback
     */
    readAsArrayBuffer (event, callback) {
        console.error('UploadFS.readAsArrayBuffer is deprecated, see https://github.com/jalik/jalik-ufs#uploading-from-a-file');
    },

    /**
     * Opens a dialog to select a single file
     * @param callback
     */
    selectFile(callback) {
        let input = document.createElement('input');
        input.type = 'file';
        input.multiple = false;
        input.onchange = (ev) => {
            let files = ev.target.files;
            callback.call(UploadFS, files[0]);
        };
        // Fix for iOS
        input.style = 'display:none';
        document.body.appendChild(input);
        input.click();
    },

    /**
     * Opens a dialog to select multiple files
     * @param callback
     */
    selectFiles(callback) {
        let input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (ev) => {
            let files = ev.target.files;

            for (let i = 0; i < files.length; i += 1) {
                callback.call(UploadFS, files[i]);
            }
        };
        // Fix for iOS
        input.style = 'display:none';
        document.body.appendChild(input);
        input.click();
    }
};


import {Config} from './ufs-config';
import {Filter} from './ufs-filter';
import {Store} from './ufs-store';
import {StorePermissions} from './ufs-store-permissions';
import {Uploader} from './ufs-uploader';

if (Meteor.isClient) {
    require('./ufs-template-helpers');
}
if (Meteor.isServer) {
    require('./ufs-methods');
    require('./ufs-server');
}

/**
 * UploadFS Configuration
 * @type {Config}
 */
UploadFS.config = new Config();

// Add classes to global namespace
UploadFS.Config = Config;
UploadFS.Filter = Filter;
UploadFS.Store = Store;
UploadFS.StorePermissions = StorePermissions;
UploadFS.Uploader = Uploader;

if (Meteor.isServer) {
    // Expose the module globally
    if (typeof global !== 'undefined') {
        global['UploadFS'] = UploadFS;
    }
}
else if (Meteor.isClient) {
    // Expose the module globally
    if (typeof window !== 'undefined') {
        window.UploadFS = UploadFS;
    }
}
