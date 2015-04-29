var TextureEntry = require("../../xflow/interface/data.js").TextureEntry;
var InputNode = require("../../xflow/interface/graph.js").InputNode;
var XC = require("../../xflow/interface/constants.js");
var Events = require("../../interface/notification.js");
var NodeAdapter = require("../../base/adapter.js").NodeAdapter;

var defaults = require('lodash.defaults');
var assign = require('lodash.assign');


var TextureDataAdapter = function (factory, node) {
    NodeAdapter.call(this, factory, node);
};

XML3D.createClass(TextureDataAdapter, NodeAdapter, {

    init: function () {
        this.xflowInputNode = this.createXflowNode();
        this.xflowInputNode.data = this.createTextureEntry();
    },

    createTextureEntry: function () {
        var node = this.node;
        var entry = new TextureEntry(null);
        initTextureSamplingParameters(entry.getSamplerConfig(), node.getAttribute("style"));

        var imageAdapter = this.factory.getAdapter(this.node.firstElementChild);
        if (imageAdapter) {
            imageAdapter.setTextureEntry(entry);
        }
        return entry;
    },

    shouldGenerateMipMaps: shouldGenerateMipMaps,

    /**
     *
     * @returns {InputNode}
     */
    createXflowNode: function () {
        var xnode = new InputNode();
        xnode.name = this.node.name;
        xnode.paramName = this.node.param ? this.node.name : null;
        xnode.key = this.node.key;
        return xnode;
    },

    setScriptValue: function () {
        XML3D.debug.logError("Texture currently does not support setScriptValue()");
    },

    getOutputs: function () {
        var result = {};
        result[this.node.name] = this;
        return result;
    },

    getValue: function () {
        return this.value;
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
        if (name == "name") {
            this.xflowInputNode.name = newValue;
        } else if (name == "key") {
            this.xflowInputNode.key = newValue;
        } else if (name == "param") {
            this.xflowInputNode.paramName = newValue ? this.node.name : null;
        } else if (name == "style") {
            this.xflowInputNode.data = this.createTextureEntry();
        }
    },

    notifyChanged: function () { /* Nothing to do */
    },

    /**
     * @return {Element}
     */
    getXflowNode: function () {
        return this.xflowInputNode;
    }

});

var clampToGL = function (modeStr) {
    if (modeStr == "clamp")
        return WebGLRenderingContext.CLAMP_TO_EDGE;
    if (modeStr == "repeat")
        return WebGLRenderingContext.REPEAT;
};

var filterToGL = {
    "nearest": WebGLRenderingContext.NEAREST,
    "linear": WebGLRenderingContext.LINEAR,
    "nearest-mipmap-nearest": WebGLRenderingContext.NEAREST_MIPMAP_NEAREST,
    "linear-mipmap-nearest": WebGLRenderingContext.LINEAR_MIPMAP_NEAREST,
    "nearest-mipmap-linear": WebGLRenderingContext.NEAREST_MIPMAP_LINEAR,
    "linear-mipmap-linear": WebGLRenderingContext.LINEAR_MIPMAP_LINEAR
};

function shouldGenerateMipMaps(minFilter, magFilter) {
    return (minFilter != WebGLRenderingContext.NEAREST && minFilter != WebGLRenderingContext.LINEAR) || (magFilter != WebGLRenderingContext.NEAREST && magFilter != WebGLRenderingContext.LINEAR);
}

function parseTextureSamplingParameters(css) {
    var result = {};

    if(!css) {
        return result;
    }

    css.trim().split(";").forEach(function (rule) {
        var p = rule.trim().split(':'), args;
        if (p.length != 2) {
            return;
        }
        switch (p[0]) {
            case "texture-wrap":
                args = p[1].split(/(\s+)/);
                result.wrapS = clampToGL(args[0]);
                result.wrapT = clampToGL(args[args.length - 1]);
                break;
            case "texture-wrap-s":
                result.wrapS = clampToGL(p[1]);
                break;
            case "texture-wrap-t":
                result.wrapT = clampToGL(p[1]);
                break;
            case "texture-filter":
                args = p[1].split(/(\s+)/);
                result.minFilter = filterToGL[args[0]];
                result.magFilter = filterToGL[args[args.length - 1]];
                break;
            case "texture-filter-min":
                result.minFilter = filterToGL[p[1]];
                break;
            case "texture-filter-mag":
                result.magFilter = filterToGL[p[1]];
                break;
        }
    });
    return result;
}

function initTextureSamplingParameters(config, css) {
    var params = parseTextureSamplingParameters(css);
    defaults(params, {
        wrapS: WebGLRenderingContext.CLAMP_TO_EDGE,
        wrapT: WebGLRenderingContext.CLAMP_TO_EDGE,
        minFilter: WebGLRenderingContext.LINEAR_MIPMAP_LINEAR,
        magFilter: WebGLRenderingContext.LINEAR,
        textureType: XC.TEX_TYPE.TEXTURE_2D
    });
    assign(config, params);
    config.generateMipMap = shouldGenerateMipMaps(config.minFilter, config.magFilter);
}

// Export
module.exports = TextureDataAdapter;
