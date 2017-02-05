trackerApp.controller('offlinemapCtrl', function ($rootScope, $scope, $timeout, $firebaseObject, $firebaseArray, $http, $state, $document, $interval, dataBaseService, messages, localStorageService, Facebook, $filter, ngProgressFactory) {

 $(document).ready(function() {
        $("#lightgallery").lightGallery({
            thumbnail:true
        }); 
    });



        var defaults = {

            mode: 'lg-slide',

            // Ex : 'ease'
            cssEasing: 'ease',

            //'for jquery animation'
            easing: 'linear',
            speed: 600,
            height: '100%',
            width: '100%',
            addClass: '',
            startClass: 'lg-start-zoom',
            backdropDuration: 150,
            hideBarsDelay: 6000,

            useLeft: false,

            closable: true,
            loop: true,
            escKey: true,
            keyPress: true,
            controls: true,
            slideEndAnimatoin: true,
            hideControlOnEnd: false,
            mousewheel: true,

            getCaptionFromTitleOrAlt: true,

            // .lg-item || '.lg-sub-html'
            appendSubHtmlTo: '.lg-sub-html',

            subHtmlSelectorRelative: false,

            /**
             * @desc number of preload slides
             * will exicute only after the current slide is fully loaded.
             *
             * @ex you clicked on 4th image and if preload = 1 then 3rd slide and 5th
             * slide will be loaded in the background after the 4th slide is fully loaded..
             * if preload is 2 then 2nd 3rd 5th 6th slides will be preloaded.. ... ...
             *
             */
            preload: 1,
            showAfterLoad: true,
            selector: '',
            selectWithin: '',
            nextHtml: '',
            prevHtml: '',

            // 0, 1
            index: false,

            iframeMaxWidth: '100%',

            download: true,
            counter: true,
            appendCounterTo: '.lg-toolbar',

            swipeThreshold: 50,
            enableSwipe: true,
            enableDrag: true,

            dynamic: false,
            dynamicEl: [],
            galleryId: 1
        };

        function Plugin(element, options) {

            // Current lightGallery element
            this.el = element;

            // Current jquery element
            this.$el = $(element);

            // lightGallery settings
            this.s = $.extend({}, defaults, options);

            // When using dynamic mode, ensure dynamicEl is an array
            if (this.s.dynamic && this.s.dynamicEl !== 'undefined' && this.s.dynamicEl.constructor === Array && !this.s.dynamicEl.length) {
                throw ('When using dynamic mode, you must also define dynamicEl as an Array.');
            }

            // lightGallery modules
            this.modules = {};

            // false when lightgallery complete first slide;
            this.lGalleryOn = false;

            this.lgBusy = false;

            // Timeout function for hiding controls;
            this.hideBartimeout = false;

            // To determine browser supports for touch events;
            this.isTouch = ('ontouchstart' in document.documentElement);

            // Disable hideControlOnEnd if sildeEndAnimation is true
            if (this.s.slideEndAnimatoin) {
                this.s.hideControlOnEnd = false;
            }

            // Gallery items
            if (this.s.dynamic) {
                this.$items = this.s.dynamicEl;
            } else {
                if (this.s.selector === 'this') {
                    this.$items = this.$el;
                } else if (this.s.selector !== '') {
                    if (this.s.selectWithin) {
                        this.$items = $(this.s.selectWithin).find(this.s.selector);
                    } else {
                        this.$items = this.$el.find($(this.s.selector));
                    }
                } else {
                    this.$items = this.$el.children();
                }
            }

            // .lg-item
            this.$slide = '';

            // .lg-outer
            this.$outer = '';

            this.init();

            return this;
        }

        Plugin.prototype.init = function() {

            var _this = this;

            // s.preload should not be more than $item.length
            if (_this.s.preload > _this.$items.length) {
                _this.s.preload = _this.$items.length;
            }

            // if dynamic option is enabled execute immediately
            var _hash = window.location.hash;
            if (_hash.indexOf('lg=' + this.s.galleryId) > 0) {

                _this.index = parseInt(_hash.split('&slide=')[1], 10);

                $('body').addClass('lg-from-hash');
                if (!$('body').hasClass('lg-on')) {
                    setTimeout(function() {
                        _this.build(_this.index);
                    });

                    $('body').addClass('lg-on');
                }
            }

            if (_this.s.dynamic) {

                _this.$el.trigger('onBeforeOpen.lg');

                _this.index = _this.s.index || 0;

                // prevent accidental double execution
                if (!$('body').hasClass('lg-on')) {
                    setTimeout(function() {
                        _this.build(_this.index);
                        $('body').addClass('lg-on');
                    });
                }
            } else {

                // Using different namespace for click because click event should not unbind if selector is same object('this')
                _this.$items.on('click.lgcustom', function(event) {

                    // For IE8
                    try {
                        event.preventDefault();
                        event.preventDefault();
                    } catch (er) {
                        event.returnValue = false;
                    }

                    _this.$el.trigger('onBeforeOpen.lg');

                    _this.index = _this.s.index || _this.$items.index(this);

                    // prevent accidental double execution
                    if (!$('body').hasClass('lg-on')) {
                        _this.build(_this.index);
                        $('body').addClass('lg-on');
                    }
                });
            }

        };

        Plugin.prototype.build = function(index) {

            var _this = this;

            _this.structure();

            // module constructor
            $.each($.fn.lightGallery.modules, function(key) {
                _this.modules[key] = new $.fn.lightGallery.modules[key](_this.el);
            });

            // initiate slide function
            _this.slide(index, false, false, false);

            if (_this.s.keyPress) {
                _this.keyPress();
            }

            if (_this.$items.length > 1) {

                _this.arrow();

                setTimeout(function() {
                    _this.enableDrag();
                    _this.enableSwipe();
                }, 50);

                if (_this.s.mousewheel) {
                    _this.mousewheel();
                }
            }

            _this.counter();

            _this.closeGallery();

            _this.$el.trigger('onAfterOpen.lg');

            // Hide controllers if mouse doesn't move for some period
            _this.$outer.on('mousemove.lg click.lg touchstart.lg', function() {

                _this.$outer.removeClass('lg-hide-items');

                clearTimeout(_this.hideBartimeout);

                // Timeout will be cleared on each slide movement also
                _this.hideBartimeout = setTimeout(function() {
                    _this.$outer.addClass('lg-hide-items');
                }, _this.s.hideBarsDelay);

            });

        };

        Plugin.prototype.structure = function() {
            var list = '';
            var controls = '';
            var i = 0;
            var subHtmlCont = '';
            var template;
            var _this = this;

            $('body').append('<div class="lg-backdrop"></div>');
            $('.lg-backdrop').css('transition-duration', this.s.backdropDuration + 'ms');

            // Create gallery items
            for (i = 0; i < this.$items.length; i++) {
                list += '<div class="lg-item"></div>';
            }

            // Create controlls
            if (this.s.controls && this.$items.length > 1) {
                controls = '<div class="lg-actions">' +
                    '<div class="lg-prev lg-icon">' + this.s.prevHtml + '</div>' +
                    '<div class="lg-next lg-icon">' + this.s.nextHtml + '</div>' +
                    '</div>';
            }

            if (this.s.appendSubHtmlTo === '.lg-sub-html') {
                subHtmlCont = '<div class="lg-sub-html"></div>';
            }

            template = '<div class="lg-outer ' + this.s.addClass + ' ' + this.s.startClass + '">' +
                '<div class="lg" style="width:' + this.s.width + '; height:' + this.s.height + '">' +
                '<div class="lg-inner">' + list + '</div>' +
                '<div class="lg-toolbar group">' +
                '<span class="lg-close lg-icon"></span>' +
                '</div>' +
                controls +
                subHtmlCont +
                '</div>' +
                '</div>';

            $('body').append(template);
            this.$outer = $('.lg-outer');
            this.$slide = this.$outer.find('.lg-item');

            if (this.s.useLeft) {
                this.$outer.addClass('lg-use-left');

                // Set mode lg-slide if use left is true;
                this.s.mode = 'lg-slide';
            } else {
                this.$outer.addClass('lg-use-css3');
            }

            // For fixed height gallery
            _this.setTop();
            $(window).on('resize.lg orientationchange.lg', function() {
                setTimeout(function() {
                    _this.setTop();
                }, 100);
            });

            // add class lg-current to remove initial transition
            this.$slide.eq(this.index).addClass('lg-current');

            // add Class for css support and transition mode
            if (this.doCss()) {
                this.$outer.addClass('lg-css3');
            } else {
                this.$outer.addClass('lg-css');

                // Set speed 0 because no animation will happen if browser doesn't support css3
                this.s.speed = 0;
            }

            this.$outer.addClass(this.s.mode);

            if (this.s.enableDrag && this.$items.length > 1) {
                this.$outer.addClass('lg-grab');
            }

            if (this.s.showAfterLoad) {
                this.$outer.addClass('lg-show-after-load');
            }

            if (this.doCss()) {
                var $inner = this.$outer.find('.lg-inner');
                $inner.css('transition-timing-function', this.s.cssEasing);
                $inner.css('transition-duration', this.s.speed + 'ms');
            }

            setTimeout(function() {
                $('.lg-backdrop').addClass('in');
            });

            setTimeout(function() {
                _this.$outer.addClass('lg-visible');
            }, this.s.backdropDuration);

            if (this.s.download) {
                this.$outer.find('.lg-toolbar').append('<a id="lg-download" target="_blank" download class="lg-download lg-icon"></a>');
            }

            // Store the current scroll top value to scroll back after closing the gallery..
            this.prevScrollTop = $(window).scrollTop();

        };

        // For fixed height gallery
        Plugin.prototype.setTop = function() {
            if (this.s.height !== '100%') {
                var wH = $(window).height();
                var top = (wH - parseInt(this.s.height, 10)) / 2;
                var $lGallery = this.$outer.find('.lg');
                if (wH >= parseInt(this.s.height, 10)) {
                    $lGallery.css('top', top + 'px');
                } else {
                    $lGallery.css('top', '0px');
                }
            }
        };

        // Find css3 support
        Plugin.prototype.doCss = function() {
            // check for css animation support
            var support = function() {
                var transition = ['transition', 'MozTransition', 'WebkitTransition', 'OTransition', 'msTransition', 'KhtmlTransition'];
                var root = document.documentElement;
                var i = 0;
                for (i = 0; i < transition.length; i++) {
                    if (transition[i] in root.style) {
                        return true;
                    }
                }
            };

            if (support()) {
                return true;
            }

            return false;
        };

        /**
         *  @desc Check the given src is video
         *  @param {String} src
         *  @return {Object} video type
         *  Ex:{ youtube  :  ["//www.youtube.com/watch?v=c0asJgSyxcY", "c0asJgSyxcY"] }
         */
        Plugin.prototype.isVideo = function(src, index) {

            var html;
            if (this.s.dynamic) {
                html = this.s.dynamicEl[index].html;
            } else {
                html = this.$items.eq(index).attr('data-html');
            }

            if (!src && html) {
                return {
                    html5: true
                };
            }

            var youtube = src.match(/\/\/(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=|embed\/)?([a-z0-9\-\_\%]+)/i);
            var vimeo = src.match(/\/\/(?:www\.)?vimeo.com\/([0-9a-z\-_]+)/i);
            var dailymotion = src.match(/\/\/(?:www\.)?dai.ly\/([0-9a-z\-_]+)/i);
            var vk = src.match(/\/\/(?:www\.)?(?:vk\.com|vkontakte\.ru)\/(?:video_ext\.php\?)(.*)/i);

            if (youtube) {
                return {
                    youtube: youtube
                };
            } else if (vimeo) {
                return {
                    vimeo: vimeo
                };
            } else if (dailymotion) {
                return {
                    dailymotion: dailymotion
                };
            } else if (vk) {
                return {
                    vk: vk
                };
            }
        };

        /**
         *  @desc Create image counter
         *  Ex: 1/10
         */
        Plugin.prototype.counter = function() {
            if (this.s.counter) {
                $(this.s.appendCounterTo).append('<div id="lg-counter"><span id="lg-counter-current">' + (parseInt(this.index, 10) + 1) + '</span> / <span id="lg-counter-all">' + this.$items.length + '</span></div>');
            }
        };

        /**
         *  @desc add sub-html into the slide
         *  @param {Number} index - index of the slide
         */
        Plugin.prototype.addHtml = function(index) {
            var subHtml = null;
            var subHtmlUrl;
            var $currentEle;
            if (this.s.dynamic) {
                if (this.s.dynamicEl[index].subHtmlUrl) {
                    subHtmlUrl = this.s.dynamicEl[index].subHtmlUrl;
                } else {
                    subHtml = this.s.dynamicEl[index].subHtml;
                }
            } else {
                $currentEle = this.$items.eq(index);
                if ($currentEle.attr('data-sub-html-url')) {
                    subHtmlUrl = $currentEle.attr('data-sub-html-url');
                } else {
                    subHtml = $currentEle.attr('data-sub-html');
                    if (this.s.getCaptionFromTitleOrAlt && !subHtml) {
                        subHtml = $currentEle.attr('title') || $currentEle.find('img').first().attr('alt');
                    }
                }
            }

            if (!subHtmlUrl) {
                if (typeof subHtml !== 'undefined' && subHtml !== null) {

                    // get first letter of subhtml
                    // if first letter starts with . or # get the html form the jQuery object
                    var fL = subHtml.substring(0, 1);
                    if (fL === '.' || fL === '#') {
                        if (this.s.subHtmlSelectorRelative && !this.s.dynamic) {
                            subHtml = $currentEle.find(subHtml).html();
                        } else {
                            subHtml = $(subHtml).html();
                        }
                    }
                } else {
                    subHtml = '';
                }
            }

            if (this.s.appendSubHtmlTo === '.lg-sub-html') {

                if (subHtmlUrl) {
                    this.$outer.find(this.s.appendSubHtmlTo).load(subHtmlUrl);
                } else {
                    this.$outer.find(this.s.appendSubHtmlTo).html(subHtml);
                }

            } else {

                if (subHtmlUrl) {
                    this.$slide.eq(index).load(subHtmlUrl);
                } else {
                    this.$slide.eq(index).append(subHtml);
                }
            }

            // Add lg-empty-html class if title doesn't exist
            if (typeof subHtml !== 'undefined' && subHtml !== null) {
                if (subHtml === '') {
                    this.$outer.find(this.s.appendSubHtmlTo).addClass('lg-empty-html');
                } else {
                    this.$outer.find(this.s.appendSubHtmlTo).removeClass('lg-empty-html');
                }
            }

            this.$el.trigger('onAfterAppendSubHtml.lg', [index]);
        };

        /**
         *  @desc Preload slides
         *  @param {Number} index - index of the slide
         */
        Plugin.prototype.preload = function(index) {
            var i = 1;
            var j = 1;
            for (i = 1; i <= this.s.preload; i++) {
                if (i >= this.$items.length - index) {
                    break;
                }

                this.loadContent(index + i, false, 0);
            }

            for (j = 1; j <= this.s.preload; j++) {
                if (index - j < 0) {
                    break;
                }

                this.loadContent(index - j, false, 0);
            }
        };

        /**
         *  @desc Load slide content into slide.
         *  @param {Number} index - index of the slide.
         *  @param {Boolean} rec - if true call loadcontent() function again.
         *  @param {Boolean} delay - delay for adding complete class. it is 0 except first time.
         */
        Plugin.prototype.loadContent = function(index, rec, delay) {

            var _this = this;
            var _hasPoster = false;
            var _$img;
            var _src;
            var _poster;
            var _srcset;
            var _sizes;
            var _html;
            var getResponsiveSrc = function(srcItms) {
                var rsWidth = [];
                var rsSrc = [];
                for (var i = 0; i < srcItms.length; i++) {
                    var __src = srcItms[i].split(' ');

                    // Manage empty space
                    if (__src[0] === '') {
                        __src.splice(0, 1);
                    }

                    rsSrc.push(__src[0]);
                    rsWidth.push(__src[1]);
                }

                var wWidth = $(window).width();
                for (var j = 0; j < rsWidth.length; j++) {
                    if (parseInt(rsWidth[j], 10) > wWidth) {
                        _src = rsSrc[j];
                        break;
                    }
                }
            };

            if (_this.s.dynamic) {

                if (_this.s.dynamicEl[index].poster) {
                    _hasPoster = true;
                    _poster = _this.s.dynamicEl[index].poster;
                }

                _html = _this.s.dynamicEl[index].html;
                _src = _this.s.dynamicEl[index].src;

                if (_this.s.dynamicEl[index].responsive) {
                    var srcDyItms = _this.s.dynamicEl[index].responsive.split(',');
                    getResponsiveSrc(srcDyItms);
                }

                _srcset = _this.s.dynamicEl[index].srcset;
                _sizes = _this.s.dynamicEl[index].sizes;

            } else {

                if (_this.$items.eq(index).attr('data-poster')) {
                    _hasPoster = true;
                    _poster = _this.$items.eq(index).attr('data-poster');
                }

                _html = _this.$items.eq(index).attr('data-html');
                _src = _this.$items.eq(index).attr('href') || _this.$items.eq(index).attr('data-src');

                if (_this.$items.eq(index).attr('data-responsive')) {
                    var srcItms = _this.$items.eq(index).attr('data-responsive').split(',');
                    getResponsiveSrc(srcItms);
                }

                _srcset = _this.$items.eq(index).attr('data-srcset');
                _sizes = _this.$items.eq(index).attr('data-sizes');

            }

            //if (_src || _srcset || _sizes || _poster) {

            var iframe = false;
            if (_this.s.dynamic) {
                if (_this.s.dynamicEl[index].iframe) {
                    iframe = true;
                }
            } else {
                if (_this.$items.eq(index).attr('data-iframe') === 'true') {
                    iframe = true;
                }
            }

            var _isVideo = _this.isVideo(_src, index);
            if (!_this.$slide.eq(index).hasClass('lg-loaded')) {
                if (iframe) {
                    _this.$slide.eq(index).prepend('<div class="lg-video-cont" style="max-width:' + _this.s.iframeMaxWidth + '"><div class="lg-video"><iframe class="lg-object" frameborder="0" src="' + _src + '"  allowfullscreen="true"></iframe></div></div>');
                } else if (_hasPoster) {
                    var videoClass = '';
                    if (_isVideo && _isVideo.youtube) {
                        videoClass = 'lg-has-youtube';
                    } else if (_isVideo && _isVideo.vimeo) {
                        videoClass = 'lg-has-vimeo';
                    } else {
                        videoClass = 'lg-has-html5';
                    }

                    _this.$slide.eq(index).prepend('<div class="lg-video-cont ' + videoClass + ' "><div class="lg-video"><span class="lg-video-play"></span><img class="lg-object lg-has-poster" src="' + _poster + '" /></div></div>');

                } else if (_isVideo) {
                    _this.$slide.eq(index).prepend('<div class="lg-video-cont "><div class="lg-video"></div></div>');
                    _this.$el.trigger('hasVideo.lg', [index, _src, _html]);
                } else {
                    _this.$slide.eq(index).prepend('<div class="lg-img-wrap"><img class="lg-object lg-image" src="' + _src + '" /></div>');
                }

                _this.$el.trigger('onAferAppendSlide.lg', [index]);

                _$img = _this.$slide.eq(index).find('.lg-object');
                if (_sizes) {
                    _$img.attr('sizes', _sizes);
                }

                if (_srcset) {
                    _$img.attr('srcset', _srcset);
                    try {
                        picturefill({
                            elements: [_$img[0]]
                        });
                    } catch (e) {
                        console.error('Make sure you have included Picturefill version 2');
                    }
                }

                if (this.s.appendSubHtmlTo !== '.lg-sub-html') {
                    _this.addHtml(index);
                }

                _this.$slide.eq(index).addClass('lg-loaded');
            }

            _this.$slide.eq(index).find('.lg-object').on('load.lg error.lg', function() {

                // For first time add some delay for displaying the start animation.
                var _speed = 0;

                // Do not change the delay value because it is required for zoom plugin.
                // If gallery opened from direct url (hash) speed value should be 0
                if (delay && !$('body').hasClass('lg-from-hash')) {
                    _speed = delay;
                }

                setTimeout(function() {
                    _this.$slide.eq(index).addClass('lg-complete');
                    _this.$el.trigger('onSlideItemLoad.lg', [index, delay || 0]);
                }, _speed);

            });

            // @todo check load state for html5 videos
            if (_isVideo && _isVideo.html5 && !_hasPoster) {
                _this.$slide.eq(index).addClass('lg-complete');
            }

            if (rec === true) {
                if (!_this.$slide.eq(index).hasClass('lg-complete')) {
                    _this.$slide.eq(index).find('.lg-object').on('load.lg error.lg', function() {
                        _this.preload(index);
                    });
                } else {
                    _this.preload(index);
                }
            }

            //}
        };

        /**
         *   @desc slide function for lightgallery
         ** Slide() gets call on start
         ** ** Set lg.on true once slide() function gets called.
         ** Call loadContent() on slide() function inside setTimeout
         ** ** On first slide we do not want any animation like slide of fade
         ** ** So on first slide( if lg.on if false that is first slide) loadContent() should start loading immediately
         ** ** Else loadContent() should wait for the transition to complete.
         ** ** So set timeout s.speed + 50
         <=> ** loadContent() will load slide content in to the particular slide
         ** ** It has recursion (rec) parameter. if rec === true loadContent() will call preload() function.
         ** ** preload will execute only when the previous slide is fully loaded (images iframe)
         ** ** avoid simultaneous image load
         <=> ** Preload() will check for s.preload value and call loadContent() again accoring to preload value
         ** loadContent()  <====> Preload();

         *   @param {Number} index - index of the slide
         *   @param {Boolean} fromTouch - true if slide function called via touch event or mouse drag
         *   @param {Boolean} fromThumb - true if slide function called via thumbnail click
         *   @param {String} direction - Direction of the slide(next/prev)
         */
        Plugin.prototype.slide = function(index, fromTouch, fromThumb, direction) {

            var _prevIndex = this.$outer.find('.lg-current').index();
            var _this = this;

            // Prevent if multiple call
            // Required for hsh plugin
            if (_this.lGalleryOn && (_prevIndex === index)) {
                return;
            }

            var _length = this.$slide.length;
            var _time = _this.lGalleryOn ? this.s.speed : 0;

            if (!_this.lgBusy) {

                if (this.s.download) {
                    var _src;
                    if (_this.s.dynamic) {
                        _src = _this.s.dynamicEl[index].downloadUrl !== false && (_this.s.dynamicEl[index].downloadUrl || _this.s.dynamicEl[index].src);
                    } else {
                        _src = _this.$items.eq(index).attr('data-download-url') !== 'false' && (_this.$items.eq(index).attr('data-download-url') || _this.$items.eq(index).attr('href') || _this.$items.eq(index).attr('data-src'));

                    }

                    if (_src) {
                        $('#lg-download').attr('href', _src);
                        _this.$outer.removeClass('lg-hide-download');
                    } else {
                        _this.$outer.addClass('lg-hide-download');
                    }
                }

                this.$el.trigger('onBeforeSlide.lg', [_prevIndex, index, fromTouch, fromThumb]);

                _this.lgBusy = true;

                clearTimeout(_this.hideBartimeout);

                // Add title if this.s.appendSubHtmlTo === lg-sub-html
                if (this.s.appendSubHtmlTo === '.lg-sub-html') {

                    // wait for slide animation to complete
                    setTimeout(function() {
                        _this.addHtml(index);
                    }, _time);
                }

                this.arrowDisable(index);

                if (!direction) {
                    if (index < _prevIndex) {
                        direction = 'prev';
                    } else if (index > _prevIndex) {
                        direction = 'next';
                    }
                }

                if (!fromTouch) {

                    // remove all transitions
                    _this.$outer.addClass('lg-no-trans');

                    this.$slide.removeClass('lg-prev-slide lg-next-slide');

                    if (direction === 'prev') {

                        //prevslide
                        this.$slide.eq(index).addClass('lg-prev-slide');
                        this.$slide.eq(_prevIndex).addClass('lg-next-slide');
                    } else {

                        // next slide
                        this.$slide.eq(index).addClass('lg-next-slide');
                        this.$slide.eq(_prevIndex).addClass('lg-prev-slide');
                    }

                    // give 50 ms for browser to add/remove class
                    setTimeout(function() {
                        _this.$slide.removeClass('lg-current');

                        //_this.$slide.eq(_prevIndex).removeClass('lg-current');
                        _this.$slide.eq(index).addClass('lg-current');

                        // reset all transitions
                        _this.$outer.removeClass('lg-no-trans');
                    }, 50);
                } else {

                    this.$slide.removeClass('lg-prev-slide lg-current lg-next-slide');
                    var touchPrev;
                    var touchNext;
                    if (_length > 2) {
                        touchPrev = index - 1;
                        touchNext = index + 1;

                        if ((index === 0) && (_prevIndex === _length - 1)) {

                            // next slide
                            touchNext = 0;
                            touchPrev = _length - 1;
                        } else if ((index === _length - 1) && (_prevIndex === 0)) {

                            // prev slide
                            touchNext = 0;
                            touchPrev = _length - 1;
                        }

                    } else {
                        touchPrev = 0;
                        touchNext = 1;
                    }

                    if (direction === 'prev') {
                        _this.$slide.eq(touchNext).addClass('lg-next-slide');
                    } else {
                        _this.$slide.eq(touchPrev).addClass('lg-prev-slide');
                    }

                    _this.$slide.eq(index).addClass('lg-current');
                }

                if (_this.lGalleryOn) {
                    setTimeout(function() {
                        _this.loadContent(index, true, 0);
                    }, this.s.speed + 50);

                    setTimeout(function() {
                        _this.lgBusy = false;
                        _this.$el.trigger('onAfterSlide.lg', [_prevIndex, index, fromTouch, fromThumb]);
                    }, this.s.speed);

                } else {
                    _this.loadContent(index, true, _this.s.backdropDuration);

                    _this.lgBusy = false;
                    _this.$el.trigger('onAfterSlide.lg', [_prevIndex, index, fromTouch, fromThumb]);
                }

                _this.lGalleryOn = true;

                if (this.s.counter) {
                    $('#lg-counter-current').text(index + 1);
                }

            }

        };

        /**
         *  @desc Go to next slide
         *  @param {Boolean} fromTouch - true if slide function called via touch event
         */
        Plugin.prototype.goToNextSlide = function(fromTouch) {
            var _this = this;
            var _loop = _this.s.loop;
            if (fromTouch && _this.$slide.length < 3) {
                _loop = false;
            }

            if (!_this.lgBusy) {
                if ((_this.index + 1) < _this.$slide.length) {
                    _this.index++;
                    _this.$el.trigger('onBeforeNextSlide.lg', [_this.index]);
                    _this.slide(_this.index, fromTouch, false, 'next');
                } else {
                    if (_loop) {
                        _this.index = 0;
                        _this.$el.trigger('onBeforeNextSlide.lg', [_this.index]);
                        _this.slide(_this.index, fromTouch, false, 'next');
                    } else if (_this.s.slideEndAnimatoin && !fromTouch) {
                        _this.$outer.addClass('lg-right-end');
                        setTimeout(function() {
                            _this.$outer.removeClass('lg-right-end');
                        }, 400);
                    }
                }
            }
        };

        /**
         *  @desc Go to previous slide
         *  @param {Boolean} fromTouch - true if slide function called via touch event
         */
        Plugin.prototype.goToPrevSlide = function(fromTouch) {
            var _this = this;
            var _loop = _this.s.loop;
            if (fromTouch && _this.$slide.length < 3) {
                _loop = false;
            }

            if (!_this.lgBusy) {
                if (_this.index > 0) {
                    _this.index--;
                    _this.$el.trigger('onBeforePrevSlide.lg', [_this.index, fromTouch]);
                    _this.slide(_this.index, fromTouch, false, 'prev');
                } else {
                    if (_loop) {
                        _this.index = _this.$items.length - 1;
                        _this.$el.trigger('onBeforePrevSlide.lg', [_this.index, fromTouch]);
                        _this.slide(_this.index, fromTouch, false, 'prev');
                    } else if (_this.s.slideEndAnimatoin && !fromTouch) {
                        _this.$outer.addClass('lg-left-end');
                        setTimeout(function() {
                            _this.$outer.removeClass('lg-left-end');
                        }, 400);
                    }
                }
            }
        };

        Plugin.prototype.keyPress = function() {
            var _this = this;
            if (this.$items.length > 1) {
                $(window).on('keyup.lg', function(e) {
                    if (_this.$items.length > 1) {
                        if (e.keyCode === 37) {
                            e.preventDefault();
                            _this.goToPrevSlide();
                        }

                        if (e.keyCode === 39) {
                            e.preventDefault();
                            _this.goToNextSlide();
                        }
                    }
                });
            }

            $(window).on('keydown.lg', function(e) {
                if (_this.s.escKey === true && e.keyCode === 27) {
                    e.preventDefault();
                    if (!_this.$outer.hasClass('lg-thumb-open')) {
                        _this.destroy();
                    } else {
                        _this.$outer.removeClass('lg-thumb-open');
                    }
                }
            });
        };

        Plugin.prototype.arrow = function() {
            var _this = this;
            this.$outer.find('.lg-prev').on('click.lg', function() {
                _this.goToPrevSlide();
            });

            this.$outer.find('.lg-next').on('click.lg', function() {
                _this.goToNextSlide();
            });
        };

        Plugin.prototype.arrowDisable = function(index) {

            // Disable arrows if s.hideControlOnEnd is true
            if (!this.s.loop && this.s.hideControlOnEnd) {
                if ((index + 1) < this.$slide.length) {
                    this.$outer.find('.lg-next').removeAttr('disabled').removeClass('disabled');
                } else {
                    this.$outer.find('.lg-next').attr('disabled', 'disabled').addClass('disabled');
                }

                if (index > 0) {
                    this.$outer.find('.lg-prev').removeAttr('disabled').removeClass('disabled');
                } else {
                    this.$outer.find('.lg-prev').attr('disabled', 'disabled').addClass('disabled');
                }
            }
        };

        Plugin.prototype.setTranslate = function($el, xValue, yValue) {
            // jQuery supports Automatic CSS prefixing since jQuery 1.8.0
            if (this.s.useLeft) {
                $el.css('left', xValue);
            } else {
                $el.css({
                    transform: 'translate3d(' + (xValue) + 'px, ' + yValue + 'px, 0px)'
                });
            }
        };

        Plugin.prototype.touchMove = function(startCoords, endCoords) {

            var distance = endCoords - startCoords;

            if (Math.abs(distance) > 15) {
                // reset opacity and transition duration
                this.$outer.addClass('lg-dragging');

                // move current slide
                this.setTranslate(this.$slide.eq(this.index), distance, 0);

                // move next and prev slide with current slide
                this.setTranslate($('.lg-prev-slide'), -this.$slide.eq(this.index).width() + distance, 0);
                this.setTranslate($('.lg-next-slide'), this.$slide.eq(this.index).width() + distance, 0);
            }
        };

        Plugin.prototype.touchEnd = function(distance) {
            var _this = this;

            // keep slide animation for any mode while dragg/swipe
            if (_this.s.mode !== 'lg-slide') {
                _this.$outer.addClass('lg-slide');
            }

            this.$slide.not('.lg-current, .lg-prev-slide, .lg-next-slide').css('opacity', '0');

            // set transition duration
            setTimeout(function() {
                _this.$outer.removeClass('lg-dragging');
                if ((distance < 0) && (Math.abs(distance) > _this.s.swipeThreshold)) {
                    _this.goToNextSlide(true);
                } else if ((distance > 0) && (Math.abs(distance) > _this.s.swipeThreshold)) {
                    _this.goToPrevSlide(true);
                } else if (Math.abs(distance) < 5) {

                    // Trigger click if distance is less than 5 pix
                    _this.$el.trigger('onSlideClick.lg');
                }

                _this.$slide.removeAttr('style');
            });

            // remove slide class once drag/swipe is completed if mode is not slide
            setTimeout(function() {
                if (!_this.$outer.hasClass('lg-dragging') && _this.s.mode !== 'lg-slide') {
                    _this.$outer.removeClass('lg-slide');
                }
            }, _this.s.speed + 100);

        };

        Plugin.prototype.enableSwipe = function() {
            var _this = this;
            var startCoords = 0;
            var endCoords = 0;
            var isMoved = false;

            if (_this.s.enableSwipe && _this.isTouch && _this.doCss()) {

                _this.$slide.on('touchstart.lg', function(e) {
                    if (!_this.$outer.hasClass('lg-zoomed') && !_this.lgBusy) {
                        e.preventDefault();
                        _this.manageSwipeClass();
                        startCoords = e.originalEvent.targetTouches[0].pageX;
                    }
                });

                _this.$slide.on('touchmove.lg', function(e) {
                    if (!_this.$outer.hasClass('lg-zoomed')) {
                        e.preventDefault();
                        endCoords = e.originalEvent.targetTouches[0].pageX;
                        _this.touchMove(startCoords, endCoords);
                        isMoved = true;
                    }
                });

                _this.$slide.on('touchend.lg', function() {
                    if (!_this.$outer.hasClass('lg-zoomed')) {
                        if (isMoved) {
                            isMoved = false;
                            _this.touchEnd(endCoords - startCoords);
                        } else {
                            _this.$el.trigger('onSlideClick.lg');
                        }
                    }
                });
            }

        };

        Plugin.prototype.enableDrag = function() {
            var _this = this;
            var startCoords = 0;
            var endCoords = 0;
            var isDraging = false;
            var isMoved = false;
            if (_this.s.enableDrag && !_this.isTouch && _this.doCss()) {
                _this.$slide.on('mousedown.lg', function(e) {
                    // execute only on .lg-object
                    if (!_this.$outer.hasClass('lg-zoomed')) {
                        if ($(e.target).hasClass('lg-object') || $(e.target).hasClass('lg-video-play')) {
                            e.preventDefault();

                            if (!_this.lgBusy) {
                                _this.manageSwipeClass();
                                startCoords = e.pageX;
                                isDraging = true;

                                // ** Fix for webkit cursor issue https://code.google.com/p/chromium/issues/detail?id=26723
                                _this.$outer.scrollLeft += 1;
                                _this.$outer.scrollLeft -= 1;

                                // *

                                _this.$outer.removeClass('lg-grab').addClass('lg-grabbing');

                                _this.$el.trigger('onDragstart.lg');
                            }

                        }
                    }
                });

                $(window).on('mousemove.lg', function(e) {
                    if (isDraging) {
                        isMoved = true;
                        endCoords = e.pageX;
                        _this.touchMove(startCoords, endCoords);
                        _this.$el.trigger('onDragmove.lg');
                    }
                });

                $(window).on('mouseup.lg', function(e) {
                    if (isMoved) {
                        isMoved = false;
                        _this.touchEnd(endCoords - startCoords);
                        _this.$el.trigger('onDragend.lg');
                    } else if ($(e.target).hasClass('lg-object') || $(e.target).hasClass('lg-video-play')) {
                        _this.$el.trigger('onSlideClick.lg');
                    }

                    // Prevent execution on click
                    if (isDraging) {
                        isDraging = false;
                        _this.$outer.removeClass('lg-grabbing').addClass('lg-grab');
                    }
                });

            }
        };

        Plugin.prototype.manageSwipeClass = function() {
            var _touchNext = this.index + 1;
            var _touchPrev = this.index - 1;
            if (this.s.loop && this.$slide.length > 2) {
                if (this.index === 0) {
                    _touchPrev = this.$slide.length - 1;
                } else if (this.index === this.$slide.length - 1) {
                    _touchNext = 0;
                }
            }

            this.$slide.removeClass('lg-next-slide lg-prev-slide');
            if (_touchPrev > -1) {
                this.$slide.eq(_touchPrev).addClass('lg-prev-slide');
            }

            this.$slide.eq(_touchNext).addClass('lg-next-slide');
        };

        Plugin.prototype.mousewheel = function() {
            var _this = this;
            _this.$outer.on('mousewheel.lg', function(e) {

                if (!e.deltaY) {
                    return;
                }

                if (e.deltaY > 0) {
                    _this.goToPrevSlide();
                } else {
                    _this.goToNextSlide();
                }

                e.preventDefault();
            });

        };

        Plugin.prototype.closeGallery = function() {

            var _this = this;
            var mousedown = false;
            this.$outer.find('.lg-close').on('click.lg', function() {
                _this.destroy();
            });

            if (_this.s.closable) {

                // If you drag the slide and release outside gallery gets close on chrome
                // for preventing this check mousedown and mouseup happened on .lg-item or lg-outer
                _this.$outer.on('mousedown.lg', function(e) {

                    if ($(e.target).is('.lg-outer') || $(e.target).is('.lg-item ') || $(e.target).is('.lg-img-wrap')) {
                        mousedown = true;
                    } else {
                        mousedown = false;
                    }

                });

                _this.$outer.on('mouseup.lg', function(e) {

                    if ($(e.target).is('.lg-outer') || $(e.target).is('.lg-item ') || $(e.target).is('.lg-img-wrap') && mousedown) {
                        if (!_this.$outer.hasClass('lg-dragging')) {
                            _this.destroy();
                        }
                    }

                });

            }

        };

        Plugin.prototype.destroy = function(d) {

            var _this = this;

            if (!d) {
                _this.$el.trigger('onBeforeClose.lg');
            }

            $(window).scrollTop(_this.prevScrollTop);

            /**
             * if d is false or undefined destroy will only close the gallery
             * plugins instance remains with the element
             *
             * if d is true destroy will completely remove the plugin
             */

            if (d) {
                if (!_this.s.dynamic) {
                    // only when not using dynamic mode is $items a jquery collection
                    this.$items.off('click.lg click.lgcustom');
                }

                $.removeData(_this.el, 'lightGallery');
            }

            // Unbind all events added by lightGallery
            this.$el.off('.lg.tm');

            // Distroy all lightGallery modules
            $.each($.fn.lightGallery.modules, function(key) {
                if (_this.modules[key]) {
                    _this.modules[key].destroy();
                }
            });

            this.lGalleryOn = false;

            clearTimeout(_this.hideBartimeout);
            this.hideBartimeout = false;
            $(window).off('.lg');
            $('body').removeClass('lg-on lg-from-hash');

            if (_this.$outer) {
                _this.$outer.removeClass('lg-visible');
            }

            $('.lg-backdrop').removeClass('in');

            setTimeout(function() {
                if (_this.$outer) {
                    _this.$outer.remove();
                }

                $('.lg-backdrop').remove();

                if (!d) {
                    _this.$el.trigger('onCloseAfter.lg');
                }

            }, _this.s.backdropDuration + 50);
        };

        $.fn.lightGallery = function(options) {
            return this.each(function() {
                if (!$.data(this, 'lightGallery')) {
                    $.data(this, 'lightGallery', new Plugin(this, options));
                } else {
                    try {
                        $(this).data('lightGallery').init();
                    } catch (err) {
                        console.error('lightGallery has not initiated properly');
                    }
                }
            });
        };

        $.fn.lightGallery.modules = {};










        $scope.loading = true;

    $scope.profile = localStorageService.get('profile');
    $scope.userAccessToken = localStorageService.get('providerToken');

    if (!$scope.profile) {
        console.log('offline:: auth :: no data about the user, profile is emppty');
    }

    //var facebookIdNotClean = $scope.profile.user_id; //"facebook|"
    //var facebookId = facebookIdNotClean.replace(/^\D+/g, '');

    //var facebookId = $scope.profile.identities[0].user_id;

//NOTES:
//**** Should I move all AWS S3 to server? it is risky to be in the client?
//****
//****
//****
//****

    $scope.columns = [
        {title: 'Name', field: 'name', visible: true, filter: {'name': 'text'}},
        {title: 'Age', field: 'age', visible: true},
        {title: 'country', field: 'add', visible: true, subfield: 'coun'}
    ];


    $rootScope.Utils = {
        keys: Object.keys
    }

    $scope.openNav = function () {
        document.getElementById("mySidenav").style.width = "420px";
    }

    $scope.closeNav = function () {
        document.getElementById("mySidenav").style.width = "0";
    }


    $scope.user = messages.getUser(); //replace with local service like next line

    //Bug
    //get the mail from storage is not the best way, because after refresh it is deleted, I should change way how to get mail - bug opened in Driver
    //$scope.email = localStorageService.get('email');


    //not relvant anymore belwo 2 lines
    //var email_no_shtrodel = $scope.profile.email.replace('@', 'u0040');
    //var email_no_shtrodel_dot = email_no_shtrodel.replace('.', 'u002E');


    $scope.tripID = messages.getTripID();

    $scope.travelersList = [];
    $scope.data = []; // Travellers from PG DB
    $scope.messages = []; // Tips from Firebase, based on GPS point
    var markers_messages = [];
    $scope.editMode = false;
    $scope.panoViewState = false;
    $scope.panoPosition = '';
    $scope.editButtonText = 'Edit Mode';
    var showMessageOnMap_clicked = false;

    $scope.pathSaved = [];
    $scope.pathLoaded = false;


    //Filter for the tips
    $scope.showAllTips = true;
    $scope.showTips = false;
    $scope.showRisks = false;
    $scope.showExpense = false;
    $scope.showInvite = false;

    $scope.photosSlider = false;
    $scope.tableSlider = true;
    $scope.inforSlide = true;

    $scope.noTripId = false;


    $scope.facebookAlbums = {}; //when page loaded, a Facebook API triggered to get user albums in case new album was added
                                //to show it in edit mode to allow users select the new albums

    $scope.facebookAlbumsFriebase = {}; //sync albums from Firebase config to know what photos to load
    $scope.facebookPhotos = []; //the same photos array used when load the page and when sync the new albums

    //Table
    $scope.table = [];

    //Photo slider
    $scope.prod = {};
    $scope.prod.imagePaths = [];
    $scope.facebookImagesReady = false;

    /* don't now what the below for, disable until error
     $scope.value = undefined;
     */
    //items array used for facebook photos
    $scope.items = [];

    $scope.selectedFacebookAlbum = [];
    $scope.facebookAlbumsList = []; //Facebook albums from Firebase

    $scope.pathHash = [];
    //read albums from Firebase config and then load photos
    //read albums from Firebase for:
    // 1. update edit mode list witht the enabled albums (not to update the list witht the albums list, only if it enabled, reason: could be that the list in facebook more updated)
    // 2. show the photos in Gallery of the enabled photos

    //var firebase_config_get_albums = new Firebase("https://trackerconfig.firebaseio.com/web/" + email_no_shtrodel_dot + "/offline/photos/facebook/trip/" + $scope.tripID);


    //get trip
    var dataTripId = {trip_id: $scope.tripID};
    if ($scope.tripID) { //if no trip id then nothing will work, show message in that case

        dataBaseService.getTripById(dataTripId).then(function (results) {
            $scope.trip = results.data;

            //################################### Fill all fields of Trip definition #########################
            //console.log('end date: ' + $scope.trip[0].end_date);
            //console.log('start day: ' + $scope.trip[0].start_date);
            //console.log('trip desc: ' + $scope.trip[0].trip_description);

            $scope.tripName = $scope.trip[0].trip_name;
            $scope.tripDescription = $scope.trip[0].trip_description;
            //$scope.dateStart = $scope.tripById[0].start_date;
            //$scope.dateEnd = $scope.tripById[0].end_date;

            $scope.dateStart = $filter('date')($scope.trip[0].start_date, 'MMM d, y');
            $scope.dateEnd = $filter('date')($scope.trip[0].end_date, 'MMM d, y');

            //Date to be used for slider, helps to add days on top of start day
            $scope.startDateSlider = new Date($scope.trip[0].start_date);
            $scope.startDateSliderForPath = new Date($scope.trip[0].start_date);

            $scope.facebookId = $scope.trip[0].facebook_id;

            if($scope.trip[0].continent) {
                $scope.continent = $scope.trip[0].continent[0];
            }
            $scope.test = new Date($scope.trip[0].start_date);

            $scope.tripDays = Math.abs(Math.floor(( Date.parse($scope.dateStart) - Date.parse($scope.dateEnd) ) / 86400000));

            $scope.sliderChangeListener = function () {
                //console.log($scope.slider.value);
            };

            //Slider
            $scope.slider = { //requires angular-bootstrap to display tooltips
                value: 0,
                options: {
                    floor: 0,
                    ceil: $scope.tripDays + 1,
                    showTicksValues: true,
                    ticksValuesTooltip: function (v) {
                        return 'Tooltip for ' + v;
                    },
                    onChange: $scope.sliderChangeListener
                }
            };


            $scope.photosSource = $scope.trip[0].photos_provider;

            if ($scope.photosSource == 'aws') {
                $scope.awsProvider = true;
                $scope.facebookProvider = false;
            } else {
                $scope.awsProvider = false;
                $scope.facebookProvider = true;
            }

            //Filter - used to get value from slider to filter tips
            $scope.filterTips = function (day) {
                return function (message) {
                    //console.log('Tips filter, for slider');
                    //console.log($scope.slider);
                    //example:
                    //if day = 1 it means, start day, day = 2, it means start day + 1;

                    //add days number to start date
                    //$scope.selectedDate = new Date($scope.startDateSlider.getDate());

                    var tempDate = new Date($scope.startDateSlider);

                    if ($scope.startDateSlider != null && $scope.slider != null) {
                        $scope.startDateSlider = new Date($scope.startDateSlider.setDate($scope.startDateSlider.getDate() + $scope.slider.value));
                    } else {
                        console.log('Client :: Offline page :: issue with dates while filtering by slider');
                    }


                    //check if item date is equal to the selected date (slider), if yes return true else false
                    //get item date
                    var messageDate = $filter('date')(message.time, 'MMM d, y');
                    var sliderDate = $filter('date')($scope.startDateSlider, 'MMM d, y');

                    if (messageDate == sliderDate) {
                        $scope.startDateSlider = tempDate;
                        return true;
                    }

                    else {
                        $scope.startDateSlider = tempDate;
                        return false;
                    }


                    //else
                    //console.log('FALSE');
                    // console.log(message.time);
                    // console.log($filter('date')(message.time, 'MMM d, y'));
                    // console.log($filter('date')($scope.selectedDate, 'MMM d, y'));


                    // return true;
                }

            };

            //Filter - used to get value from slider to filter map
            /*      $scope.filterTips = function(car)
             {

             };
             */

            //$scope.tripID
            //value to update
            $scope.enableFacebookProvider = function () {
                $scope.awsProvider = false;

                var obj = {trip_id: $scope.tripID, photos_provider: 'facebook'};
                dataBaseService.updateTripPhotosProvider(obj).then(function (results) {
                });
            };

            $scope.enableAwsProvider = function () {
                $scope.facebookProvider = false;

                var obj = {trip_id: $scope.tripID, photos_provider: 'aws'};
                dataBaseService.updateTripPhotosProvider(obj).then(function (results) {
                });
            };


            $scope.filterTipsOnClick = function (filterStr) {
                switch (filterStr) {
                    case 'all':
                    {
                        $scope.showAllTips = true;
                        $scope.showTips = false;
                        $scope.showRisks = false;
                        $scope.filterExpense = false;
                        $scope.showInvite = false;
                        break;
                    }
                    case 'tips':
                    {
                        $scope.showAllTips = false;
                        $scope.showTips = true;
                        $scope.showRisks = false;
                        $scope.showExpense = false;
                        $scope.showInvite = false;
                        break;
                    }
                    case 'risks':
                    {
                        $scope.showAllTips = false;
                        $scope.showTips = false;
                        $scope.showRisks = true;
                        $scope.showExpense = false;
                        $scope.showInvite = false;
                        break;
                    }
                    case 'expense':
                    {
                        $scope.showAllTips = false;
                        $scope.showTips = false;
                        $scope.showRisks = false;
                        $scope.showExpense = true;
                        $scope.showInvite = false;
                        break;
                    }
                    case 'invite':
                    {
                        $scope.showAllTips = false;
                        $scope.showTips = false;
                        $scope.showRisks = false;
                        $scope.showExpense = false;
                        $scope.showInvite = true;
                        break;
                    }
                }
            }


            var firebase_config_get_albums = new Firebase("https://trackerconfig.firebaseio.com/web/" + $scope.facebookId + "/offline/photos/facebook/trip/" + $scope.tripID);


            firebase_config_get_albums.on("value", function (snapshot) {
                //  var i = 0;
                snapshot.forEach(function (childsnapshot) {
                    $scope.facebookAlbumsFriebase[childsnapshot.key()] = {
                        checkbox: childsnapshot.val()['checkbox'],
                        albumID: childsnapshot.val()['albumID'],
                        albumName: childsnapshot.val()['albumName']
                    };

                    //add the albums list from Firebase to the list in edit mode
                    $scope.facebookAlbumsList[childsnapshot.key()] = {
                        id: childsnapshot.key(),
                        label: childsnapshot.val()['albumName'],
                        albumID: childsnapshot.val()['albumID']
                    };

                    //check if album saved in Firebase is enabled, checked = true
                    //if Yes then add the id to the selected list of the List in edit mode
                    //the list will be checked according to the enabled albums
                    if (childsnapshot.val()['checkbox'] == true) {
                        $scope.selectedFacebookAlbum[childsnapshot.key()] = {id: childsnapshot.key()};
                    }
                })

                //load photos from all selected albums
                $scope.facebookPhotos = [];
                var albumLen = Object.keys($scope.facebookAlbumsFriebase).length;
                for (var i = 0; i < albumLen; i++) {
                    if ($scope.facebookAlbumsFriebase[i].checkbox) {
                        Facebook.api(
                            "/" + $scope.facebookAlbumsFriebase[i].albumID + "/photos?access_token=" + $scope.userAccessToken,
                            function (album) {
                                if (album && !album.error) {
                                    //console.log('photos');
                                    for (var photoIndex = 0; photoIndex < album.data.length; photoIndex++) {
                                        Facebook.api(
                                            "/" + album.data[photoIndex].id + "/picture?access_token=" + $scope.userAccessToken,
                                            function (photo) {
                                                if (photo && !photo.error) {
                                                    /* handle the result */
                                                    //console.log(photo.data.url);
                                                    $scope.facebookPhotos.push(photo.data.url);
                                                    $scope.prod.imagePaths.push({
                                                        custom: photo.data.url,
                                                        thumbnail: photo.data.url
                                                    });
                                                    $scope.items.push({id: i, name: 'item' + i, img: photo.data.url});
                                                }
                                            });
                                        if (photoIndex == album.data.length - 1) {
                                            $scope.facebookImagesReady = true;
                                            //console.log('ready');
                                            //$scope.$apply();
                                        }
                                    }
                                }
                            });
                    }
                }
            }, function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });


            /* for testing

             Facebook.api(
             "/"+facebookId+"/permissions?access_token="+$scope.userAccessToken,
             function (response) {
             if (response && !response.error) {

             }
             }
             );
             */

            //get all facebook user albums
            //read albums from Facebook for:
            // 1. update edit mode list witht he enabled albums

            Facebook.api(
                "/" + $scope.facebookId + "/albums?access_token=" + $scope.userAccessToken,
                function (response) {
                    if (response && !response.error) {
                        /* handle the result */
                        // console.log(response);
                        for (var i = 0; i < response.data.length; i++) {
                            $scope.facebookAlbums[i] = {
                                checkbox: false,
                                albumID: response.data[i].id,
                                albumName: response.data[i].name
                            };
                            //$scope.facebookAlbumsList[i] = ({albumID: response.data[i].id, albumName: response.data[i].name, checkbox: false});
                        }
                    }
                    //$scope.$apply();
                }
            );

            // MultiSelect Drop down select - Event - Facebook albums
            $scope.selectAlbumEvents = {
                onItemSelect: function (property) {
                    console.log('select > ' + property);
                    console.log(property);
                    //update albums array that will be saved in Firebase
                    $scope.facebookAlbums[property.id] = {
                        checkbox: true,
                        albumID: property[property.id].albumID,
                        albumName: response[property.id].albumName
                    }
                    console.log($scope.facebookAlbums);
                },

                onItemDeselect: function (property) {
                    console.log('deselect : ' + property);
                    $scope.facebookAlbums[property.id] = {
                        checkbox: false,
                        albumID: property[property.id].albumID,
                        albumName: response[property.id].albumName
                    }
                    console.log($scope.facebookAlbums);
                },
                onSelectAll: function (property) {
                    console.log('select all : ' + property);
                    //create a new array from scratch with checkbox = true
                    for (var index = 0; index < property.length; index++) {
                        $scope.facebookAlbums[index] = {
                            checkbox: true,
                            albumID: property[index].albumID,
                            albumName: response[index].albumName
                        }
                    }
                    console.log($scope.facebookAlbums);
                },
                onDeselectAll: function (property) {
                    console.log('deselect all : ' + property);
                    //create a new array from scratch with checkbox = false
                    for (var index = 0; index < property.length; index++) {
                        $scope.facebookAlbums[index] = {
                            checkbox: false,
                            albumID: property[index].albumID,
                            albumName: response[index].albumName
                        }
                    }
                    console.log($scope.facebookAlbums);
                }
            }


            // Get a Firebase database reference to our posts
            var firebase_ref = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID);


            if ($scope.facebookId == '' || $scope.tripID == '')
                alert('no facebook id or trip id')
            //AWS Config
            AWS.config.credentials = new AWS.Credentials('AKIAIGEOPTU4KRW6GK6Q', 'VERZVs+/nd56Z+/Qxy1mzEqqBwUS1l9D4YbqmPoO');

            // Configure your region
            AWS.config.region = 'us-west-2';

            // below AWS S3 code used to get photos and show in offline page
            var S3URL = 'https://s3-us-west-2.amazonaws.com/';
            $scope.photos = [];


            Facebook.getLoginStatus(function (response) {
                if (response.status == 'connected') {
                    console.log('user is connected')
                }
            });

            //var facebookToken = localStorageService.get('facebookAuth').authResponse.accessToken;


            //Sync Facebook albums
            $scope.syncAlbums = function () {
                //save in Firebase config
                var firebase_config_albums = new Firebase("https://trackerconfig.firebaseio.com/web/" + $scope.facebookId + "/offline/photos/facebook/trip/" + $scope.tripID);
                firebase_config_albums.set($scope.facebookAlbums);

                $scope.facebookPhotos = [];
                var coverSelected = false;
                //console.log($scope.facebookAlbums);
                var albumLen = Object.keys($scope.facebookAlbums).length;
                for (var i = 0; i < albumLen; i++) {
                    if ($scope.facebookAlbums[i].checkbox) {

                        if (!coverSelected) {
                            //get album cover photo and save in Firebase config to allow the trip cove be updated
                            //save cover photo only from the first album
                            Facebook.api(
                                "/" + $scope.facebookAlbums[i].albumID + "/picture",
                                function (cover) {
                                    if (cover && !cover.error) {
                                        //console.log("https://trackerconfig.firebaseio.com/web/" + facebookId + "/tripslist/coverphoto/trip/" + $scope.tripID);
                                        //save Facebook album cover in Firebase
                                        var firebase_config_coverPhoto = new Firebase("https://trackerconfig.firebaseio.com/web/" + facebookId + "/tripslist/coverphoto/trip/" + $scope.tripID);
                                        firebase_config_coverPhoto.set(cover.data.url);
                                    }
                                });
                            coverSelected = true;
                        }

                        //load photos from all selected albums
                        Facebook.api(
                            "/" + $scope.facebookAlbums[i].albumID + "/photos",
                            function (album) {
                                if (album && !album.error) {
                                    //console.log('photos');
                                    for (var photoIndex = 0; photoIndex < album.data.length; photoIndex++) {
                                        Facebook.api(
                                            "/" + album.data[photoIndex].id + "/picture",
                                            function (photo) {
                                                if (photo && !photo.error) {
                                                    //console.log(photo.data.url);
                                                    $scope.facebookPhotos.push(photo.data.url);
                                                    //console.log($scope.facebookAlbums);
                                                }
                                            });
                                    }
                                }
                            });
                    }
                }
            }

            //var bucket = new AWS.S3({params: {Bucket: 'tracker.photos', Marker: $scope.email + '/' + $scope.tripID}});

            var bucket = new AWS.S3({
                params: {
                    Bucket: 'tracker.photos',
                    //Marker: localStorageService.get('email') + '/' + chunk.id
                    Delimiter: '/',
                    Prefix: $scope.facebookId + '/' + $scope.tripID + '/'
                }
            });

            bucket.listObjects(function (err, data) {
                if (err) {
                    document.getElementById('status').innerHTML =
                        'Could not load objects from S3';
                } else {
                    //document.getElementById('status').innerHTML =
                    //'Loaded ' + data.Contents.length + ' items from S3';
                    for (var i = 0; i < data.Contents.length; i++) {
                        var photo_extenstion = data.Contents[i].Key.split('.').pop();

                        if (photo_extenstion == "gif" || photo_extenstion == "png" || photo_extenstion == "bmp" || photo_extenstion == "jpeg" || photo_extenstion == "jpg"
                            || photo_extenstion == "GIF" || photo_extenstion == "PNG" || photo_extenstion == "BMP" || photo_extenstion == "GPEG" || photo_extenstion == "JPG") {

                            $scope.photos.push(S3URL + 'tracker.photos/' + data.Contents[i].Key);
                        }
                        //$scope.$apply(); becaus of disableing this, AWS images for the will not be rendered directly after upload, only when refresh
                    }
                }
            });

            //upload file to AWS S3
            var bucket_upload = new AWS.S3({params: {Bucket: 'tracker.photos'}});// should I use a new bucket variable?

            var fileChooser = document.getElementById('file-chooser');
            var button = document.getElementById('upload-button');
            var results = document.getElementById('results');
            button.addEventListener('click', function () {
                var file = fileChooser.files[0];

                //if it's a KML file then override the exists one, save it in the same name
                var file_extenstion = file.name.split('.').pop();
                if (file_extenstion == 'kml' || file_extenstion == 'KML') {

                    if (file) {
                        results.innerHTML = '';

                        var params = {
                            Key: $scope.facebookId + '/' + $scope.tripID + '/' + 'map_kml.kml',
                            ContentType: file.type,
                            Body: file
                        };
                        bucket_upload.upload(params, function (err, data) {
                            results.innerHTML = err ? 'ERROR!' : 'UPLOADED.';
                        });
                    } else {
                        results.innerHTML = 'Nothing to upload.';
                    }
                }
                if (file_extenstion == "gif" || file_extenstion == "png" || file_extenstion == "bmp" || file_extenstion == "jpeg" || file_extenstion == "jpg"
                    || file_extenstion == "GIF" || file_extenstion == "PNG" || file_extenstion == "BMP" || file_extenstion == "GPEG" || file_extenstion == "JPG") {

                    if (file) {
                        results.innerHTML = '';
                        /*  var params = {
                         Key: $scope.profile.email + '/' + $scope.tripID + '/' + file.name,
                         ContentType: file.type,
                         Body: file
                         };*/
                        var params = {
                            Key: $scope.facebookId + '/' + $scope.tripID + '/' + file.name,
                            ContentType: file.type,
                            Body: file
                        };
                        bucket_upload.upload(params, function (err, data) {
                            results.innerHTML = err ? 'ERROR!' : 'UPLOADED.';
                        });
                    } else {
                        results.innerHTML = 'Nothing to upload.';
                    }
                } else {
                    alert('file not supported')
                }
            }, false);


            var users_hash = {};
            var polys = []; // will hold poly for each user


            //$scope.init = function () {
            var trackCoordinates = []; // for new GPS points


            //************************* Map settings ****************************
            //*******************************************************************

            $scope.map;
            $scope.lastGPSpoint = "";

            //Map configuration
            $scope.map = new google.maps.Map(document.getElementById('map'), {
                //center: {lat: 34.397, lng: 40.644},
                center: {lat: 0, lng: 0},
                zoom: 4,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.LEFT_CENTER
                },
                mapTypeId: google.maps.MapTypeId.TERRAIN,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.LEFT_CENTER
                },
                scaleControl: true,
                streetViewControl: false,
                streetViewControlOptions: {
                    position: google.maps.ControlPosition.LEFT_TOP
                }
            });

            var drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType.MARKER,
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.LEFT_CENTER,
                    drawingModes: ['marker', 'circle', 'polygon', 'polyline', 'rectangle']
                },
                markerOptions: {icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'},
                circleOptions: {
                    fillColor: '#ffff00',
                    fillOpacity: 1,
                    strokeWeight: 5,
                    clickable: false,
                    editable: true,
                    zIndex: 1
                }
            });

            drawingManager.setMap($scope.map);


            $scope.map.addListener('click', function (e) {
                $scope.message = {lat: e.latLng.lat(), lng: e.latLng.lng()};
                //$scope.$apply(); I don't know what will be the behave after disable this
            });

            var ctaLayer = new google.maps.KmlLayer({
                url: 'https://s3-us-west-2.amazonaws.com/tracker.photos/' + $scope.facebookId + '/' + $scope.tripID + '/map_kml.kml',
                map: $scope.map
            });

            $scope.showMessageOnMap = function (message) {

                if ($scope.editMode == false) {

                    if (message.location.coords) {
                        var Latlng_message = {
                            lat: message.location.coords.latitude,
                            lng: message.location.coords.longitude
                        };

                        //Help function - show item on map
                        showItemOnMap(Latlng_message, message);
                    }

                    /*    $timeout(function () {
                     $scope.map.setZoom(5);
                     }, 10000);*/


                    /*        //#646c73
                     if (showMessageOnMap_clicked == false) {
                     showMessageOnMap_clicked = true;
                     var Latlng_message = {lat: message.location.coords.latitude, lng: message.location.coords.longitude};

                     //Help function - show item on map
                     showItemOnMap(Latlng_message, message);

                     } else {
                     showMessageOnMap_clicked = false;
                     //if clicked again, the marker should deleted and back the zoom to normal
                     $scope.map.setZoom(5);
                     }*/
                }
            }


            $scope.showPhotoOnMap = function (image) {
                //console.log(image.currentTarget.childNodes[1]);
                var img = image.currentTarget.childNodes[1];  //the second element is IMG, should add validation
                if ($scope.editMode == true) {
                    //if Edit mode enabled then ask the user to set the GPS lat lng for the photos
                    addGPStoPhoto(img);
                } else if ($scope.editMode == false) {
                    if (img) {
                        EXIF.getData(img, function () {
                            var make = EXIF.getTag(img, "Make"),
                                model = EXIF.getTag(img, "Model");
                            GPS_lat = EXIF.getTag(img, "GPSLatitude");
                            GPS_lng = EXIF.getTag(img, "GPSLongitude");

                            // alert("I was taken by a " + make + " " + model);
                            // alert("GPSLongitude " + GPS);

                            var toDecimal = function (number) {
                                return number[0].numerator + number[1].numerator /
                                    (60 * number[1].denominator) + number[2].numerator / (3600 * number[2].denominator);
                            };

                            if (GPS_lat && GPS_lng) {

                                //console.log("lat: " + toDecimal(GPS_lat) + "  lng: " + toDecimal(GPS_lng));
                                // alert("toDecimal " + toDecimal(GPS[1])  );

                                var photo_lat_lng = {lat: toDecimal(GPS_lat), lng: toDecimal(GPS_lng)};

                                //Help function - show item on map
                                showItemOnMap(photo_lat_lng, null);

                            } else {
                                console.log('No GPS point embed to photo ' + img);
                                console.log('Check if image have GPS point that was added by user and saved to AWS S3 with the photo');
                                var file_path = img.currentSrc;

                                var filename = file_path.replace(/^.*[\\\/]/, '');
                                var file_noExtenstion = filename.replace(/\.[^/.]+$/, "");


                                // var bucket_getGPS_forPhoto = new AWS.S3({params: {Bucket: 'tracker.photos', Marker: $scope.email + '/' + $scope.tripID + '/' + file_noExtenstion +'.txt'}});


                                var fileGpsUrl = S3URL + 'tracker.photos/' + $scope.facebookId + '/' + $scope.tripID + '/' + file_noExtenstion + '.txt';
                                //console.log(fileGpsUrl);

                                // get GPS point of the selected photo from AWS S3
                                $http({
                                    method: 'GET',
                                    url: fileGpsUrl
                                }).then(function successCb(response) {
                                    console.dir(response);

                                    showItemOnMap({lat: response.data.lat, lng: response.data.lng}, null);


                                }, function errorCb(response) {
                                    console.log('No GPS point in AWS S3 for this photo');
                                });
                            }
                        });
                    }
                }
            }

            var showItemOnMap = function (Latlng, message) {

                //Google panorama street view - update with new position
                $scope.panoPosition = Latlng;
                //if pano view already opened, then reload, else just update position as done in top of this row
                if ($scope.panoViewState == true) {
                    $scope.panoViewState = false;
                    $scope.panoView();
                }

                //var myLatlng = {lat: message.latitude, lng: message.longitude};
                console.log('showItemOnMap function :: ' + 'lat:' + Latlng.lat + '     lng: ' + Latlng.lng);

                if ($scope.editMode == false) {
                    if (Latlng.lat && Latlng.lng) {

                        $scope.map.setCenter(Latlng);
                        //smoothZoom($scope.map, 7, $scope.map.getZoom()); // call smoothZoom, parameters map, final zoomLevel

                        //new google.maps.LatLng(-34, 151)

                        var title = '';
                        if (message.message.tip != '') {
                            title = message.message.tip;
                        }
                        if (message.message.risk) {
                            title = 'Risk';
                        }
                        if (message.message.price) {
                            title = message.message.price;
                        }
                        if (message.message.invite) {
                            title = 'Invitation';
                        }


                        var marker_message = new google.maps.Marker({
                            position: Latlng,
                            map: $scope.map,
                            title: null
                        });
                        markers_messages.push(marker_message);

                        var infowindow_message = new google.maps.InfoWindow({
                            content: title
                        });

                        infowindow_message.open($scope.map, marker_message);

                        var zoom_time = 3000;
                        $scope.countdown = 100;
                        setTimeout(function () {
                            smoothZoom($scope.map, 12, $scope.map.getZoom())
                        }, 1000); // call smoothZoom, parameters map, final zoomLevel

                    }
                }
            }


            var addGPStoPhoto = function (img) {
                //get gps point from map and then

                //$scope.message
                $scope.image = {
                    path: img.currentSrc
                }


            }

            $scope.saveGPStoThisPhoto = function () {
                //create a file and save it in AWS S3 with the same name of the photo with new extension name

                //create file

                var bucket_create_photo_gps = new AWS.S3({params: {Bucket: 'tracker.photos'}});

                var gps_point = {lat: $scope.message.lat, lng: $scope.message.lng};
                var button = document.getElementById('addGPStoPhoto');
                var results = document.getElementById('results_photo_gps');
                // button.addEventListener('click', function() {
                //    results.innerHTML = '';

                var filename = $scope.image.path.replace(/^.*[\\\/]/, '');
                var file_noExtenstion = filename.replace(/\.[^/.]+$/, "");

                console.log(file_noExtenstion);

                var params = {
                    Key: $scope.facebookId + '/' + $scope.tripID + '/' + file_noExtenstion + '.txt',
                    Body: JSON.stringify(gps_point)
                };
                bucket_create_photo_gps.upload(params, function (err, data) {
                    results.innerHTML = err ? 'ERROR!' : 'SAVED.';
                });
                // }, false);

            }

            $scope.editModeSwitch = function () {
                $scope.editMode = !$scope.editMode;
                if ($scope.editMode == true) {
                    $scope.editButtonText = 'View Mode';
                    $scope.openNav();
                }
                else {
                    $scope.editButtonText = 'Edit Mode';
                    $scope.closeNav();
                }
            }

            $scope.panoView = function () {
                if ($scope.panoViewState == false) {

                    // var path = polys[].getPath();
                    /*    $scope.panorama = new google.maps.StreetViewPanorama(
                     document.getElementById('pano'), {
                     position: path.pop()
                     });*/

                    $scope.panorama = new google.maps.StreetViewPanorama(
                        document.getElementById('pano'), {
                            position: $scope.panoPosition
                        })

                    $scope.map.setStreetView($scope.panorama);

                    document.getElementById("pano").style.width = "50%";
                    $scope.panoViewState = true;
                } else {
                    document.getElementById("pano").style.width = "0%";
                    document.getElementById("map").style.width = "100%";
                    $scope.panoViewState = false;
                }

            }

            //**********************  load Tips from Firebase ******************
            //******************************************************************
            //******************************************************************
            var firebase_ref_readTips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/messages');

            firebase_ref_readTips.on("value", function (snapshot) {
                $scope.messages = [];

                $scope.progressbar = ngProgressFactory.createInstance();
                $scope.progressbar.start();

                snapshot.forEach(function (childSnapshot) {
                    //var key = childSnapshot.key();
                    var childData = childSnapshot.val(); // childData = location and message and time
                    //$scope.messages.unshift(childData['message']);
                    $scope.messages.unshift(childData);
                });
                //$scope.$apply();
                $scope.progressbar.stop();
            }, function (errorObject) {
                console.log("Read Tips from Firebase failed: " + errorObject.code);
            });


            //************ animate path **************************

   // Use the DOM setInterval() function to change the offset of the symbol
      // at fixed intervals.
      function animateCircle(line) {
          var count = 0;
          window.setInterval(function() {
            count = (count + 1) % 200;

            var icons = line.get('icons');
            icons[0].offset = (count / 2) + '%';
            line.set('icons', icons);
        }, 300);
      }

            $scope.runPathAnimation = function () {
                polys[$scope.facebookId].setMap(null);

                // Define the symbol, using one of the predefined paths ('CIRCLE')
                // supplied by the Google Maps JavaScript API.
                var lineSymbolCircle = {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    strokeColor: '#393'
                };

                 polys[$scope.facebookId] = new google.maps.Polyline({
                     map: $scope.map,
                     path: $scope.pathHash[$scope.slider.value],
                     icons: [{
                         icon: lineSymbolCircle,
                         offset: '100%'
                     }]
                });
                 animateCircle(polys[$scope.facebookId]);
            }
            //}

            //****************************************************



            //************************
            //*******************************handle paths
            //*******************************************************************
            //path for each user
            var path = [];
            var ref_read_path = new Firebase('https://luminous-torch-9364.firebaseio.com/web/users/' + $scope.facebookId + '/' + $scope.tripID + '/path');

            //read path for user 'users.key()' trip 'trip.key()' that have active trip
            var firstLoad_paths = true;
            var i = 0;
         //   var prevPoint = '';
          //  var anomalyDetected = false;
           // var lastNormalPoint = '';
            //.limitToFirst(250)
            ref_read_path.once("value", function (tripPath) {
                var pathLen = tripPath.length;
                tripPath.forEach(function (point) {
                    i++;
                    //console.log(i);
                    //console.log(point.val());
                    //console.log(point.val()['timestamp']);
                    //var x = new Date(point.val()['timestamp']);
                    //console.log(x);
                    //console.log(x.getDate());
                    //if(x.getDate()== 30){
                    //  console.log(i);
                    //  console.log(point.val());
                    //}

//                    if(i>2){
  //                      if(removeAnomaly(prevPoint, point.val(), anomalyDetected)){
                            //if (i < 165 || i > 300) {
                            //console.log(i);
                            path.push({
                                lat: JSON.parse(point.val()['coords'].latitude),
                                lng: JSON.parse(point.val()['coords'].longitude)
                            });
                            //} else {
                            //console.log(point.val()['coords'].latitude)
                            //console.log(point.val()['coords'].longitude)
                            //console.log('**************')
                            //}
                            //path.push({
                            //  lat: JSON.parse(point.val()['coords'].latitude),
                            //  lng: JSON.parse(point.val()['coords'].longitude)
                            //});
                            //all path saved to be used later for slider filter, instead of calling Firebase api again
                            $scope.pathSaved.push(point.val());


                     //   }else{
                       //     console.log('anomaly detected while preparing path on map');
                        //}
                 //   }

                   // prevPoint = point.val();

                });

                $scope.pathHash[0] = path;
                //enable page after path is ready on the map
                $scope.loading = false;
                $scope.$apply();

                $scope.panoPosition = path.pop();

                //set the path for the first load, for the real time load, I added the same code into the listener of Firebase above
                //dashed line
                /*
                 var iconsetngs = {
                 path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                 strokeColor: "#FF0000"
                 };
                 */

                var lineSymbol = {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 4,
                };

                //Hash table for all users path
                polys[$scope.facebookId] = new google.maps.Polyline({
                    //map: $scope.map,
                    path: path,
                    geodesic: true,
                    //strokeColor: '#000000', //getRandomColor(), #E38C2D
                    strokeColor: '#000000',
                    strokeOpacity: 0,
                    strokeWeight: 2,
                    icons: [{
                        icon: lineSymbol,
                        offset: '0',
                        repeat: '20px'
                    }]
                });

                polys[$scope.facebookId].setMap($scope.map);
                $scope.pathLoaded = true;
                $scope.map.setCenter(path.pop());
                $scope.map.setZoom(12);


                //Keep listening to new GPS point added by users
                ref_read_path.limitToLast(1).on("value", function (tripPath) {
                    if (firstLoad_paths == false) {

                        // get existing path
                        var existsPath = polys[$scope.facebookId].getPath();

                        tripPath.forEach(function (point) {

                            // add new point
                            existsPath.push(new google.maps.LatLng(JSON.parse(point.val()['coords'].latitude), JSON.parse(point.val()['coords'].longitude)));

                        });

                        polys[$scope.facebookId].setPath(existsPath);

                        //$scope.$apply();
                    }
                    firstLoad_paths = false;
                })

            })


            //Filter map according to the selected day in the
            //each time $scope.slider.value changes then filter map and then apply
            $scope.$watch('slider.value', function () {

                if (!$scope.pathLoaded) {
                    $timeout(function () {
                        $scope.pathLoaded = true;
                    });
                } else {

                    console.log('Filter map');
                    var filteredPath = [];

                    var tempDate = new Date($scope.startDateSliderForPath); //first day of the trip

                    //if slider value = 0 then start date will not changed, but we can't say 0 for day number 1 in the trip
                    //therefore I will add +1 for each slider value
                    //for the 0 I will use it to bring all trip up with all the data

                    if ($scope.slider.value == 0) {
                        for (var i = 0; i < $scope.pathSaved.length; i++) {
                            filteredPath.push({
                                lat: JSON.parse($scope.pathSaved[i]['coords'].latitude),
                                lng: JSON.parse($scope.pathSaved[i]['coords'].longitude)
                            });
                        }

                        var lineSymbol = {
                            path: 'M 0,-1 0,1',
                            strokeOpacity: 1,
                            scale: 4
                        };

                        //Hash table for all users path

                        //delete current path
                        if (polys[$scope.facebookId]) {
                            polys[$scope.facebookId].setMap(null);
                        }

                        //save path after was sliced from full path for further use
                        if ($scope.slider.value) {
                            $scope.pathHash[$scope.slider.value] = filteredPath;
                        }

                        polys[$scope.facebookId] = new google.maps.Polyline({
                            //map: $scope.map,
                            path: filteredPath,
                            geodesic: true,
                            strokeColor: '#000000', //getRandomColor(),
                            strokeOpacity: 0,
                            strokeWeight: 2,
                            icons: [{
                                icon: lineSymbol,
                                offset: '0',
                                repeat: '20px'
                            }]
                        });

                        polys[$scope.facebookId].setMap($scope.map);
                        $scope.map.setCenter(filteredPath.pop());
                        //$scope.map.setCenter(filteredPath[filteredPath.length / 2]);
                        $scope.map.setZoom(12);

                    } else {
                        //if slider value not 0 then calculate the required date by adding slider value to start date

                        if ($scope.startDateSliderForPath != null && $scope.slider != null) {
                            $scope.startDateSliderForPath = new Date($scope.startDateSliderForPath.setDate($scope.startDateSliderForPath.getDate() + $scope.slider.value - 1));
                        } else {
                            console.log('Client :: Offline page :: issue with dates while in the watcher of the slider');
                        }


                        //I should read from path, that already set and ready, but meanwhile I saved only lat, lang in path instaed of all the point
                        /*  var ref_read_path_filter = new Firebase('https://luminous-torch-9364.firebaseio.com/web/users/' + facebookId + '/' + $scope.tripID + '/path');

                         ref_read_path_filter.once("value", function (path) {
                         path.forEach(function (point) {

                         //console.log(point.val());
                         var pointTime = $filter('date')(point.val()['timestamp'], 'MMM d, y');
                         var selectedDatePath = $filter('date')($scope.startDateSliderForPath, 'MMM d, y');

                         if (pointTime == selectedDatePath) {
                         filteredPath.push({
                         lat: JSON.parse(point.val()['coords'].latitude),
                         lng: JSON.parse(point.val()['coords'].longitude)
                         });
                         }

                         });*/


                        for (var i = 0; i < $scope.pathSaved.length; i++) {
                            var pointTime = $filter('date')($scope.pathSaved[i]['timestamp'], 'MMM d, y');
                            var selectedDatePath = $filter('date')($scope.startDateSliderForPath, 'MMM d, y');

                            if (pointTime == selectedDatePath) {
                                filteredPath.push({
                                    lat: JSON.parse($scope.pathSaved[i]['coords'].latitude),
                                    lng: JSON.parse($scope.pathSaved[i]['coords'].longitude)
                                });
                            }
                        }


                        $scope.startDateSliderForPath = tempDate;

                        //update map with filtered path
                        //set the path for the first load, for the real time load, I added the same code into the listener of Firebase above
                        //dashed line
                        var lineSymbol = {
                            path: 'M 0,-1 0,1',
                            strokeOpacity: 1,
                            scale: 4
                        };

                        //Hash table for all users path

                        //delete current path
                        if (polys[$scope.facebookId]) {
                            polys[$scope.facebookId].setMap(null);
                        }

                        if ($scope.slider.value) {
                            $scope.pathHash[$scope.slider.value] = filteredPath;
                        }


                        polys[$scope.facebookId] = new google.maps.Polyline({
                            path: filteredPath,
                            geodesic: true,
                            strokeColor: '#000000', //getRandomColor(),
                            strokeOpacity: 0,
                            strokeWeight: 2,
                            icons: [{
                                icon: lineSymbol,
                                offset: '0',
                                repeat: '20px'
                            }]
                        });

                        polys[$scope.facebookId].setMap($scope.map);
                        $scope.map.setCenter(filteredPath.pop());
                        //console.log(filteredPath.length/2);
                        //console.log(filteredPath[filteredPath.length/2]);
                        //$scope.map.setCenter(new google.maps.LatLng(JSON.parse(filteredPath[filteredPath.length/2].lat), JSON.parse(filteredPath[filteredPath.length/2].lng)));
                        $scope.map.setZoom(12);


                    }


                }


            });


            //load Table from Firebase
            var firebase_ref_readTable = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/table');

            firebase_ref_readTable.on("value", function (snapshot) {
                $scope.table = []; //reset table
                snapshot.forEach(function (childSnapshot) {
                    // key will be "fred" the first time and "barney" the second time
                    var key = childSnapshot.key();
                    // childData will be the actual contents of the child
                    var childData = childSnapshot.val();

                    var day = {};
                    day[key] = childData;
                    $scope.table.push(day);
                });
                //$scope.$apply();

            }, function (errorObject) {
                console.log("Read Table from Firebase failed: " + errorObject.code);
            });


            // ###################################################################
            // Edit Mode - Start
            // ##################################################################

            $scope.addDay = function () {
                console.log('Offline page:: add day');
                console.log($scope.day);

                var firebase_table = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + "/" + $scope.tripID + "/table/" + $scope.day.dayNumber);
                firebase_table.set($scope.day);
            }

            $scope.addMessage = function () {
                // add a new note to firebase
                var message_json = {};

                var firebase_tips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/messages');

                //var usersRef = firebase_ref.child('history');

                var location = {coords: {latitude: $scope.message.lat, longitude: $scope.message.lng}};
                message_json = {
                    location: location,
                    time: $scope.message.time,
                    email: '',
                    message: {tip: $scope.message.text, invite: '', risk: '', price: ''}
                };

                firebase_tips.push(message_json);
            }

            // ###################################################################
            // Edit Mode - End
            // ##################################################################


            //*******************************************************************************************************
            //Help functions
            //Read text file from AWS S3
            //no need for the below fun I used $http req
            var readTextFile = function (file) {
                var file_content = '';
                var rawFile = new XMLHttpRequest();
                rawFile.open("GET", file, true);
                rawFile.onreadystatechange = function () {
                    if (rawFile.readyState === 4) {
                        if (rawFile.status === 200 || rawFile.status == 0) {
                            var allText = rawFile.responseText;
                            file_content = allText;
                        }
                    }
                }
                rawFile.send(file_content);
            }


            //this function used for get the unicode (testing)
            function toUnicode(theString) {
                var unicodeString = '';
                for (var i = 0; i < theString.length; i++) {
                    var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
                    while (theUnicode.length < 4) {
                        theUnicode = '0' + theUnicode;
                    }
                    theUnicode = '\\u' + theUnicode;
                    unicodeString += theUnicode;
                }
                return unicodeString;
            }

            // the smooth zoom function
            function smoothZoom(map, max, cnt) {
                if (cnt >= max) {
                    return;
                }
                else {
                    z = google.maps.event.addListener(map, 'zoom_changed', function (event) {
                        google.maps.event.removeListener(z);
                        smoothZoom(map, max, cnt + 1);
                    });
                    setTimeout(function () {
                        map.setZoom(cnt)
                    }, 80); // 80ms is what I found to work well on my system -- it might not work well on all systems
                }
            }

        });


    } else {

        $scope.noTripId = true;
        $state.go('trips');
    }


})
.directive('lightgallery', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (scope.$last) {

                // ng-repeat is completed
                element.parent().lightGallery({
                    thumbnail:true
                });
            }
        }
    };
});

/*
 .directive('infiniteScroll', function () {
 return {
 restrict: 'A',
 scope: {
 ajaxCall: '&'
 },
 link: function (scope, elem, attrs) {
 box = elem[0];
 elem.bind('scroll', function () {
 if ((box.scrollTop + box.offsetHeight) >= box.scrollHeight) {
 scope.$apply(scope.ajaxCall)
 }
 })
 }
 }
 })
 */

//*********************************************
//**************** Help functions *************
//*********************************************

//help function
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

