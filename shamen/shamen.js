// i can move any mountain
(function (global, $) {

    'use strict';

    // instance default options
    var defaults = {
        dragHandle: null
    };

    // create draggable instance
    function Shamen(el, options) {
        this.options = $.extend({}, defaults, options);
        var css = { cursor: (this.options.cursor || 'move') };

        this.el = el;
        this.$el = $(el);
        this.$dragHandle = this.options.dragHandle ?
            this.$el.find(this.options.dragHandle) : this.$el;
        this.bind();
        this.originalDragHandleCursor = this.$dragHandle.css('cursor');
        // apply cursor css
        this.$dragHandle.css(css);
    }

    // bind mouse down event handler
    Shamen.prototype.bind = function () {
        // filter on drag handle if developer defined one
        var selector = this.options.dragHandle || null;
        var self = this;

        // unbind mousemove handler on mouseup
        $(global.document.documentElement).on('mouseup.shamen', function (e) {
            if (global.document.releaseCapture) {
                global.document.releaseCapture();
            }

            $(global.document.documentElement).off('mousemove.shamen');
        });

        this.$el.on('mousedown.shamen', selector, function (e) {
            // IE 兼容代码，解决鼠标超出浏览器界外之后依然可以拖动
            // https://developer.mozilla.org/zh-CN/docs/Web/API/Element/setCapture
            // https://developer.mozilla.org/zh-CN/docs/Web/API/Document/releaseCapture
            // https://www.web-tinker.com/article/20241.html
            if (e.target.setCapture) {
                e.target.setCapture();
            }
            
            // get the initial mouse position
            var mousePos = {
                x: e.pageX,
                y: e.pageY
            };

            // bind the mousemove handler
            $(global.document.documentElement).on('mousemove.shamen', function (e) {
                // get the differences between the mousedown position and the
                // position from the mousemove events
                var xDiff = e.pageX - mousePos.x;
                var yDiff = e.pageY - mousePos.y;
                // get the draggable el current position relative to the document
                var el = self.$el[0];
                var elPos = {
                    left: el.offsetLeft,
                    top: el.offsetTop
                };

                // prevent text selection
                e.preventDefault();

                // apply the mouse differences to the el position
                self.$el.css({
                    top: (elPos.top + yDiff),
                    left: (elPos.left + xDiff),
                    position: 'absolute'
                });

                // store the current mouse position
                // to diff with the next mousemove positions
                mousePos = {
                    x: e.pageX,
                    y: e.pageY
                };
            });
        });
    };

    // clean up to prevent memory leaks
    Shamen.prototype.destroy = function () {
        // unbind mousedown
        this.$el.off('mousedown.shamen');
        // revert cursor for draghandle
        this.$dragHandle.css({ cursor: this.originalDragHandleCursor });

        // null out jQuery object, element references
        this.el = null;
        this.$el = null;
        this.$dragHandle = null;

        // revert options to defaults
        this.options = defaults;
    };

    global.Shamen = Shamen;

})(this, this.jQuery);