// Google API
// ----------

(function() {
    // Font family definitions
    WebFontConfig = {
        google : {
            families : [ 
                'Droid+Sans', 
                'Crushed', 
                'Dancing+Script', 
                'Dawning+of+a+New+Day', 
                'Waiting+for+the+Sunrise', 
                'Tangerine', 
                'Smythe', 
                'Cuprum', 
                'Arvo', 
                'Irish+Grover',
                'Goudy+Bookletter+1911',
                'Ubuntu', 
                'Sue+Ellen+Francisco', 
                'Kreon' 
            ]
        }
    };
    var wf   = document.createElement('script'),
        s    = document.getElementsByTagName('script')[0];
    wf.src   = '//ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type  = 'text/javascript';
    wf.async = 'true';
    s.parentNode.insertBefore(wf, s);
})();