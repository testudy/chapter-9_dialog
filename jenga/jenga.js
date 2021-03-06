(function (global) {

    'use strict';

    // this will be used for addressing all the browser & version specific
    // items that impact stacking contexts
    // fixed - the version where position fixed started creating a stacking context
    var browsers = {
        chrome: {
            fixed: 22
        }
    };

    // get browser version and name
    // i did not write this; if someone knows who did please let me know
    // so i can attribute the code to the author
    var browser = (function () {
        var ua = navigator.userAgent;
        var temp;
        var info = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
        if (info && (temp = ua.match(/version\/([\.\d]+)/i)) != null) {
            info[2] = temp[1];
        }
        info = info ? [info[1], info[2]] : [navigator.appName, navigator.appVersion, '-?'];

        return {
            name: info[0].toLowerCase(),
            version: info[1]
        };
    })();

    var isFixedStackingCtx = (function () {
        if (!browsers[browser.name] || !browsers[browser.name].fixed) {
            return false;
        }

        return browsers[browser.name].fixed >= parseInt(browser.version, 10);
    })();

    function getComputedStyle(element) {
        if (global.getComputedStyle) {
            return global.getComputedStyle(element);
        }

        // 参考：http://snipplr.com/view/13523/ 修改
        if (!global.getComputedStyle) {
            var computedStyle = {};

            for (var i in element.currentStyle) {
                computedStyle[i] = element.currentStyle[i];
            }

            computedStyle.getPropertyValue = function (property) {
                var re = /(\-([a-z]){1})/g;
                if (property === 'float') {
                    property = 'styleFloat';
                }
                if (re.test(property)) {
                    property = property.replace(re, function () {
                        return arguments[2].toUpperCase();
                    });
                }
                return this[property] || null;
            };

            return computedStyle;
        }
    }

    function isPosAndHasZindex(element) {
        var computedStyle = getComputedStyle(element);
        return (computedStyle.position && computedStyle.position !== 'static') &&
            (computedStyle.zIndex !== 'auto' && !isNaN(parseInt(computedStyle.zIndex, 10)));
    }

    // these values cause an element to create a stacking context
    function doesStyleCreateStackingCtx(element) {
        var computedStyle = getComputedStyle(element);

        if (computedStyle.opacity !== undefined && computedStyle.opacity < 1) {
            return true;
        }
        if (computedStyle.transform !== undefined && computedStyle.transform !== 'none') {
            return true;
        }
        if (computedStyle.transformStyle !== undefined && computedStyle.transformStyle === 'preserve-3d') {
            return true;
        }
        if (computedStyle.perspective !== undefined && computedStyle.perspective !== 'none') {
            return true;
        }
        if (computedStyle.flowFrom !== undefined && computedStyle.flowFrom !== 'none' && 
                computedStyle.content !== undefined && computedStyle.content !== 'normal') {
            return true;
        }
        if (computedStyle.position === 'fixed' && isFixedStackingCtx) {
            return true;
        }

        return false;
    }

    function isStackingCtx(element) {
        return element.tagName === 'HTML' ||
            isPosAndHasZindex(element) ||
            doesStyleCreateStackingCtx(element);
    }

    function setStackingCtx(element) {
        var computedStyle = getComputedStyle(element);

        if (computedStyle.position === 'static') {
            element.style.position = 'relative';
        }
    }

    function getStackingCtx(element) {
        var parentNode = element.parentNode;

        while (!isStackingCtx(parentNode)) {
            parentNode = parentNode.parentNode;
        }

        return parentNode;
    }

    function getZIndexes(element, isSkip) {
        var result = [];
        if (!isSkip && isPosAndHasZindex(element)) {
            var zIndex = parseInt(getComputedStyle(element).zIndex, 10);
            if (!isNaN(zIndex)) {
                result.push(zIndex);
                return result;
            };
        }

        var children = element.children;
        for(var i = 0, len = children.length; i < len; i += 1) {
            var child = children[i];
            var childResult = getZIndexes(child, false);
            if (childResult.length) {
                result.push.apply(result, childResult);
            }
        }
        

        return result;
    }

    function getMaxZIndex(element) {
        var zIndexes = getZIndexes(element, true);

        return Math.max(Math.max.apply(null, zIndexes), 0);
    }

    function bringToFront(element) {
        var computedStyle = getComputedStyle(element);
        var stackingCtx = getStackingCtx(element);
        var maxZIndex = getMaxZIndex(stackingCtx);

        if (!isStackingCtx(element)) {
            setStackingCtx(element);
        }

        // 可以做 `if (global.parseInt(computedStyle.zIndex, 10) === maxZIndex)) return;` 优化
        // 但需要考虑同一个堆叠上下文中存在和被修改元素层级相同、z-index值相同的弟弟级别堆叠元素
        element.style.zIndex = maxZIndex + 1;
    }

    var jenga = {

        isStackingCtx: isStackingCtx,

        getStackingCtx: getStackingCtx,

        bringToFront: bringToFront
    };

    global.jenga = jenga;

})(this);