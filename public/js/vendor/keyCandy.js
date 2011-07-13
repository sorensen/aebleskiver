/*
 * Key Candy makes your web app melt in your hands not on your mouse!
 * Provides tooltips for elements with accesskey attributes and focuses/activates
 * elements with an accesskey in a standardized, cross-browser, cross-platform way.
 */
/*! (c) 2011 Aaron McCall. 
 *  Contributors: Beau Sorenson
 *  MIT license (see http://creativecommons.org/licenses/MIT/). 
 */
KeyCandy = (function($){
    var pub = {},
    _target,
    _class = 'keycandy',
    _remove_class = 'removeClass',
    _has_class = 'hasClass',
    _default_parent = 'body',
    _control_key = 17,
    _remove_key = 27,
    _tooltip_toggler = function(event){
        var $class_target = (_target) ? $(_target) : $(_default_parent),
            _target = event.target,
            _tag = _target.tagName.toLowerCase(),
            $target = $(_target),
            _code = event.keyCode,
            _valid_accesskey = (_code > 46 && _code < 91),
            _typeable = _tag === 'textarea' || (_tag === 'input' && /text|password/.test(_target.type) > -1);
        if (_code === _control_key && event.type == 'keydown' && !_typeable) {
            $class_target.addClass(_class);
        } else {
            if ($class_target[_has_class](_class) && event.type == 'keyup' && !_typeable) {
                if (_code == _remove_key || _valid_accesskey) {
                    if (_valid_accesskey) {
                        var _selector = '[accesskey="' + String.fromCharCode(_code) + '"]',
                            $el = $(_selector, '.' + _class);
                        if ($el.length) {
                            $el = ($el.is('label')) ? $('#' + $el.attr('for')) : $el;
                            var _action = $el.is(':text, :password, textarea, select')?'focus':'click';
                            if ($el.is('a')) {
                                // Ensure the link has an href before changing location
                                $el.one('click', function(){ this.href && (location.href = this.href) });
                            }
                            $el.trigger(_action);
                        }
                    }
                    $class_target[_remove_class](_class);
                }
            }
        }
    },
    init = function(_parent, opt){
        opt || (opt = {});
        
        // Control key and menu removal key overrides
        opt.controlKey && (_control_key = opt.controlKey);
        opt.removeKey  && (_remove_key = opt.removeKey);
        
        _target = _parent || _default_parent;
        $(window).bind('keydown keyup', _tooltip_toggler);
        $(_target).click(function(){
          var $this = $(this);
          if ($this[_has_class](_class)) $this[_remove_class](_class);
        });
    };
    pub = {
        version: '0.7',
        'init': init
    };
    return pub;
})($ || jQuery);